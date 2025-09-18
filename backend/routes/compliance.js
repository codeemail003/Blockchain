const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validationRules, complianceSchemas, validateJoi } = require('../middleware/validation');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../middleware/errorHandler');
const blockchainService = require('../services/blockchainService');
const databaseService = require('../services/databaseService');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/compliance/checks:
 *   post:
 *     summary: Add compliance check
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateComplianceCheckRequest'
 *     responses:
 *       201:
 *         description: Compliance check created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ComplianceRecord'
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/checks',
  authenticate,
  authorize(['auditor', 'compliance_officer', 'quality_manager', 'admin']),
  validateJoi(complianceSchemas.createCheck),
  asyncHandler(async (req, res) => {
    const complianceData = req.body;
    
    // Add compliance check on blockchain
    const transaction = await blockchainService.addComplianceCheck(complianceData);
    
    // Save compliance record to database
    const dbComplianceData = {
      record_id: parseInt(transaction.recordId || Date.now()), // Fallback if not returned
      batch_id: complianceData.batchId,
      check_type: complianceData.checkType,
      status: 0, // PENDING
      passed: false,
      auditor: req.user.address,
      notes: complianceData.notes,
      findings: complianceData.findings,
      corrective_actions: complianceData.correctiveActions,
      evidence_hashes: complianceData.evidenceHashes || [],
      additional_data: complianceData.additionalData || {}
    };

    const dbRecord = await databaseService.createComplianceRecord(dbComplianceData);
    
    logger.audit('create_compliance_check', 'compliance', req.user.id, {
      batchId: complianceData.batchId,
      checkType: complianceData.checkType,
      txHash: transaction.txHash
    });

    sendSuccessResponse(res, {
      ...dbRecord,
      transaction
    }, 'Compliance check created successfully', 201);
  })
);

/**
 * @swagger
 * /api/compliance/checks/{recordId}:
 *   get:
 *     summary: Get compliance record by ID
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Compliance record ID
 *     responses:
 *       200:
 *         description: Compliance record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ComplianceRecord'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/checks/:recordId',
  authenticate,
  validationRules.recordId,
  asyncHandler(async (req, res) => {
    const { recordId } = req.params;
    
    const { data, error } = await databaseService.getClient()
      .from('compliance_records')
      .select('*')
      .eq('record_id', recordId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return sendErrorResponse(res, 'Compliance record not found', 404, 'RECORD_NOT_FOUND');
      }
      throw error;
    }

    sendSuccessResponse(res, data, 'Compliance record retrieved successfully');
  })
);

/**
 * @swagger
 * /api/compliance/checks/{recordId}/status:
 *   put:
 *     summary: Update compliance record status
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Compliance record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateComplianceStatusRequest'
 *     responses:
 *       200:
 *         description: Compliance status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/checks/:recordId/status',
  authenticate,
  authorize(['auditor', 'compliance_officer', 'quality_manager', 'admin']),
  validationRules.recordId,
  validateJoi(complianceSchemas.updateStatus),
  asyncHandler(async (req, res) => {
    const { recordId } = req.params;
    const { status, passed, updatedNotes } = req.body;
    
    // Update compliance status on blockchain
    const transaction = await blockchainService.updateComplianceStatus(recordId, {
      status,
      passed,
      updatedNotes
    });
    
    // Update database
    const { data, error } = await databaseService.getClient()
      .from('compliance_records')
      .update({
        status: status,
        passed: passed,
        notes: updatedNotes || null,
        updated_at: new Date().toISOString()
      })
      .eq('record_id', recordId)
      .select()
      .single();

    if (error) throw error;

    logger.audit('update_compliance_status', 'compliance', req.user.id, {
      recordId,
      status,
      passed,
      txHash: transaction.txHash
    });

    sendSuccessResponse(res, { 
      ...data,
      transaction 
    }, 'Compliance status updated successfully');
  })
);

/**
 * @swagger
 * /api/compliance/batches/{batchId}:
 *   get:
 *     summary: Get compliance history for batch
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Batch ID
 *     responses:
 *       200:
 *         description: Compliance history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ComplianceRecord'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/batches/:batchId',
  authenticate,
  validationRules.batchId,
  asyncHandler(async (req, res) => {
    const { batchId } = req.params;
    
    const records = await databaseService.getComplianceRecords(batchId);
    
    sendSuccessResponse(res, records, 'Compliance history retrieved successfully');
  })
);

/**
 * @swagger
 * /api/compliance/audits:
 *   post:
 *     summary: Record audit trail
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecordAuditTrailRequest'
 *     responses:
 *       201:
 *         description: Audit trail recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AuditTrail'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/audits',
  authenticate,
  authorize(['auditor', 'compliance_officer', 'quality_manager', 'admin']),
  validateJoi(complianceSchemas.recordAudit),
  asyncHandler(async (req, res) => {
    const auditData = req.body;
    
    // Record audit trail in database
    const dbAuditData = {
      audit_id: Date.now(), // Simple ID generation
      batch_id: auditData.batchId,
      auditor: req.user.address,
      audit_date: new Date().toISOString(),
      audit_type: auditData.auditType,
      findings: auditData.findings,
      recommendations: auditData.recommendations,
      result: auditData.result,
      evidence_hashes: auditData.evidenceHashes || []
    };

    const { data, error } = await databaseService.getClient()
      .from('audit_trails')
      .insert([dbAuditData])
      .select()
      .single();

    if (error) throw error;

    logger.audit('record_audit_trail', 'compliance', req.user.id, {
      batchId: auditData.batchId,
      auditType: auditData.auditType,
      result: auditData.result
    });

    sendSuccessResponse(res, data, 'Audit trail recorded successfully', 201);
  })
);

/**
 * @swagger
 * /api/compliance/audits:
 *   get:
 *     summary: Get all audit trails
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: batchId
 *         schema:
 *           type: integer
 *         description: Filter by batch ID
 *       - in: query
 *         name: auditor
 *         schema:
 *           type: string
 *         description: Filter by auditor address
 *     responses:
 *       200:
 *         description: Audit trails retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditTrail'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/audits',
  authenticate,
  validationRules.pagination,
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      batchId,
      auditor
    } = req.query;

    let query = databaseService.getClient()
      .from('audit_trails')
      .select('*', { count: 'exact' });

    if (batchId) {
      query = query.eq('batch_id', batchId);
    }

    if (auditor) {
      query = query.eq('auditor', auditor);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    sendSuccessResponse(res, {
      data: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    }, 'Audit trails retrieved successfully');
  })
);

/**
 * @swagger
 * /api/compliance/standards:
 *   post:
 *     summary: Set compliance standard
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SetComplianceStandardRequest'
 *     responses:
 *       201:
 *         description: Compliance standard set successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/standards',
  authenticate,
  authorize(['regulator', 'admin']),
  asyncHandler(async (req, res) => {
    const { name, description, version, isActive, requirements } = req.body;
    
    // Set compliance standard on blockchain
    const transaction = await blockchainService.getContract('complianceManager')
      .setComplianceStandard(name, description, version, isActive, requirements);
    
    await transaction.wait();

    logger.audit('set_compliance_standard', 'compliance', req.user.id, {
      name,
      version,
      isActive,
      txHash: transaction.hash
    });

    sendSuccessResponse(res, { 
      transaction: {
        txHash: transaction.hash,
        gasUsed: (await transaction.wait()).gasUsed.toString()
      }
    }, 'Compliance standard set successfully', 201);
  })
);

/**
 * @swagger
 * /api/compliance/standards/{name}:
 *   get:
 *     summary: Get compliance standard
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Standard name
 *     responses:
 *       200:
 *         description: Compliance standard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ComplianceStandard'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/standards/:name',
  authenticate,
  asyncHandler(async (req, res) => {
    const { name } = req.params;
    
    const standard = await blockchainService.getContract('complianceManager')
      .getComplianceStandard(name);

    sendSuccessResponse(res, {
      standardName: standard.standardName,
      description: standard.description,
      version: standard.version,
      isActive: standard.isActive,
      requirements: standard.requirements,
      createdAt: standard.createdAt,
      createdBy: standard.createdBy
    }, 'Compliance standard retrieved successfully');
  })
);

/**
 * @swagger
 * /api/compliance/statistics:
 *   get:
 *     summary: Get compliance statistics
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRecords:
 *                       type: integer
 *                     totalAudits:
 *                       type: integer
 *                     passedChecks:
 *                       type: integer
 *                     failedChecks:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/statistics',
  authenticate,
  asyncHandler(async (req, res) => {
    const [
      totalRecords,
      totalAudits,
      passedChecks,
      failedChecks
    ] = await Promise.all([
      databaseService.getClient().from('compliance_records').select('id', { count: 'exact' }),
      databaseService.getClient().from('audit_trails').select('id', { count: 'exact' }),
      databaseService.getClient().from('compliance_records').select('id', { count: 'exact' }).eq('passed', true),
      databaseService.getClient().from('compliance_records').select('id', { count: 'exact' }).eq('passed', false)
    ]);

    sendSuccessResponse(res, {
      totalRecords: totalRecords.count || 0,
      totalAudits: totalAudits.count || 0,
      passedChecks: passedChecks.count || 0,
      failedChecks: failedChecks.count || 0
    }, 'Compliance statistics retrieved successfully');
  })
);

module.exports = router;