/**
 * @fileoverview Compliance Service for PharbitChain
 * Handles FDA 21 CFR Part 11, DSCSA, and other pharmaceutical compliance requirements
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class ComplianceService {
    constructor(credentials) {
        this.credentials = credentials;
        this.complianceMode = credentials.COMPLIANCE_MODE || 'FDA_21CFR11';
        this.auditRetentionDays = parseInt(credentials.AUDIT_RETENTION_DAYS) || 2555;
        this.digitalSignatureRequired = credentials.DIGITAL_SIGNATURE_REQUIRED === 'true';
        this.dscsaEnabled = credentials.DSCSA_ENABLED === 'true';
        
        // Compliance rules and validations
        this.complianceRules = {
            FDA_21CFR11: {
                digitalSignatures: true,
                auditTrail: true,
                userAuthentication: true,
                documentIntegrity: true,
                accessControl: true,
                retentionPeriod: 2555 // 7 years
            },
            DSCSA: {
                serialization: true,
                trackAndTrace: true,
                verification: true,
                reporting: true,
                retentionPeriod: 2555
            },
            GDPR: {
                dataProtection: true,
                consentManagement: true,
                rightToErasure: true,
                dataPortability: true,
                retentionPeriod: 2555
            },
            ISO27001: {
                informationSecurity: true,
                riskManagement: true,
                accessControl: true,
                incidentManagement: true,
                retentionPeriod: 2555
            }
        };
    }

    /**
     * Validate document for FDA 21 CFR Part 11 compliance
     * @param {Object} document - Document object
     * @param {Object} user - User object
     * @returns {Object} Compliance validation result
     */
    validateFDA21CFR11(document, user) {
        const violations = [];
        const warnings = [];

        // Check digital signature requirement
        if (this.digitalSignatureRequired && !document.digitalSignature) {
            violations.push({
                rule: 'DIGITAL_SIGNATURE_REQUIRED',
                message: 'Digital signature is required for FDA 21 CFR Part 11 compliance',
                severity: 'high'
            });
        }

        // Check document integrity
        if (!document.fileHash) {
            violations.push({
                rule: 'DOCUMENT_INTEGRITY',
                message: 'Document hash is required for integrity verification',
                severity: 'high'
            });
        }

        // Check user authentication
        if (!user || !user.id) {
            violations.push({
                rule: 'USER_AUTHENTICATION',
                message: 'User authentication is required for document operations',
                severity: 'high'
            });
        }

        // Check audit trail
        if (!document.auditTrail) {
            warnings.push({
                rule: 'AUDIT_TRAIL',
                message: 'Audit trail should be maintained for compliance',
                severity: 'medium'
            });
        }

        // Check document metadata
        if (!document.metadata || !document.metadata.timestamp) {
            violations.push({
                rule: 'DOCUMENT_METADATA',
                message: 'Document metadata with timestamp is required',
                severity: 'high'
            });
        }

        return {
            compliant: violations.length === 0,
            violations,
            warnings,
            complianceMode: 'FDA_21CFR11',
            validatedAt: new Date().toISOString()
        };
    }

    /**
     * Validate DSCSA serialization data
     * @param {Object} serializationData - Serialization data
     * @returns {Object} DSCSA validation result
     */
    validateDSCSA(serializationData) {
        const violations = [];
        const warnings = [];

        // Required DSCSA fields
        const requiredFields = [
            'productIdentifier',
            'serialNumber',
            'lotNumber',
            'expirationDate',
            'transactionId',
            'transactionDate'
        ];

        for (const field of requiredFields) {
            if (!serializationData[field]) {
                violations.push({
                    rule: `DSCSA_${field.toUpperCase()}_REQUIRED`,
                    message: `DSCSA field '${field}' is required`,
                    severity: 'high'
                });
            }
        }

        // Validate product identifier format (GTIN-14)
        if (serializationData.productIdentifier) {
            const gtin14Regex = /^\d{14}$/;
            if (!gtin14Regex.test(serializationData.productIdentifier)) {
                violations.push({
                    rule: 'DSCSA_PRODUCT_IDENTIFIER_FORMAT',
                    message: 'Product identifier must be a valid GTIN-14 (14 digits)',
                    severity: 'high'
                });
            }
        }

        // Validate serial number format
        if (serializationData.serialNumber) {
            if (serializationData.serialNumber.length < 8 || serializationData.serialNumber.length > 20) {
                violations.push({
                    rule: 'DSCSA_SERIAL_NUMBER_FORMAT',
                    message: 'Serial number must be 8-20 characters',
                    severity: 'high'
                });
            }
        }

        // Validate expiration date
        if (serializationData.expirationDate) {
            const expDate = new Date(serializationData.expirationDate);
            const now = new Date();
            if (expDate <= now) {
                warnings.push({
                    rule: 'DSCSA_EXPIRATION_DATE',
                    message: 'Product has expired or will expire soon',
                    severity: 'medium'
                });
            }
        }

        return {
            compliant: violations.length === 0,
            violations,
            warnings,
            complianceMode: 'DSCSA',
            validatedAt: new Date().toISOString()
        };
    }

    /**
     * Generate digital signature for document
     * @param {Buffer} documentBuffer - Document buffer
     * @param {Object} metadata - Document metadata
     * @param {string} privateKey - Private key for signing
     * @returns {string} Digital signature
     */
    generateDigitalSignature(documentBuffer, metadata, privateKey) {
        try {
            // Create signature data
            const signatureData = {
                documentHash: crypto.createHash('sha256').update(documentBuffer).digest('hex'),
                metadata,
                timestamp: new Date().toISOString(),
                complianceMode: this.complianceMode
            };

            // Generate signature
            const signature = crypto
                .createHmac('sha256', privateKey)
                .update(JSON.stringify(signatureData))
                .digest('hex');

            return signature;

        } catch (error) {
            logger.error('Digital signature generation failed:', error);
            throw new Error('Digital signature generation failed');
        }
    }

    /**
     * Verify digital signature
     * @param {Buffer} documentBuffer - Document buffer
     * @param {string} signature - Digital signature
     * @param {Object} metadata - Document metadata
     * @param {string} privateKey - Private key for verification
     * @returns {boolean} Signature verification result
     */
    verifyDigitalSignature(documentBuffer, signature, metadata, privateKey) {
        try {
            const expectedSignature = this.generateDigitalSignature(documentBuffer, metadata, privateKey);
            return signature === expectedSignature;

        } catch (error) {
            logger.error('Digital signature verification failed:', error);
            return false;
        }
    }

    /**
     * Create audit trail entry
     * @param {Object} action - Action details
     * @param {Object} user - User performing action
     * @param {Object} entity - Entity being acted upon
     * @returns {Object} Audit trail entry
     */
    createAuditTrailEntry(action, user, entity) {
        const auditEntry = {
            id: uuidv4(),
            action: action.type,
            description: action.description,
            entityType: entity.type,
            entityId: entity.id,
            userId: user.id,
            userEmail: user.email,
            userRole: user.role,
            organization: user.organization,
            timestamp: new Date().toISOString(),
            ipAddress: action.ipAddress || 'unknown',
            userAgent: action.userAgent || 'unknown',
            complianceMode: this.complianceMode,
            digitalSignature: action.digitalSignature || null,
            metadata: {
                ...action.metadata,
                complianceVersion: '1.0.0',
                retentionDays: this.auditRetentionDays
            }
        };

        // Log audit entry
        logger.audit('Audit Trail Entry Created', auditEntry);

        return auditEntry;
    }

    /**
     * Validate batch for pharmaceutical compliance
     * @param {Object} batch - Batch object
     * @param {Object} user - User object
     * @returns {Object} Batch compliance validation
     */
    validateBatchCompliance(batch, user) {
        const violations = [];
        const warnings = [];

        // Check required batch fields
        const requiredFields = [
            'batchId',
            'productCode',
            'productName',
            'manufacturer',
            'quantity',
            'productionDate',
            'expiryDate'
        ];

        for (const field of requiredFields) {
            if (!batch[field]) {
                violations.push({
                    rule: `BATCH_${field.toUpperCase()}_REQUIRED`,
                    message: `Batch field '${field}' is required`,
                    severity: 'high'
                });
            }
        }

        // Validate production date
        if (batch.productionDate) {
            const prodDate = new Date(batch.productionDate);
            const now = new Date();
            if (prodDate > now) {
                violations.push({
                    rule: 'BATCH_PRODUCTION_DATE_FUTURE',
                    message: 'Production date cannot be in the future',
                    severity: 'high'
                });
            }
        }

        // Validate expiry date
        if (batch.expiryDate && batch.productionDate) {
            const expDate = new Date(batch.expiryDate);
            const prodDate = new Date(batch.productionDate);
            if (expDate <= prodDate) {
                violations.push({
                    rule: 'BATCH_EXPIRY_DATE_INVALID',
                    message: 'Expiry date must be after production date',
                    severity: 'high'
                });
            }
        }

        // Validate quantity
        if (batch.quantity && batch.quantity <= 0) {
            violations.push({
                rule: 'BATCH_QUANTITY_INVALID',
                message: 'Batch quantity must be greater than 0',
                severity: 'high'
            });
        }

        // Check DSCSA compliance if enabled
        if (this.dscsaEnabled && batch.serializationData) {
            const dscsaValidation = this.validateDSCSA(batch.serializationData);
            violations.push(...dscsaValidation.violations);
            warnings.push(...dscsaValidation.warnings);
        }

        return {
            compliant: violations.length === 0,
            violations,
            warnings,
            complianceMode: this.complianceMode,
            validatedAt: new Date().toISOString()
        };
    }

    /**
     * Generate compliance report
     * @param {Object} filters - Report filters
     * @param {Object} databaseService - Database service instance
     * @returns {Promise<Object>} Compliance report
     */
    async generateComplianceReport(filters, databaseService) {
        try {
            const report = {
                id: uuidv4(),
                generatedAt: new Date().toISOString(),
                complianceMode: this.complianceMode,
                filters,
                summary: {
                    totalDocuments: 0,
                    compliantDocuments: 0,
                    nonCompliantDocuments: 0,
                    totalBatches: 0,
                    compliantBatches: 0,
                    nonCompliantBatches: 0,
                    violations: [],
                    warnings: []
                },
                details: []
            };

            // Get documents
            const documents = await databaseService.getModel('Document').findAll({
                where: filters.documentFilters || {},
                include: [
                    {
                        model: databaseService.getModel('User'),
                        as: 'uploader',
                        attributes: ['id', 'email', 'role', 'organization']
                    }
                ]
            });

            // Analyze documents
            for (const document of documents) {
                const validation = this.validateFDA21CFR11(document, document.uploader);
                report.summary.totalDocuments++;
                
                if (validation.compliant) {
                    report.summary.compliantDocuments++;
                } else {
                    report.summary.nonCompliantDocuments++;
                    report.summary.violations.push(...validation.violations);
                }
                
                report.summary.warnings.push(...validation.warnings);
            }

            // Get batches
            const batches = await databaseService.getModel('Batch').findAll({
                where: filters.batchFilters || {}
            });

            // Analyze batches
            for (const batch of batches) {
                const validation = this.validateBatchCompliance(batch, { id: 'system' });
                report.summary.totalBatches++;
                
                if (validation.compliant) {
                    report.summary.compliantBatches++;
                } else {
                    report.summary.nonCompliantBatches++;
                    report.summary.violations.push(...validation.violations);
                }
                
                report.summary.warnings.push(...validation.warnings);
            }

            // Calculate compliance percentage
            const totalEntities = report.summary.totalDocuments + report.summary.totalBatches;
            const compliantEntities = report.summary.compliantDocuments + report.summary.compliantBatches;
            report.summary.compliancePercentage = totalEntities > 0 ? 
                Math.round((compliantEntities / totalEntities) * 100) : 100;

            // Log compliance report generation
            logger.compliance('Compliance Report Generated', {
                reportId: report.id,
                complianceMode: this.complianceMode,
                totalEntities,
                compliancePercentage: report.summary.compliancePercentage
            });

            return report;

        } catch (error) {
            logger.error('Compliance report generation failed:', error);
            throw new Error('Compliance report generation failed');
        }
    }

    /**
     * Check data retention compliance
     * @param {Object} databaseService - Database service instance
     * @returns {Promise<Object>} Retention compliance check
     */
    async checkDataRetentionCompliance(databaseService) {
        try {
            const retentionDate = new Date();
            retentionDate.setDate(retentionDate.getDate() - this.auditRetentionDays);

            const expiredRecords = {
                auditTrails: 0,
                documents: 0,
                batches: 0,
                violations: 0
            };

            // Check expired audit trails
            const expiredAuditTrails = await databaseService.getModel('AuditTrail').count({
                where: {
                    createdAt: {
                        [databaseService.getSequelize().Op.lt]: retentionDate
                    }
                }
            });
            expiredRecords.auditTrails = expiredAuditTrails;

            // Check expired documents
            const expiredDocuments = await databaseService.getModel('Document').count({
                where: {
                    createdAt: {
                        [databaseService.getSequelize().Op.lt]: retentionDate
                    }
                }
            });
            expiredRecords.documents = expiredDocuments;

            // Check expired batches
            const expiredBatches = await databaseService.getModel('Batch').count({
                where: {
                    createdAt: {
                        [databaseService.getSequelize().Op.lt]: retentionDate
                    }
                }
            });
            expiredRecords.batches = expiredBatches;

            // Check compliance violations
            const expiredViolations = await databaseService.getModel('ComplianceViolation').count({
                where: {
                    createdAt: {
                        [databaseService.getSequelize().Op.lt]: retentionDate
                    }
                }
            });
            expiredRecords.violations = expiredViolations;

            const totalExpired = Object.values(expiredRecords).reduce((sum, count) => sum + count, 0);

            return {
                compliant: totalExpired === 0,
                retentionDays: this.auditRetentionDays,
                retentionDate: retentionDate.toISOString(),
                expiredRecords,
                totalExpired,
                actionRequired: totalExpired > 0
            };

        } catch (error) {
            logger.error('Data retention compliance check failed:', error);
            throw new Error('Data retention compliance check failed');
        }
    }

    /**
     * Clean up expired data
     * @param {Object} databaseService - Database service instance
     * @returns {Promise<Object>} Cleanup result
     */
    async cleanupExpiredData(databaseService) {
        try {
            const retentionDate = new Date();
            retentionDate.setDate(retentionDate.getDate() - this.auditRetentionDays);

            const cleanupResults = {
                auditTrails: 0,
                documents: 0,
                batches: 0,
                violations: 0,
                totalCleaned: 0
            };

            // Clean up expired audit trails
            const deletedAuditTrails = await databaseService.getModel('AuditTrail').destroy({
                where: {
                    createdAt: {
                        [databaseService.getSequelize().Op.lt]: retentionDate
                    }
                }
            });
            cleanupResults.auditTrails = deletedAuditTrails;

            // Clean up expired documents
            const deletedDocuments = await databaseService.getModel('Document').destroy({
                where: {
                    createdAt: {
                        [databaseService.getSequelize().Op.lt]: retentionDate
                    }
                }
            });
            cleanupResults.documents = deletedDocuments;

            // Clean up expired batches
            const deletedBatches = await databaseService.getModel('Batch').destroy({
                where: {
                    createdAt: {
                        [databaseService.getSequelize().Op.lt]: retentionDate
                    }
                }
            });
            cleanupResults.batches = deletedBatches;

            // Clean up expired compliance violations
            const deletedViolations = await databaseService.getModel('ComplianceViolation').destroy({
                where: {
                    createdAt: {
                        [databaseService.getSequelize().Op.lt]: retentionDate
                    }
                }
            });
            cleanupResults.violations = deletedViolations;

            cleanupResults.totalCleaned = Object.values(cleanupResults).reduce((sum, count) => sum + count, 0);

            // Log cleanup
            logger.compliance('Data Cleanup Completed', {
                retentionDate: retentionDate.toISOString(),
                cleanupResults
            });

            return cleanupResults;

        } catch (error) {
            logger.error('Data cleanup failed:', error);
            throw new Error('Data cleanup failed');
        }
    }
}

module.exports = ComplianceService;