/**
 * @fileoverview AWS S3 integration for pharmaceutical blockchain
 * Handles file storage, blockchain backups, and document management
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../logger');

class S3Storage {
    constructor() {
        this.s3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION || 'us-east-1'
        });
        
        this.bucketName = process.env.S3_BUCKET_NAME;
        this.initialized = false;
        
        if (!this.bucketName) {
            throw new Error('S3_BUCKET_NAME environment variable is required');
        }
    }

    /**
     * Initialize S3 storage and create bucket if needed
     */
    async initialize() {
        try {
            // Test connection and create bucket if it doesn't exist
            await this.ensureBucketExists();
            this.initialized = true;
            logger.info('S3 storage initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize S3 storage:', error);
            throw error;
        }
    }

    /**
     * Ensure S3 bucket exists, create if it doesn't
     */
    async ensureBucketExists() {
        try {
            await this.s3.headBucket({ Bucket: this.bucketName }).promise();
            logger.info(`S3 bucket ${this.bucketName} exists`);
        } catch (error) {
            if (error.statusCode === 404) {
                // Bucket doesn't exist, create it
                await this.s3.createBucket({ Bucket: this.bucketName }).promise();
                logger.info(`Created S3 bucket: ${this.bucketName}`);
                
                // Set up CORS configuration for web access
                await this.setupCORS();
            } else {
                throw error;
            }
        }
    }

    /**
     * Setup CORS configuration for the bucket
     */
    async setupCORS() {
        const corsConfiguration = {
            CORSRules: [
                {
                    AllowedHeaders: ['*'],
                    AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
                    AllowedOrigins: ['*'],
                    ExposeHeaders: ['ETag'],
                    MaxAgeSeconds: 3000
                }
            ]
        };

        try {
            await this.s3.putBucketCors({
                Bucket: this.bucketName,
                CORSConfiguration: corsConfiguration
            }).promise();
            logger.info('CORS configuration set for S3 bucket');
        } catch (error) {
            logger.warn('Failed to set CORS configuration:', error.message);
        }
    }

    /**
     * Upload file to S3
     */
    async uploadFile(filePath, s3Key, metadata = {}) {
        try {
            const fileContent = fs.readFileSync(filePath);
            const contentType = this.getContentType(filePath);
            
            const params = {
                Bucket: this.bucketName,
                Key: s3Key,
                Body: fileContent,
                ContentType: contentType,
                Metadata: {
                    ...metadata,
                    uploadedAt: new Date().toISOString(),
                    fileSize: fileContent.length.toString()
                }
            };

            const result = await this.s3.upload(params).promise();
            logger.info(`File uploaded to S3: ${s3Key}`);
            return result;
        } catch (error) {
            logger.error('Failed to upload file to S3:', error);
            throw error;
        }
    }

    /**
     * Upload data directly to S3
     */
    async uploadData(data, s3Key, contentType = 'application/json', metadata = {}) {
        try {
            const params = {
                Bucket: this.bucketName,
                Key: s3Key,
                Body: typeof data === 'string' ? data : JSON.stringify(data),
                ContentType: contentType,
                Metadata: {
                    ...metadata,
                    uploadedAt: new Date().toISOString()
                }
            };

            const result = await this.s3.upload(params).promise();
            logger.info(`Data uploaded to S3: ${s3Key}`);
            return result;
        } catch (error) {
            logger.error('Failed to upload data to S3:', error);
            throw error;
        }
    }

    /**
     * Download file from S3
     */
    async downloadFile(s3Key, localPath) {
        try {
            const params = {
                Bucket: this.bucketName,
                Key: s3Key
            };

            const result = await this.s3.getObject(params).promise();
            
            // Ensure directory exists
            const dir = path.dirname(localPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(localPath, result.Body);
            logger.info(`File downloaded from S3: ${s3Key}`);
            return result;
        } catch (error) {
            logger.error('Failed to download file from S3:', error);
            throw error;
        }
    }

    /**
     * Get file from S3 as buffer
     */
    async getFile(s3Key) {
        try {
            const params = {
                Bucket: this.bucketName,
                Key: s3Key
            };

            const result = await this.s3.getObject(params).promise();
            return result.Body;
        } catch (error) {
            logger.error('Failed to get file from S3:', error);
            throw error;
        }
    }

    /**
     * Delete file from S3
     */
    async deleteFile(s3Key) {
        try {
            const params = {
                Bucket: this.bucketName,
                Key: s3Key
            };

            await this.s3.deleteObject(params).promise();
            logger.info(`File deleted from S3: ${s3Key}`);
        } catch (error) {
            logger.error('Failed to delete file from S3:', error);
            throw error;
        }
    }

    /**
     * List files in S3 with prefix
     */
    async listFiles(prefix = '', maxKeys = 1000) {
        try {
            const params = {
                Bucket: this.bucketName,
                Prefix: prefix,
                MaxKeys: maxKeys
            };

            const result = await this.s3.listObjectsV2(params).promise();
            return result.Contents || [];
        } catch (error) {
            logger.error('Failed to list files in S3:', error);
            throw error;
        }
    }

    /**
     * Generate presigned URL for file access
     */
    async getPresignedUrl(s3Key, operation = 'getObject', expiresIn = 3600) {
        try {
            const params = {
                Bucket: this.bucketName,
                Key: s3Key,
                Expires: expiresIn
            };

            const url = await this.s3.getSignedUrlPromise(operation, params);
            return url;
        } catch (error) {
            logger.error('Failed to generate presigned URL:', error);
            throw error;
        }
    }

    /**
     * Backup blockchain data to S3
     */
    async backupBlockchain(blockchainData) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const s3Key = `blockchain/backups/blockchain-${timestamp}.json`;
            
            const backupData = {
                ...blockchainData,
                backupTimestamp: new Date().toISOString(),
                version: '1.0.0'
            };

            const result = await this.uploadData(
                backupData, 
                s3Key, 
                'application/json',
                { type: 'blockchain_backup' }
            );

            logger.info(`Blockchain backed up to S3: ${s3Key}`);
            return result;
        } catch (error) {
            logger.error('Failed to backup blockchain to S3:', error);
            throw error;
        }
    }

    /**
     * Backup batch data to S3
     */
    async backupBatchData(batchId, batchData) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const s3Key = `batches/${batchId}/backup-${timestamp}.json`;
            
            const backupData = {
                ...batchData,
                backupTimestamp: new Date().toISOString(),
                version: '1.0.0'
            };

            const result = await this.uploadData(
                backupData, 
                s3Key, 
                'application/json',
                { 
                    type: 'batch_backup',
                    batchId: batchId
                }
            );

            logger.info(`Batch ${batchId} backed up to S3: ${s3Key}`);
            return result;
        } catch (error) {
            logger.error('Failed to backup batch data to S3:', error);
            throw error;
        }
    }

    /**
     * Store pharmaceutical documents
     */
    async storeDocument(batchId, documentType, filePath, metadata = {}) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileExtension = path.extname(filePath);
            const s3Key = `documents/${batchId}/${documentType}-${timestamp}${fileExtension}`;
            
            const result = await this.uploadFile(filePath, s3Key, {
                ...metadata,
                type: 'pharmaceutical_document',
                batchId: batchId,
                documentType: documentType
            });

            logger.info(`Document stored in S3: ${s3Key}`);
            return result;
        } catch (error) {
            logger.error('Failed to store document in S3:', error);
            throw error;
        }
    }

    /**
     * Store temperature data export
     */
    async storeTemperatureExport(batchId, temperatureData) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const s3Key = `exports/temperature/${batchId}-${timestamp}.json`;
            
            const exportData = {
                batchId: batchId,
                temperatureData: temperatureData,
                exportTimestamp: new Date().toISOString(),
                recordCount: temperatureData.length
            };

            const result = await this.uploadData(
                exportData, 
                s3Key, 
                'application/json',
                { 
                    type: 'temperature_export',
                    batchId: batchId
                }
            );

            logger.info(`Temperature data exported to S3: ${s3Key}`);
            return result;
        } catch (error) {
            logger.error('Failed to store temperature export in S3:', error);
            throw error;
        }
    }

    /**
     * Store compliance reports
     */
    async storeComplianceReport(reportData) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const s3Key = `reports/compliance/compliance-report-${timestamp}.json`;
            
            const report = {
                ...reportData,
                generatedAt: new Date().toISOString(),
                version: '1.0.0'
            };

            const result = await this.uploadData(
                report, 
                s3Key, 
                'application/json',
                { type: 'compliance_report' }
            );

            logger.info(`Compliance report stored in S3: ${s3Key}`);
            return result;
        } catch (error) {
            logger.error('Failed to store compliance report in S3:', error);
            throw error;
        }
    }

    /**
     * Clean up old backups (keep last N days)
     */
    async cleanupOldBackups(prefix, daysToKeep = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            
            const files = await this.listFiles(prefix);
            const filesToDelete = files.filter(file => {
                return new Date(file.LastModified) < cutoffDate;
            });

            for (const file of filesToDelete) {
                await this.deleteFile(file.Key);
                logger.info(`Deleted old backup: ${file.Key}`);
            }

            logger.info(`Cleaned up ${filesToDelete.length} old backup files`);
            return filesToDelete.length;
        } catch (error) {
            logger.error('Failed to cleanup old backups:', error);
            throw error;
        }
    }

    /**
     * Get content type based on file extension
     */
    getContentType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const contentTypes = {
            '.json': 'application/json',
            '.pdf': 'application/pdf',
            '.txt': 'text/plain',
            '.csv': 'text/csv',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml'
        };
        
        return contentTypes[ext] || 'application/octet-stream';
    }

    /**
     * Generate file hash for integrity verification
     */
    generateFileHash(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Verify file integrity
     */
    async verifyFileIntegrity(s3Key, expectedHash) {
        try {
            const fileData = await this.getFile(s3Key);
            const actualHash = this.generateFileHash(fileData);
            return actualHash === expectedHash;
        } catch (error) {
            logger.error('Failed to verify file integrity:', error);
            return false;
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            await this.s3.headBucket({ Bucket: this.bucketName }).promise();
            
            return {
                status: 'healthy',
                storage: 'connected',
                bucket: this.bucketName,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                storage: 'disconnected',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = S3Storage;