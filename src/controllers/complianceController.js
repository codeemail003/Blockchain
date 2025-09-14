/**
 * @fileoverview Compliance Controller for PharbitChain
 * Handles pharmaceutical compliance monitoring and reporting
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/compliance/audit-trail:
 *   get:
 *     summary: Get audit trail entries
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Audit trail entries retrieved successfully
 */
router.get('/audit-trail', req.authService.authenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const whereClause = {};
        
        if (req.query.action) {
            whereClause.action = req.query.action;
        }
        
        if (req.query.entityType) {
            whereClause.entityType = req.query.entityType;
        }
        
        if (req.query.userId) {
            whereClause.userId = req.query.userId;
        }
        
        if (req.query.startDate || req.query.endDate) {
            whereClause.createdAt = {};
            if (req.query.startDate) {
                whereClause.createdAt[req.databaseService.getSequelize().Op.gte] = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                whereClause.createdAt[req.databaseService.getSequelize().Op.lte] = new Date(req.query.endDate);
            }
        }

        const { count, rows: auditEntries } = await req.databaseService.getModel('AuditTrail').findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: req.databaseService.getModel('User'),
                    as: 'user',
                    attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'organization']
                }
            ],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            auditTrail: auditEntries.map(entry => ({
                id: entry.id,
                action: entry.action,
                description: entry.description,
                entityType: entry.entityType,
                entityId: entry.entityId,
                user: entry.user,
                ipAddress: entry.ipAddress,
                userAgent: entry.userAgent,
                oldValues: entry.oldValues,
                newValues: entry.newValues,
                complianceData: entry.complianceData,
                createdAt: entry.createdAt
            })),
            pagination: {
                page,
                limit,
                total: count,
                pages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        logger.error('Failed to get audit trail:', error);
        res.status(500).json({
            error: 'Failed to get audit trail',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/compliance/violations:
 *   get:
 *     summary: Get compliance violations
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: violationType
 *         schema:
 *           type: string
 *           enum: [FDA_21CFR11, DSCSA, GDPR, ISO27001, CUSTOM]
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, investigating, resolved, false_positive]
 *     responses:
 *       200:
 *         description: Compliance violations retrieved successfully
 */
router.get('/violations', req.authService.authenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const whereClause = {};
        
        if (req.query.violationType) {
            whereClause.violationType = req.query.violationType;
        }
        
        if (req.query.severity) {
            whereClause.severity = req.query.severity;
        }
        
        if (req.query.status) {
            whereClause.status = req.query.status;
        }

        const { count, rows: violations } = await req.databaseService.getModel('ComplianceViolation').findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: req.databaseService.getModel('User'),
                    as: 'resolver',
                    attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'organization']
                }
            ],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            violations: violations.map(violation => ({
                id: violation.id,
                violationType: violation.violationType,
                severity: violation.severity,
                description: violation.description,
                entityType: violation.entityType,
                entityId: violation.entityId,
                detectedBy: violation.detectedBy,
                status: violation.status,
                resolution: violation.resolution,
                resolver: violation.resolver,
                resolvedAt: violation.resolvedAt,
                metadata: violation.metadata,
                createdAt: violation.createdAt,
                updatedAt: violation.updatedAt
            })),
            pagination: {
                page,
                limit,
                total: count,
                pages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        logger.error('Failed to get compliance violations:', error);
        res.status(500).json({
            error: 'Failed to get compliance violations',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/compliance/violations/{id}/resolve:
 *   post:
 *     summary: Resolve a compliance violation
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resolution
 *               - status
 *             properties:
 *               resolution:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [resolved, false_positive]
 *     responses:
 *       200:
 *         description: Violation resolved successfully
 *       404:
 *         description: Violation not found
 */
router.post('/violations/:id/resolve', [
    req.authService.authenticate,
    req.authService.requireRole(['admin', 'regulator', 'auditor']),
    body('resolution').notEmpty().isString(),
    body('status').isIn(['resolved', 'false_positive'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { id } = req.params;
        const { resolution, status } = req.body;
        
        const violation = await req.databaseService.getModel('ComplianceViolation').findByPk(id);

        if (!violation) {
            return res.status(404).json({
                error: 'Violation not found',
                message: `Violation with ID ${id} does not exist`
            });
        }

        // Update violation
        await violation.update({
            status,
            resolution,
            resolvedBy: req.user.id,
            resolvedAt: new Date()
        });

        // Create audit trail
        const auditEntry = req.complianceService.createAuditTrailEntry(
            {
                type: 'VIOLATION_RESOLVE',
                description: `Violation resolved: ${violation.violationType}`,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                metadata: {
                    violationId: id,
                    resolution,
                    status
                }
            },
            req.user,
            { type: 'ComplianceViolation', id: violation.id }
        );

        await req.databaseService.getModel('AuditTrail').create(auditEntry);

        logger.compliance('Violation resolved', {
            violationId: id,
            violationType: violation.violationType,
            status,
            resolvedBy: req.user.id
        });

        res.json({
            success: true,
            violation: {
                id: violation.id,
                violationType: violation.violationType,
                status: violation.status,
                resolution: violation.resolution,
                resolvedBy: req.user.id,
                resolvedAt: violation.resolvedAt
            },
            message: 'Violation resolved successfully'
        });

    } catch (error) {
        logger.error('Violation resolution failed:', error);
        res.status(400).json({
            error: 'Violation resolution failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/compliance/report:
 *   post:
 *     summary: Generate compliance report
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               documentFilters:
 *                 type: object
 *               batchFilters:
 *                 type: object
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Compliance report generated successfully
 */
router.post('/report', [
    req.authService.authenticate,
    req.authService.requireRole(['admin', 'regulator', 'auditor'])
], async (req, res) => {
    try {
        const filters = req.body || {};
        
        // Add date filters if provided
        if (filters.startDate || filters.endDate) {
            const dateFilter = {};
            if (filters.startDate) {
                dateFilter[req.databaseService.getSequelize().Op.gte] = new Date(filters.startDate);
            }
            if (filters.endDate) {
                dateFilter[req.databaseService.getSequelize().Op.lte] = new Date(filters.endDate);
            }
            
            filters.documentFilters = {
                ...filters.documentFilters,
                createdAt: dateFilter
            };
            
            filters.batchFilters = {
                ...filters.batchFilters,
                createdAt: dateFilter
            };
        }

        const report = await req.complianceService.generateComplianceReport(filters, req.databaseService);

        logger.compliance('Compliance report generated', {
            reportId: report.id,
            generatedBy: req.user.id,
            filters
        });

        res.json({
            success: true,
            report
        });

    } catch (error) {
        logger.error('Compliance report generation failed:', error);
        res.status(400).json({
            error: 'Compliance report generation failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/compliance/retention-check:
 *   get:
 *     summary: Check data retention compliance
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Retention compliance check completed
 */
router.get('/retention-check', [
    req.authService.authenticate,
    req.authService.requireRole(['admin', 'regulator', 'auditor'])
], async (req, res) => {
    try {
        const retentionCheck = await req.complianceService.checkDataRetentionCompliance(req.databaseService);

        logger.compliance('Data retention check completed', {
            compliant: retentionCheck.compliant,
            totalExpired: retentionCheck.totalExpired,
            checkedBy: req.user.id
        });

        res.json({
            success: true,
            retentionCheck
        });

    } catch (error) {
        logger.error('Data retention check failed:', error);
        res.status(500).json({
            error: 'Data retention check failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/compliance/cleanup:
 *   post:
 *     summary: Clean up expired data
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data cleanup completed
 */
router.post('/cleanup', [
    req.authService.authenticate,
    req.authService.requireRole(['admin'])
], async (req, res) => {
    try {
        const cleanupResults = await req.complianceService.cleanupExpiredData(req.databaseService);

        logger.compliance('Data cleanup completed', {
            totalCleaned: cleanupResults.totalCleaned,
            cleanedBy: req.user.id
        });

        res.json({
            success: true,
            cleanupResults,
            message: 'Data cleanup completed successfully'
        });

    } catch (error) {
        logger.error('Data cleanup failed:', error);
        res.status(500).json({
            error: 'Data cleanup failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/compliance/validate-document:
 *   post:
 *     summary: Validate document for compliance
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentId
 *             properties:
 *               documentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document validation completed
 */
router.post('/validate-document', [
    req.authService.authenticate,
    body('documentId').notEmpty().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { documentId } = req.body;
        
        const document = await req.databaseService.getModel('Document').findOne({
            where: { fileId: documentId },
            include: [
                {
                    model: req.databaseService.getModel('User'),
                    as: 'uploader',
                    attributes: ['id', 'email', 'role', 'organization']
                }
            ]
        });

        if (!document) {
            return res.status(404).json({
                error: 'Document not found',
                message: `Document with ID ${documentId} does not exist`
            });
        }

        const validation = req.complianceService.validateFDA21CFR11(document, document.uploader);

        logger.compliance('Document compliance validation', {
            documentId,
            compliant: validation.compliant,
            violations: validation.violations.length,
            validatedBy: req.user.id
        });

        res.json({
            success: true,
            validation
        });

    } catch (error) {
        logger.error('Document validation failed:', error);
        res.status(400).json({
            error: 'Document validation failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/compliance/validate-batch:
 *   post:
 *     summary: Validate batch for compliance
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - batchId
 *             properties:
 *               batchId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Batch validation completed
 */
router.post('/validate-batch', [
    req.authService.authenticate,
    body('batchId').notEmpty().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { batchId } = req.body;
        
        const batch = await req.databaseService.getModel('Batch').findOne({
            where: { batchId }
        });

        if (!batch) {
            return res.status(404).json({
                error: 'Batch not found',
                message: `Batch with ID ${batchId} does not exist`
            });
        }

        const validation = req.complianceService.validateBatchCompliance(batch, req.user);

        logger.compliance('Batch compliance validation', {
            batchId,
            compliant: validation.compliant,
            violations: validation.violations.length,
            validatedBy: req.user.id
        });

        res.json({
            success: true,
            validation
        });

    } catch (error) {
        logger.error('Batch validation failed:', error);
        res.status(400).json({
            error: 'Batch validation failed',
            message: error.message
        });
    }
});

module.exports = router;