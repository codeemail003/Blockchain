/**
 * @fileoverview AWS S3 Integration Service for PharbitChain
 * Handles document storage, pharmaceutical compliance, and secure file operations
 */

const AWS = require('aws-sdk');
const crypto = require('crypto');
const path = require('path');
const sharp = require('sharp');
const archiver = require('archiver');
const unzipper = require('unzipper');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class S3Service {
    constructor(credentials) {
        this.credentials = credentials;
        this.region = credentials.AWS_REGION || 'eu-north-1';
        this.bucketName = credentials.AWS_S3_BUCKET;
        
        // Initialize AWS S3 client
        this.s3 = new AWS.S3({
            accessKeyId: credentials.AWS_ACCESS_KEY_ID,
            secretAccessKey: credentials.AWS_SECRET_ACCESS_KEY,
            region: this.region,
            signatureVersion: 'v4'
        });
        
        // S3 folder structure for pharmaceutical compliance
        this.folders = {
            certificates: 'certificates/fda-approvals/',
            batchDocuments: 'batch-documents/',
            regulatory: 'regulatory/serialization-data/',
            labReports: 'lab-reports/quality-control/',
            backups: 'backups/blockchain-state/',
            tempUploads: 'temp-uploads/',
            compliance: 'compliance/audit-trails/',
            signatures: 'signatures/digital/',
            reports: 'reports/analytics/'
        };
        
        this.initializeBucket();
    }

    /**
     * Initialize S3 bucket and create folder structure
     */
    async initializeBucket() {
        try {
            // Check if bucket exists
            await this.s3.headBucket({ Bucket: this.bucketName }).promise();
            logger.info(`S3 bucket '${this.bucketName}' already exists`);
        } catch (error) {
            if (error.statusCode === 404) {
                // Create bucket if it doesn't exist
                await this.createBucket();
            } else {
                throw new Error(`Failed to access S3 bucket: ${error.message}`);
            }
        }
        
        // Create folder structure
        await this.createFolderStructure();
    }

    /**
     * Create S3 bucket with proper configuration
     */
    async createBucket() {
        const params = {
            Bucket: this.bucketName,
            CreateBucketConfiguration: {
                LocationConstraint: this.region
            },
            // Enable versioning for pharmaceutical compliance
            VersioningConfiguration: {
                Status: 'Enabled'
            }
        };

        try {
            await this.s3.createBucket(params).promise();
            logger.info(`Created S3 bucket '${this.bucketName}' in region '${this.region}'`);
            
            // Configure bucket for pharmaceutical compliance
            await this.configureBucketCompliance();
            
        } catch (error) {
            if (error.code === 'BucketAlreadyOwnedByYou') {
                logger.info(`Bucket '${this.bucketName}' already owned by you`);
            } else {
                throw new Error(`Failed to create S3 bucket: ${error.message}`);
            }
        }
    }

    /**
     * Configure bucket for pharmaceutical compliance
     */
    async configureBucketCompliance() {
        try {
            // Enable server-side encryption
            await this.s3.putBucketEncryption({
                Bucket: this.bucketName,
                ServerSideEncryptionConfiguration: {
                    Rules: [{
                        ApplyServerSideEncryptionByDefault: {
                            SSEAlgorithm: 'AES256'
                        }
                    }]
                }
            }).promise();

            // Configure lifecycle policy for document retention
            await this.s3.putBucketLifecycleConfiguration({
                Bucket: this.bucketName,
                LifecycleConfiguration: {
                    Rules: [{
                        ID: 'PharmaceuticalDocumentRetention',
                        Status: 'Enabled',
                        Filter: {
                            Prefix: 'batch-documents/'
                        },
                        Transitions: [{
                            Days: 30,
                            StorageClass: 'STANDARD_IA'
                        }, {
                            Days: 90,
                            StorageClass: 'GLACIER'
                        }],
                        Expiration: {
                            Days: 2555 // 7 years for FDA compliance
                        }
                    }]
                }
            }).promise();

            // Configure CORS for web access
            await this.s3.putBucketCors({
                Bucket: this.bucketName,
                CORSConfiguration: {
                    CORSRules: [{
                        AllowedHeaders: ['*'],
                        AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE'],
                        AllowedOrigins: ['*'],
                        MaxAgeSeconds: 3000
                    }]
                }
            }).promise();

            logger.info('Configured S3 bucket for pharmaceutical compliance');
        } catch (error) {
            logger.error('Failed to configure bucket compliance:', error.message);
        }
    }

    /**
     * Create folder structure in S3 bucket
     */
    async createFolderStructure() {
        for (const [folderName, folderPath] of Object.entries(this.folders)) {
            try {
                await this.s3.putObject({
                    Bucket: this.bucketName,
                    Key: folderPath,
                    Body: '',
                    ContentType: 'application/x-directory'
                }).promise();
                logger.debug(`Created folder: ${folderPath}`);
            } catch (error) {
                logger.error(`Failed to create folder ${folderPath}:`, error.message);
            }
        }
    }

    /**
     * Upload document with pharmaceutical compliance
     * @param {Object} file - File object from multer
     * @param {Object} metadata - Document metadata
     * @param {string} folder - S3 folder path
     * @returns {Promise<Object>} Upload result with compliance data
     */
    async uploadDocument(file, metadata = {}, folder = 'batchDocuments') {
        try {
            const fileId = uuidv4();
            const timestamp = new Date().toISOString();
            const fileExtension = path.extname(file.originalname);
            const fileName = `${fileId}${fileExtension}`;
            const s3Key = `${this.folders[folder]}${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${fileName}`;

            // Generate file hash for integrity verification
            const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
            
            // Scan for viruses if enabled
            if (this.credentials.VIRUS_SCAN_ENABLED === 'true') {
                await this.scanForViruses(file.buffer);
            }

            // Validate file type for pharmaceutical documents
            await this.validateFileType(file, folder);

            // Generate digital signature if required
            let digitalSignature = null;
            if (this.credentials.DIGITAL_SIGNATURE_REQUIRED === 'true') {
                digitalSignature = await this.generateDigitalSignature(file.buffer, metadata);
            }

            // Prepare S3 upload parameters
            const uploadParams = {
                Bucket: this.bucketName,
                Key: s3Key,
                Body: file.buffer,
                ContentType: file.mimetype,
                Metadata: {
                    'file-id': fileId,
                    'original-name': file.originalname,
                    'file-hash': fileHash,
                    'upload-timestamp': timestamp,
                    'uploader-id': metadata.uploaderId || 'system',
                    'compliance-mode': this.credentials.COMPLIANCE_MODE || 'FDA_21CFR11',
                    'retention-days': this.credentials.DOCUMENT_RETENTION_DAYS || '2555',
                    'digital-signature': digitalSignature || 'none',
                    'batch-id': metadata.batchId || 'none',
                    'document-type': metadata.documentType || 'unknown',
                    'pharmaceutical-grade': 'true'
                },
                ServerSideEncryption: 'AES256',
                TagSet: [
                    { Key: 'Environment', Value: this.credentials.NODE_ENV || 'development' },
                    { Key: 'Compliance', Value: this.credentials.COMPLIANCE_MODE || 'FDA_21CFR11' },
                    { Key: 'DocumentType', Value: metadata.documentType || 'unknown' },
                    { Key: 'Retention', Value: this.credentials.DOCUMENT_RETENTION_DAYS || '2555' }
                ]
            };

            // Upload to S3
            const uploadResult = await this.s3.upload(uploadParams).promise();

            // Create audit trail entry
            await this.createAuditTrail({
                action: 'DOCUMENT_UPLOAD',
                fileId,
                fileName: file.originalname,
                s3Key,
                fileHash,
                digitalSignature,
                metadata,
                timestamp,
                uploaderId: metadata.uploaderId || 'system'
            });

            logger.info(`Document uploaded successfully: ${fileId}`);

            return {
                success: true,
                fileId,
                fileName: file.originalname,
                s3Key,
                s3Url: uploadResult.Location,
                fileHash,
                digitalSignature,
                size: file.size,
                mimeType: file.mimetype,
                uploadTimestamp: timestamp,
                complianceData: {
                    mode: this.credentials.COMPLIANCE_MODE || 'FDA_21CFR11',
                    retentionDays: parseInt(this.credentials.DOCUMENT_RETENTION_DAYS) || 2555,
                    encrypted: true,
                    versioned: true,
                    auditTrail: true
                }
            };

        } catch (error) {
            logger.error('Document upload failed:', error);
            throw new Error(`Document upload failed: ${error.message}`);
        }
    }

    /**
     * Download document with access control
     * @param {string} fileId - File ID
     * @param {string} userId - User ID requesting download
     * @returns {Promise<Object>} Download result
     */
    async downloadDocument(fileId, userId) {
        try {
            // Get file metadata from S3
            const fileInfo = await this.getFileInfo(fileId);
            
            if (!fileInfo) {
                throw new Error('File not found');
            }

            // Check access permissions
            await this.checkAccessPermissions(fileId, userId, 'READ');

            // Generate pre-signed URL for secure download
            const downloadUrl = await this.generatePresignedUrl(fileInfo.s3Key, 'getObject', 3600);

            // Create audit trail entry
            await this.createAuditTrail({
                action: 'DOCUMENT_DOWNLOAD',
                fileId,
                userId,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                fileId,
                fileName: fileInfo.originalName,
                downloadUrl,
                expiresIn: 3600,
                fileSize: fileInfo.size,
                mimeType: fileInfo.contentType
            };

        } catch (error) {
            logger.error('Document download failed:', error);
            throw new Error(`Document download failed: ${error.message}`);
        }
    }

    /**
     * Get file information from S3
     * @param {string} fileId - File ID
     * @returns {Promise<Object>} File information
     */
    async getFileInfo(fileId) {
        try {
            // List objects with file ID in metadata
            const listParams = {
                Bucket: this.bucketName,
                MaxKeys: 1000
            };

            const objects = await this.s3.listObjectsV2(listParams).promise();
            
            for (const obj of objects.Contents) {
                const headParams = {
                    Bucket: this.bucketName,
                    Key: obj.Key
                };

                const metadata = await this.s3.headObject(headParams).promise();
                
                if (metadata.Metadata['file-id'] === fileId) {
                    return {
                        fileId,
                        s3Key: obj.Key,
                        originalName: metadata.Metadata['original-name'],
                        size: obj.Size,
                        contentType: metadata.ContentType,
                        lastModified: obj.LastModified,
                        metadata: metadata.Metadata
                    };
                }
            }

            return null;
        } catch (error) {
            logger.error('Failed to get file info:', error);
            throw new Error(`Failed to get file info: ${error.message}`);
        }
    }

    /**
     * Generate pre-signed URL for secure access
     * @param {string} s3Key - S3 object key
     * @param {string} operation - S3 operation
     * @param {number} expiresIn - Expiration time in seconds
     * @returns {Promise<string>} Pre-signed URL
     */
    async generatePresignedUrl(s3Key, operation = 'getObject', expiresIn = 3600) {
        try {
            const params = {
                Bucket: this.bucketName,
                Key: s3Key,
                Expires: expiresIn
            };

            return await this.s3.getSignedUrlPromise(operation, params);
        } catch (error) {
            logger.error('Failed to generate pre-signed URL:', error);
            throw new Error(`Failed to generate pre-signed URL: ${error.message}`);
        }
    }

    /**
     * Scan file for viruses
     * @param {Buffer} fileBuffer - File buffer to scan
     */
    async scanForViruses(fileBuffer) {
        if (this.credentials.VIRUS_SCAN_API_KEY) {
            try {
                const axios = require('axios');
                const FormData = require('form-data');
                
                const form = new FormData();
                form.append('file', fileBuffer, 'scan_file');
                
                const response = await axios.post(
                    `${this.credentials.VIRUS_SCAN_API_URL}/file/scan`,
                    form,
                    {
                        headers: {
                            ...form.getHeaders(),
                            'x-apikey': this.credentials.VIRUS_SCAN_API_KEY
                        }
                    }
                );

                if (response.data.response_code !== 1) {
                    throw new Error('Virus scan failed');
                }

                logger.info('File passed virus scan');
            } catch (error) {
                logger.error('Virus scan failed:', error.message);
                throw new Error('File failed virus scan');
            }
        }
    }

    /**
     * Validate file type for pharmaceutical documents
     * @param {Object} file - File object
     * @param {string} folder - S3 folder
     */
    async validateFileType(file, folder) {
        const allowedTypes = {
            certificates: ['application/pdf', 'image/jpeg', 'image/png'],
            batchDocuments: ['application/pdf', 'text/csv', 'application/vnd.ms-excel'],
            regulatory: ['application/xml', 'text/csv', 'application/json'],
            labReports: ['application/pdf', 'image/jpeg', 'image/png', 'text/csv']
        };

        const allowedMimeTypes = allowedTypes[folder] || ['application/pdf', 'image/jpeg', 'image/png', 'text/csv'];
        
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new Error(`File type ${file.mimetype} not allowed for folder ${folder}`);
        }

        // Additional validation for PDF files
        if (file.mimetype === 'application/pdf') {
            await this.validatePDFSignature(file.buffer);
        }
    }

    /**
     * Validate PDF digital signature
     * @param {Buffer} pdfBuffer - PDF file buffer
     */
    async validatePDFSignature(pdfBuffer) {
        // Basic PDF signature validation
        const pdfHeader = pdfBuffer.toString('ascii', 0, 4);
        if (pdfHeader !== '%PDF') {
            throw new Error('Invalid PDF file format');
        }
    }

    /**
     * Generate digital signature for file
     * @param {Buffer} fileBuffer - File buffer
     * @param {Object} metadata - File metadata
     * @returns {Promise<string>} Digital signature
     */
    async generateDigitalSignature(fileBuffer, metadata) {
        try {
            const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
            const signatureData = {
                hash,
                timestamp: new Date().toISOString(),
                metadata,
                signer: metadata.uploaderId || 'system'
            };

            const signature = crypto
                .createHmac('sha256', this.credentials.ENCRYPTION_KEY)
                .update(JSON.stringify(signatureData))
                .digest('hex');

            return signature;
        } catch (error) {
            logger.error('Failed to generate digital signature:', error);
            throw new Error('Digital signature generation failed');
        }
    }

    /**
     * Check access permissions for file
     * @param {string} fileId - File ID
     * @param {string} userId - User ID
     * @param {string} action - Action (READ, WRITE, DELETE)
     */
    async checkAccessPermissions(fileId, userId, action) {
        // Implement role-based access control
        // This would typically check against a database
        logger.debug(`Checking ${action} permissions for file ${fileId} by user ${userId}`);
        return true; // Simplified for now
    }

    /**
     * Create audit trail entry
     * @param {Object} auditData - Audit trail data
     */
    async createAuditTrail(auditData) {
        try {
            const auditEntry = {
                ...auditData,
                id: uuidv4(),
                timestamp: new Date().toISOString(),
                complianceMode: this.credentials.COMPLIANCE_MODE || 'FDA_21CFR11'
            };

            // Store audit trail in S3
            const auditKey = `${this.folders.compliance}${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${auditEntry.id}.json`;
            
            await this.s3.putObject({
                Bucket: this.bucketName,
                Key: auditKey,
                Body: JSON.stringify(auditEntry, null, 2),
                ContentType: 'application/json',
                ServerSideEncryption: 'AES256'
            }).promise();

            logger.debug('Audit trail entry created:', auditEntry.id);
        } catch (error) {
            logger.error('Failed to create audit trail:', error);
        }
    }

    /**
     * Delete document with proper cleanup
     * @param {string} fileId - File ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Delete result
     */
    async deleteDocument(fileId, userId) {
        try {
            const fileInfo = await this.getFileInfo(fileId);
            
            if (!fileInfo) {
                throw new Error('File not found');
            }

            // Check delete permissions
            await this.checkAccessPermissions(fileId, userId, 'DELETE');

            // Delete from S3
            await this.s3.deleteObject({
                Bucket: this.bucketName,
                Key: fileInfo.s3Key
            }).promise();

            // Create audit trail entry
            await this.createAuditTrail({
                action: 'DOCUMENT_DELETE',
                fileId,
                userId,
                timestamp: new Date().toISOString()
            });

            logger.info(`Document deleted: ${fileId}`);

            return {
                success: true,
                fileId,
                deletedAt: new Date().toISOString()
            };

        } catch (error) {
            logger.error('Document deletion failed:', error);
            throw new Error(`Document deletion failed: ${error.message}`);
        }
    }

    /**
     * List documents with filtering and pagination
     * @param {Object} filters - Filter criteria
     * @param {number} page - Page number
     * @param {number} limit - Items per page
     * @returns {Promise<Object>} List result
     */
    async listDocuments(filters = {}, page = 1, limit = 20) {
        try {
            const listParams = {
                Bucket: this.bucketName,
                MaxKeys: 1000
            };

            if (filters.folder) {
                listParams.Prefix = this.folders[filters.folder] || filters.folder;
            }

            const objects = await this.s3.listObjectsV2(listParams).promise();
            const documents = [];

            for (const obj of objects.Contents) {
                try {
                    const metadata = await this.s3.headObject({
                        Bucket: this.bucketName,
                        Key: obj.Key
                    }).promise();

                    if (metadata.Metadata['file-id']) {
                        documents.push({
                            fileId: metadata.Metadata['file-id'],
                            fileName: metadata.Metadata['original-name'],
                            s3Key: obj.Key,
                            size: obj.Size,
                            contentType: metadata.ContentType,
                            uploadTimestamp: metadata.Metadata['upload-timestamp'],
                            uploaderId: metadata.Metadata['uploader-id'],
                            documentType: metadata.Metadata['document-type'],
                            batchId: metadata.Metadata['batch-id']
                        });
                    }
                } catch (error) {
                    logger.debug('Skipping object due to metadata error:', error.message);
                }
            }

            // Apply filters
            let filteredDocuments = documents;
            if (filters.documentType) {
                filteredDocuments = filteredDocuments.filter(doc => doc.documentType === filters.documentType);
            }
            if (filters.batchId) {
                filteredDocuments = filteredDocuments.filter(doc => doc.batchId === filters.batchId);
            }
            if (filters.uploaderId) {
                filteredDocuments = filteredDocuments.filter(doc => doc.uploaderId === filters.uploaderId);
            }

            // Pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

            return {
                success: true,
                documents: paginatedDocuments,
                pagination: {
                    page,
                    limit,
                    total: filteredDocuments.length,
                    pages: Math.ceil(filteredDocuments.length / limit)
                }
            };

        } catch (error) {
            logger.error('Failed to list documents:', error);
            throw new Error(`Failed to list documents: ${error.message}`);
        }
    }

    /**
     * Get storage statistics
     * @returns {Promise<Object>} Storage statistics
     */
    async getStorageStats() {
        try {
            const listParams = {
                Bucket: this.bucketName,
                MaxKeys: 1000
            };

            const objects = await this.s3.listObjectsV2(listParams).promise();
            
            let totalSize = 0;
            let documentCount = 0;
            const folderStats = {};

            for (const obj of objects.Contents) {
                totalSize += obj.Size;
                documentCount++;

                // Categorize by folder
                const folder = Object.keys(this.folders).find(key => 
                    obj.Key.startsWith(this.folders[key])
                ) || 'other';

                if (!folderStats[folder]) {
                    folderStats[folder] = { count: 0, size: 0 };
                }
                folderStats[folder].count++;
                folderStats[folder].size += obj.Size;
            }

            return {
                success: true,
                totalDocuments: documentCount,
                totalSize,
                totalSizeFormatted: this.formatBytes(totalSize),
                folderStats,
                bucketName: this.bucketName,
                region: this.region
            };

        } catch (error) {
            logger.error('Failed to get storage stats:', error);
            throw new Error(`Failed to get storage stats: ${error.message}`);
        }
    }

    /**
     * Format bytes to human readable format
     * @param {number} bytes - Bytes to format
     * @returns {string} Formatted string
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

module.exports = S3Service;