/**
 * @fileoverview Batch Controller for PharbitChain
 * Handles pharmaceutical batch management and tracking
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/batches:
 *   post:
 *     summary: Create a new pharmaceutical batch
 *     tags: [Batches]
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
 *               - productCode
 *               - productName
 *               - manufacturer
 *               - quantity
 *               - productionDate
 *               - expiryDate
 *             properties:
 *               batchId:
 *                 type: string
 *               productCode:
 *                 type: string
 *               productName:
 *                 type: string
 *               manufacturer:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               productionDate:
 *                 type: string
 *                 format: date
 *               expiryDate:
 *                 type: string
 *                 format: date
 *               currentLocation:
 *                 type: string
 *               serializationData:
 *                 type: object
 *     responses:
 *       201:
 *         description: Batch created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', [
    req.authService.authenticate,
    req.authService.requireRole(['admin', 'manufacturer']),
    body('batchId').notEmpty().isString(),
    body('productCode').notEmpty().isString(),
    body('productName').notEmpty().isString(),
    body('manufacturer').notEmpty().isString(),
    body('quantity').isInt({ min: 1 }),
    body('productionDate').isISO8601(),
    body('expiryDate').isISO8601(),
    body('currentLocation').optional().isString(),
    body('serializationData').optional().isObject()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const batchData = {
            ...req.body,
            currentOwner: req.user.organization,
            createdBy: req.user.id
        };

        // Validate batch compliance
        const complianceValidation = req.complianceService.validateBatchCompliance(batchData, req.user);
        
        if (!complianceValidation.compliant) {
            return res.status(400).json({
                error: 'Compliance validation failed',
                violations: complianceValidation.violations,
                warnings: complianceValidation.warnings
            });
        }

        // Create batch in database
        const batch = await req.databaseService.getModel('Batch').create({
            ...batchData,
            complianceData: {
                ...complianceValidation,
                validatedAt: new Date().toISOString(),
                validatedBy: req.user.id
            }
        });

        // Create blockchain transaction
        const transactionData = {
            type: 'BATCH_CREATE',
            from: req.user.id,
            to: req.user.organization,
            amount: batchData.quantity,
            data: {
                batchId: batchData.batchId,
                productCode: batchData.productCode,
                productName: batchData.productName,
                manufacturer: batchData.manufacturer,
                serializationData: batchData.serializationData
            },
            timestamp: new Date().toISOString()
        };

        const transactionHash = req.blockchain.calculateTransactionHash(transactionData);
        transactionData.hash = transactionHash;
        
        req.blockchain.addTransaction(transactionData);

        // Create audit trail
        const auditEntry = req.complianceService.createAuditTrailEntry(
            {
                type: 'BATCH_CREATE',
                description: `Batch created: ${batchData.batchId}`,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                metadata: {
                    batchId: batchData.batchId,
                    productCode: batchData.productCode,
                    quantity: batchData.quantity
                }
            },
            req.user,
            { type: 'Batch', id: batch.id }
        );

        await req.databaseService.getModel('AuditTrail').create(auditEntry);

        logger.logBatchOperation(batchData.batchId, 'CREATE', {
            productCode: batchData.productCode,
            quantity: batchData.quantity,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            batch: {
                id: batch.id,
                batchId: batch.batchId,
                productCode: batch.productCode,
                productName: batch.productName,
                manufacturer: batch.manufacturer,
                quantity: batch.quantity,
                status: batch.status,
                productionDate: batch.productionDate,
                expiryDate: batch.expiryDate,
                currentLocation: batch.currentLocation,
                currentOwner: batch.currentOwner,
                createdAt: batch.createdAt
            },
            transactionHash,
            message: 'Batch created successfully'
        });

    } catch (error) {
        logger.error('Batch creation failed:', error);
        res.status(400).json({
            error: 'Batch creation failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/batches:
 *   get:
 *     summary: List batches with filtering
 *     tags: [Batches]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [created, in_production, quality_control, approved, shipped, delivered, recalled]
 *       - in: query
 *         name: productCode
 *         schema:
 *           type: string
 *       - in: query
 *         name: manufacturer
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Batches retrieved successfully
 */
router.get('/', req.authService.authenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const whereClause = {};
        
        if (req.query.status) {
            whereClause.status = req.query.status;
        }
        
        if (req.query.productCode) {
            whereClause.productCode = req.query.productCode;
        }
        
        if (req.query.manufacturer) {
            whereClause.manufacturer = req.query.manufacturer;
        }

        const { count, rows: batches } = await req.databaseService.getModel('Batch').findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            batches: batches.map(batch => ({
                id: batch.id,
                batchId: batch.batchId,
                productCode: batch.productCode,
                productName: batch.productName,
                manufacturer: batch.manufacturer,
                quantity: batch.quantity,
                status: batch.status,
                productionDate: batch.productionDate,
                expiryDate: batch.expiryDate,
                currentLocation: batch.currentLocation,
                currentOwner: batch.currentOwner,
                blockchainHash: batch.blockchainHash,
                createdAt: batch.createdAt,
                updatedAt: batch.updatedAt
            })),
            pagination: {
                page,
                limit,
                total: count,
                pages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        logger.error('Failed to list batches:', error);
        res.status(500).json({
            error: 'Failed to list batches',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/batches/{batchId}:
 *   get:
 *     summary: Get batch details
 *     tags: [Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Batch details retrieved successfully
 *       404:
 *         description: Batch not found
 */
router.get('/:batchId', req.authService.authenticate, async (req, res) => {
    try {
        const { batchId } = req.params;
        
        const batch = await req.databaseService.getModel('Batch').findOne({
            where: { batchId }
        });

        if (!batch) {
            return res.status(404).json({
                error: 'Batch not found',
                message: `Batch with ID ${batchId} does not exist`
            });
        }

        // Get batch transaction history from blockchain
        const transactionHistory = req.blockchain.getBatchHistory(batchId);

        res.json({
            success: true,
            batch: {
                id: batch.id,
                batchId: batch.batchId,
                productCode: batch.productCode,
                productName: batch.productName,
                manufacturer: batch.manufacturer,
                quantity: batch.quantity,
                status: batch.status,
                productionDate: batch.productionDate,
                expiryDate: batch.expiryDate,
                currentLocation: batch.currentLocation,
                currentOwner: batch.currentOwner,
                serializationData: batch.serializationData,
                complianceData: batch.complianceData,
                blockchainHash: batch.blockchainHash,
                createdAt: batch.createdAt,
                updatedAt: batch.updatedAt
            },
            transactionHistory
        });

    } catch (error) {
        logger.error('Failed to get batch details:', error);
        res.status(500).json({
            error: 'Failed to get batch details',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/batches/{batchId}/update:
 *   put:
 *     summary: Update batch status or location
 *     tags: [Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [created, in_production, quality_control, approved, shipped, delivered, recalled]
 *               currentLocation:
 *                 type: string
 *               currentOwner:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Batch updated successfully
 *       404:
 *         description: Batch not found
 */
router.put('/:batchId/update', [
    req.authService.authenticate,
    body('status').optional().isIn(['created', 'in_production', 'quality_control', 'approved', 'shipped', 'delivered', 'recalled']),
    body('currentLocation').optional().isString(),
    body('currentOwner').optional().isString(),
    body('notes').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { batchId } = req.params;
        const updateData = req.body;
        
        const batch = await req.databaseService.getModel('Batch').findOne({
            where: { batchId }
        });

        if (!batch) {
            return res.status(404).json({
                error: 'Batch not found',
                message: `Batch with ID ${batchId} does not exist`
            });
        }

        // Store old values for audit trail
        const oldValues = {
            status: batch.status,
            currentLocation: batch.currentLocation,
            currentOwner: batch.currentOwner
        };

        // Update batch
        await batch.update({
            ...updateData,
            updatedBy: req.user.id
        });

        // Create blockchain transaction
        const transactionData = {
            type: 'BATCH_UPDATE',
            from: req.user.id,
            to: req.user.organization,
            amount: 0,
            data: {
                batchId,
                updates: updateData,
                updatedBy: req.user.id
            },
            timestamp: new Date().toISOString()
        };

        const transactionHash = req.blockchain.calculateTransactionHash(transactionData);
        transactionData.hash = transactionHash;
        
        req.blockchain.addTransaction(transactionData);

        // Create audit trail
        const auditEntry = req.complianceService.createAuditTrailEntry(
            {
                type: 'BATCH_UPDATE',
                description: `Batch updated: ${batchId}`,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                metadata: {
                    batchId,
                    updates: updateData,
                    oldValues
                }
            },
            req.user,
            { type: 'Batch', id: batch.id }
        );

        await req.databaseService.getModel('AuditTrail').create(auditEntry);

        logger.logBatchOperation(batchId, 'UPDATE', {
            updates: updateData,
            updatedBy: req.user.id
        });

        res.json({
            success: true,
            batch: {
                id: batch.id,
                batchId: batch.batchId,
                status: batch.status,
                currentLocation: batch.currentLocation,
                currentOwner: batch.currentOwner,
                updatedAt: batch.updatedAt
            },
            transactionHash,
            message: 'Batch updated successfully'
        });

    } catch (error) {
        logger.error('Batch update failed:', error);
        res.status(400).json({
            error: 'Batch update failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/batches/{batchId}/transfer:
 *   post:
 *     summary: Transfer batch ownership
 *     tags: [Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
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
 *               - newOwner
 *               - newLocation
 *             properties:
 *               newOwner:
 *                 type: string
 *               newLocation:
 *                 type: string
 *               transferReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Batch transferred successfully
 *       404:
 *         description: Batch not found
 */
router.post('/:batchId/transfer', [
    req.authService.authenticate,
    body('newOwner').notEmpty().isString(),
    body('newLocation').notEmpty().isString(),
    body('transferReason').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { batchId } = req.params;
        const { newOwner, newLocation, transferReason } = req.body;
        
        const batch = await req.databaseService.getModel('Batch').findOne({
            where: { batchId }
        });

        if (!batch) {
            return res.status(404).json({
                error: 'Batch not found',
                message: `Batch with ID ${batchId} does not exist`
            });
        }

        // Store old values
        const oldValues = {
            currentOwner: batch.currentOwner,
            currentLocation: batch.currentLocation
        };

        // Update batch
        await batch.update({
            currentOwner: newOwner,
            currentLocation: newLocation,
            status: 'shipped',
            updatedBy: req.user.id
        });

        // Create blockchain transaction
        const transactionData = {
            type: 'BATCH_TRANSFER',
            from: batch.currentOwner,
            to: newOwner,
            amount: batch.quantity,
            data: {
                batchId,
                newOwner,
                newLocation,
                transferReason,
                transferredBy: req.user.id
            },
            timestamp: new Date().toISOString()
        };

        const transactionHash = req.blockchain.calculateTransactionHash(transactionData);
        transactionData.hash = transactionHash;
        
        req.blockchain.addTransaction(transactionData);

        // Create audit trail
        const auditEntry = req.complianceService.createAuditTrailEntry(
            {
                type: 'BATCH_TRANSFER',
                description: `Batch transferred: ${batchId}`,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                metadata: {
                    batchId,
                    newOwner,
                    newLocation,
                    transferReason,
                    oldValues
                }
            },
            req.user,
            { type: 'Batch', id: batch.id }
        );

        await req.databaseService.getModel('AuditTrail').create(auditEntry);

        logger.logBatchOperation(batchId, 'TRANSFER', {
            from: oldValues.currentOwner,
            to: newOwner,
            newLocation,
            transferredBy: req.user.id
        });

        res.json({
            success: true,
            batch: {
                id: batch.id,
                batchId: batch.batchId,
                currentOwner: batch.currentOwner,
                currentLocation: batch.currentLocation,
                status: batch.status,
                updatedAt: batch.updatedAt
            },
            transactionHash,
            message: 'Batch transferred successfully'
        });

    } catch (error) {
        logger.error('Batch transfer failed:', error);
        res.status(400).json({
            error: 'Batch transfer failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/batches/{batchId}/recall:
 *   post:
 *     summary: Recall a batch
 *     tags: [Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
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
 *               - recallReason
 *             properties:
 *               recallReason:
 *                 type: string
 *               recallType:
 *                 type: string
 *                 enum: [safety, quality, regulatory, other]
 *     responses:
 *       200:
 *         description: Batch recalled successfully
 *       404:
 *         description: Batch not found
 */
router.post('/:batchId/recall', [
    req.authService.authenticate,
    req.authService.requireRole(['admin', 'manufacturer', 'regulator']),
    body('recallReason').notEmpty().isString(),
    body('recallType').optional().isIn(['safety', 'quality', 'regulatory', 'other'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { batchId } = req.params;
        const { recallReason, recallType = 'other' } = req.body;
        
        const batch = await req.databaseService.getModel('Batch').findOne({
            where: { batchId }
        });

        if (!batch) {
            return res.status(404).json({
                error: 'Batch not found',
                message: `Batch with ID ${batchId} does not exist`
            });
        }

        // Update batch status
        await batch.update({
            status: 'recalled',
            updatedBy: req.user.id,
            metadata: {
                ...batch.metadata,
                recallReason,
                recallType,
                recalledBy: req.user.id,
                recalledAt: new Date().toISOString()
            }
        });

        // Create blockchain transaction
        const transactionData = {
            type: 'BATCH_RECALL',
            from: req.user.id,
            to: batch.currentOwner,
            amount: 0,
            data: {
                batchId,
                recallReason,
                recallType,
                recalledBy: req.user.id
            },
            timestamp: new Date().toISOString()
        };

        const transactionHash = req.blockchain.calculateTransactionHash(transactionData);
        transactionData.hash = transactionHash;
        
        req.blockchain.addTransaction(transactionData);

        // Create audit trail
        const auditEntry = req.complianceService.createAuditTrailEntry(
            {
                type: 'BATCH_RECALL',
                description: `Batch recalled: ${batchId}`,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                metadata: {
                    batchId,
                    recallReason,
                    recallType
                }
            },
            req.user,
            { type: 'Batch', id: batch.id }
        );

        await req.databaseService.getModel('AuditTrail').create(auditEntry);

        logger.logBatchOperation(batchId, 'RECALL', {
            recallReason,
            recallType,
            recalledBy: req.user.id
        });

        res.json({
            success: true,
            batch: {
                id: batch.id,
                batchId: batch.batchId,
                status: batch.status,
                recallReason,
                recallType,
                recalledAt: batch.updatedAt
            },
            transactionHash,
            message: 'Batch recalled successfully'
        });

    } catch (error) {
        logger.error('Batch recall failed:', error);
        res.status(400).json({
            error: 'Batch recall failed',
            message: error.message
        });
    }
});

module.exports = router;