/**
 * @fileoverview Document Controller for PharbitChain
 * Handles document upload, download, and management with pharmaceutical compliance
 */

const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const logger = require('../utils/logger');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow specific file types for pharmaceutical documents
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, images, and CSV files are allowed.'), false);
        }
    }
});

/**
 * @swagger
 * /api/documents/upload:
 *   post:
 *     summary: Upload a document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - documentType
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               documentType:
 *                 type: string
 *                 enum: [certificate, batch_document, regulatory, lab_report, compliance, other]
 *               batchId:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 *       400:
 *         description: Invalid file or validation error
 */
router.post('/upload', [
    req.authService.authenticate,
    upload.single('file'),
    body('documentType').isIn(['certificate', 'batch_document', 'regulatory', 'lab_report', 'compliance', 'other']),
    body('batchId').optional().isString(),
    body('description').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        if (!req.file) {
            return res.status(400).json({
                error: 'No file provided',
                message: 'Please select a file to upload'
            });
        }

        const metadata = {
            uploaderId: req.user.id,
            documentType: req.body.documentType,
            batchId: req.body.batchId || null,
            description: req.body.description || '',
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size
        };

        // Upload to S3
        const uploadResult = await req.s3Service.uploadDocument(req.file, metadata, 'batchDocuments');

        // Save to database
        const document = await req.databaseService.getModel('Document').create({
            fileId: uploadResult.fileId,
            fileName: uploadResult.fileName,
            originalName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            fileHash: uploadResult.fileHash,
            s3Key: uploadResult.s3Key,
            s3Url: uploadResult.s3Url,
            documentType: req.body.documentType,
            batchId: req.body.batchId || null,
            uploadedBy: req.user.id,
            digitalSignature: uploadResult.digitalSignature,
            metadata: {
                ...metadata,
                s3Metadata: uploadResult.complianceData
            }
        });

        // Create audit trail
        const auditEntry = req.complianceService.createAuditTrailEntry(
            {
                type: 'DOCUMENT_UPLOAD',
                description: `Document uploaded: ${req.file.originalname}`,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                metadata: {
                    fileId: uploadResult.fileId,
                    documentType: req.body.documentType,
                    batchId: req.body.batchId
                }
            },
            req.user,
            { type: 'Document', id: document.id }
        );

        await req.databaseService.getModel('AuditTrail').create(auditEntry);

        logger.document('Document uploaded', {
            fileId: uploadResult.fileId,
            fileName: req.file.originalname,
            documentType: req.body.documentType,
            uploadedBy: req.user.id,
            batchId: req.body.batchId
        });

        res.json({
            success: true,
            document: {
                id: document.id,
                fileId: uploadResult.fileId,
                fileName: req.file.originalname,
                documentType: req.body.documentType,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                fileHash: uploadResult.fileHash,
                digitalSignature: uploadResult.digitalSignature,
                uploadedAt: document.createdAt,
                batchId: req.body.batchId
            },
            message: 'Document uploaded successfully'
        });

    } catch (error) {
        logger.error('Document upload failed:', error);
        res.status(400).json({
            error: 'Document upload failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/documents/{fileId}/download:
 *   get:
 *     summary: Download a document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document download URL generated
 *       404:
 *         description: Document not found
 */
router.get('/:fileId/download', req.authService.authenticate, async (req, res) => {
    try {
        const { fileId } = req.params;
        
        // Get document info from database
        const document = await req.databaseService.getModel('Document').findOne({
            where: { fileId },
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
                message: `Document with ID ${fileId} does not exist`
            });
        }

        // Download from S3
        const downloadResult = await req.s3Service.downloadDocument(fileId, req.user.id);

        // Create audit trail
        const auditEntry = req.complianceService.createAuditTrailEntry(
            {
                type: 'DOCUMENT_DOWNLOAD',
                description: `Document downloaded: ${document.originalName}`,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                metadata: {
                    fileId,
                    documentType: document.documentType,
                    batchId: document.batchId
                }
            },
            req.user,
            { type: 'Document', id: document.id }
        );

        await req.databaseService.getModel('AuditTrail').create(auditEntry);

        logger.logDocumentAccess(fileId, req.user.id, 'DOWNLOAD', {
            fileName: document.originalName,
            documentType: document.documentType
        });

        res.json({
            success: true,
            document: {
                fileId: document.fileId,
                fileName: document.originalName,
                documentType: document.documentType,
                fileSize: document.fileSize,
                mimeType: document.mimeType,
                downloadUrl: downloadResult.downloadUrl,
                expiresIn: downloadResult.expiresIn
            },
            message: 'Document download URL generated'
        });

    } catch (error) {
        logger.error('Document download failed:', error);
        res.status(400).json({
            error: 'Document download failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: List documents with filtering
 *     tags: [Documents]
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
 *         name: documentType
 *         schema:
 *           type: string
 *           enum: [certificate, batch_document, regulatory, lab_report, compliance, other]
 *       - in: query
 *         name: batchId
 *         schema:
 *           type: string
 *       - in: query
 *         name: uploadedBy
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 */
router.get('/', req.authService.authenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const whereClause = {};
        
        if (req.query.documentType) {
            whereClause.documentType = req.query.documentType;
        }
        
        if (req.query.batchId) {
            whereClause.batchId = req.query.batchId;
        }
        
        if (req.query.uploadedBy) {
            whereClause.uploadedBy = req.query.uploadedBy;
        }

        const { count, rows: documents } = await req.databaseService.getModel('Document').findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: req.databaseService.getModel('User'),
                    as: 'uploader',
                    attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'organization']
                },
                {
                    model: req.databaseService.getModel('User'),
                    as: 'approver',
                    attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'organization']
                }
            ],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            documents: documents.map(doc => ({
                id: doc.id,
                fileId: doc.fileId,
                fileName: doc.originalName,
                documentType: doc.documentType,
                fileSize: doc.fileSize,
                mimeType: doc.mimeType,
                fileHash: doc.fileHash,
                batchId: doc.batchId,
                uploadedBy: doc.uploader,
                approvedBy: doc.approver,
                isApproved: doc.isApproved,
                uploadedAt: doc.createdAt,
                approvedAt: doc.approvedAt
            })),
            pagination: {
                page,
                limit,
                total: count,
                pages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        logger.error('Failed to list documents:', error);
        res.status(500).json({
            error: 'Failed to list documents',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/documents/{fileId}:
 *   get:
 *     summary: Get document details
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document details retrieved successfully
 *       404:
 *         description: Document not found
 */
router.get('/:fileId', req.authService.authenticate, async (req, res) => {
    try {
        const { fileId } = req.params;
        
        const document = await req.databaseService.getModel('Document').findOne({
            where: { fileId },
            include: [
                {
                    model: req.databaseService.getModel('User'),
                    as: 'uploader',
                    attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'organization']
                },
                {
                    model: req.databaseService.getModel('User'),
                    as: 'approver',
                    attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'organization']
                }
            ]
        });

        if (!document) {
            return res.status(404).json({
                error: 'Document not found',
                message: `Document with ID ${fileId} does not exist`
            });
        }

        res.json({
            success: true,
            document: {
                id: document.id,
                fileId: document.fileId,
                fileName: document.originalName,
                documentType: document.documentType,
                fileSize: document.fileSize,
                mimeType: document.mimeType,
                fileHash: document.fileHash,
                s3Url: document.s3Url,
                batchId: document.batchId,
                uploadedBy: document.uploader,
                approvedBy: document.approver,
                isApproved: document.isApproved,
                digitalSignature: document.digitalSignature,
                metadata: document.metadata,
                uploadedAt: document.createdAt,
                approvedAt: document.approvedAt,
                updatedAt: document.updatedAt
            }
        });

    } catch (error) {
        logger.error('Failed to get document details:', error);
        res.status(500).json({
            error: 'Failed to get document details',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/documents/{fileId}/approve:
 *   post:
 *     summary: Approve a document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document approved successfully
 *       404:
 *         description: Document not found
 */
router.post('/:fileId/approve', [
    req.authService.authenticate,
    req.authService.requireRole(['admin', 'regulator', 'auditor']),
    body('comments').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { fileId } = req.params;
        const { comments } = req.body;
        
        const document = await req.databaseService.getModel('Document').findOne({
            where: { fileId }
        });

        if (!document) {
            return res.status(404).json({
                error: 'Document not found',
                message: `Document with ID ${fileId} does not exist`
            });
        }

        // Update document approval
        await document.update({
            isApproved: true,
            approvedBy: req.user.id,
            approvedAt: new Date(),
            metadata: {
                ...document.metadata,
                approvalComments: comments,
                approvedBy: req.user.id,
                approvedAt: new Date().toISOString()
            }
        });

        // Create audit trail
        const auditEntry = req.complianceService.createAuditTrailEntry(
            {
                type: 'DOCUMENT_APPROVE',
                description: `Document approved: ${document.originalName}`,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                metadata: {
                    fileId,
                    comments,
                    documentType: document.documentType
                }
            },
            req.user,
            { type: 'Document', id: document.id }
        );

        await req.databaseService.getModel('AuditTrail').create(auditEntry);

        logger.document('Document approved', {
            fileId,
            fileName: document.originalName,
            approvedBy: req.user.id,
            comments
        });

        res.json({
            success: true,
            message: 'Document approved successfully',
            document: {
                fileId: document.fileId,
                fileName: document.originalName,
                isApproved: true,
                approvedBy: req.user.id,
                approvedAt: document.approvedAt
            }
        });

    } catch (error) {
        logger.error('Document approval failed:', error);
        res.status(400).json({
            error: 'Document approval failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/documents/{fileId}:
 *   delete:
 *     summary: Delete a document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       404:
 *         description: Document not found
 */
router.delete('/:fileId', req.authService.authenticate, async (req, res) => {
    try {
        const { fileId } = req.params;
        
        const document = await req.databaseService.getModel('Document').findOne({
            where: { fileId }
        });

        if (!document) {
            return res.status(404).json({
                error: 'Document not found',
                message: `Document with ID ${fileId} does not exist`
            });
        }

        // Delete from S3
        await req.s3Service.deleteDocument(fileId, req.user.id);

        // Create audit trail
        const auditEntry = req.complianceService.createAuditTrailEntry(
            {
                type: 'DOCUMENT_DELETE',
                description: `Document deleted: ${document.originalName}`,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                metadata: {
                    fileId,
                    documentType: document.documentType,
                    batchId: document.batchId
                }
            },
            req.user,
            { type: 'Document', id: document.id }
        );

        await req.databaseService.getModel('AuditTrail').create(auditEntry);

        // Delete from database
        await document.destroy();

        logger.document('Document deleted', {
            fileId,
            fileName: document.originalName,
            deletedBy: req.user.id
        });

        res.json({
            success: true,
            message: 'Document deleted successfully'
        });

    } catch (error) {
        logger.error('Document deletion failed:', error);
        res.status(400).json({
            error: 'Document deletion failed',
            message: error.message
        });
    }
});

module.exports = router;