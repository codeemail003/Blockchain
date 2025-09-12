/**
 * @fileoverview Enterprise security and compliance layer for pharmaceutical blockchain
 * Implements FDA 21 CFR Part 11, GDPR, and pharmaceutical industry requirements
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');
const HSM = require('./hsm'); // Hardware Security Module integration
const RBAC = require('./rbac'); // Role-Based Access Control

class SecurityAndCompliance extends EventEmitter {
    constructor(blockchain, options = {}) {
        super();
        
        this.blockchain = blockchain;
        
        // Security components
        this.hsm = new HSM(options.hsm);
        this.rbac = new RBAC(options.rbac);
        this.multiSig = new Map();
        
        // Compliance tracking
        this.auditLog = [];
        this.complianceReports = new Map();
        this.validationFramework = new Map();
        
        // Encryption management
        this.keyStore = new Map();
        this.encryptionPolicies = new Map();
        
        // Initialize security
        this.initialize(options);
    }

    /**
     * Initialize security and compliance components
     */
    async initialize(options) {
        // Initialize HSM
        await this.hsm.initialize();
        
        // Set up RBAC
        await this.setupRBAC();
        
        // Initialize validation framework
        await this.initializeValidationFramework();
        
        // Start audit logging
        this.startAuditLogging();
        
        console.log('Security and compliance layer initialized');
    }

    /**
     * Set up role-based access control
     */
    async setupRBAC() {
        // Define pharmaceutical roles
        const roles = [
            {
                name: 'ADMIN',
                permissions: ['*']
            },
            {
                name: 'PHARMACIST',
                permissions: [
                    'VIEW_DRUG_DATA',
                    'CREATE_PRESCRIPTION',
                    'VERIFY_DRUG'
                ]
            },
            {
                name: 'MANUFACTURER',
                permissions: [
                    'CREATE_BATCH',
                    'UPDATE_BATCH',
                    'QUALITY_CONTROL'
                ]
            },
            {
                name: 'REGULATOR',
                permissions: [
                    'VIEW_ALL_DATA',
                    'CREATE_RECALL',
                    'COMPLIANCE_AUDIT'
                ]
            },
            {
                name: 'DISTRIBUTOR',
                permissions: [
                    'VIEW_SHIPMENT',
                    'UPDATE_LOCATION',
                    'VERIFY_RECEIPT'
                ]
            }
        ];
        
        // Register roles
        for (const role of roles) {
            await this.rbac.addRole(role);
        }
    }

    /**
     * Initialize regulatory validation framework
     */
    async initializeValidationFramework() {
        // FDA 21 CFR Part 11 requirements
        this.validationFramework.set('FDA_21_CFR_11', {
            electronicSignatures: this.validateElectronicSignature.bind(this),
            auditTrails: this.validateAuditTrail.bind(this),
            systemValidation: this.validateSystemCompliance.bind(this),
            recordRetention: this.validateRecordRetention.bind(this)
        });
        
        // GDPR requirements
        this.validationFramework.set('GDPR', {
            dataPrivacy: this.validateDataPrivacy.bind(this),
            dataRetention: this.validateDataRetention.bind(this),
            dataConsent: this.validateDataConsent.bind(this),
            dataProtection: this.validateDataProtection.bind(this)
        });
        
        // GxP requirements
        this.validationFramework.set('GXP', {
            qualityManagement: this.validateQualityManagement.bind(this),
            documentation: this.validateDocumentation.bind(this),
            equipmentValidation: this.validateEquipment.bind(this),
            processControl: this.validateProcessControl.bind(this)
        });
    }

    /**
     * Create multi-signature transaction
     */
    async createMultiSigTransaction(transaction, requiredSigners) {
        const txId = crypto.randomBytes(32).toString('hex');
        
        // Initialize multi-sig transaction
        const multiSigTx = {
            id: txId,
            transaction,
            requiredSigners,
            signatures: new Map(),
            status: 'PENDING',
            createdAt: Date.now()
        };
        
        // Store in multi-sig registry
        this.multiSig.set(txId, multiSigTx);
        
        // Create audit log entry
        this.addAuditLog('MULTI_SIG_CREATED', {
            txId,
            requiredSigners,
            timestamp: multiSigTx.createdAt
        });
        
        return txId;
    }

    /**
     * Add signature to multi-sig transaction
     */
    async addSignature(txId, signer, signature) {
        const tx = this.multiSig.get(txId);
        if (!tx) throw new Error('Transaction not found');
        
        // Verify signer authorization
        if (!this.rbac.hasPermission(signer, 'SIGN_TRANSACTION')) {
            throw new Error('Signer not authorized');
        }
        
        // Verify signature
        const isValid = await this.hsm.verifySignature(
            tx.transaction,
            signature,
            signer.publicKey
        );
        
        if (!isValid) {
            throw new Error('Invalid signature');
        }
        
        // Add signature
        tx.signatures.set(signer.id, {
            signature,
            timestamp: Date.now()
        });
        
        // Check if enough signatures
        if (tx.signatures.size >= tx.requiredSigners) {
            await this.finalizeMultiSigTransaction(tx);
        }
        
        // Add audit log
        this.addAuditLog('SIGNATURE_ADDED', {
            txId,
            signer: signer.id,
            timestamp: Date.now()
        });
        
        return tx;
    }

    /**
     * Finalize multi-signature transaction
     */
    async finalizeMultiSigTransaction(tx) {
        // Create blockchain transaction
        const blockchainTx = await this.blockchain.createTransaction(
            'MULTI_SIG_TRANSACTION',
            {
                originalTx: tx.transaction,
                signatures: Array.from(tx.signatures.entries()),
                timestamp: Date.now()
            },
            this.hsm.getSystemKey()
        );
        
        // Update status
        tx.status = 'COMPLETED';
        tx.completedAt = Date.now();
        
        // Add audit log
        this.addAuditLog('MULTI_SIG_COMPLETED', {
            txId: tx.id,
            blockchainTx: blockchainTx.id,
            timestamp: tx.completedAt
        });
        
        return blockchainTx;
    }

    /**
     * Encrypt sensitive data
     */
    async encryptData(data, policy) {
        // Get encryption policy
        const encryptionPolicy = this.encryptionPolicies.get(policy);
        if (!encryptionPolicy) {
            throw new Error(`Encryption policy not found: ${policy}`);
        }
        
        // Generate data key using HSM
        const dataKey = await this.hsm.generateDataKey(encryptionPolicy.keySpec);
        
        // Encrypt data
        const encrypted = crypto.createCipheriv(
            encryptionPolicy.algorithm,
            dataKey.key,
            dataKey.iv
        );
        
        let encryptedData = encrypted.update(JSON.stringify(data), 'utf8', 'hex');
        encryptedData += encrypted.final('hex');
        
        // Store encrypted key
        const keyId = crypto.randomBytes(16).toString('hex');
        this.keyStore.set(keyId, {
            encryptedKey: dataKey.encryptedKey,
            iv: dataKey.iv,
            policy,
            timestamp: Date.now()
        });
        
        return {
            keyId,
            encryptedData,
            algorithm: encryptionPolicy.algorithm
        };
    }

    /**
     * Decrypt sensitive data
     */
    async decryptData(encryptedData, keyId) {
        // Get key metadata
        const keyMeta = this.keyStore.get(keyId);
        if (!keyMeta) {
            throw new Error('Encryption key not found');
        }
        
        // Decrypt data key using HSM
        const dataKey = await this.hsm.decryptDataKey(keyMeta.encryptedKey);
        
        // Decrypt data
        const decipher = crypto.createDecipheriv(
            keyMeta.algorithm,
            dataKey,
            keyMeta.iv
        );
        
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    }

    /**
     * Add audit log entry
     */
    addAuditLog(action, details) {
        const entry = {
            id: crypto.randomBytes(16).toString('hex'),
            action,
            details,
            timestamp: Date.now(),
            hash: null
        };
        
        // Calculate entry hash
        entry.hash = this.calculateEntryHash(entry);
        
        // Add to audit log
        this.auditLog.push(entry);
        
        // Create blockchain transaction for important actions
        if (this.isImportantAction(action)) {
            this.blockchain.createTransaction(
                'AUDIT_LOG',
                entry,
                this.hsm.getSystemKey()
            );
        }
        
        return entry;
    }

    /**
     * Calculate audit log entry hash
     */
    calculateEntryHash(entry) {
        const data = JSON.stringify({
            action: entry.action,
            details: entry.details,
            timestamp: entry.timestamp
        });
        
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Check if action requires blockchain logging
     */
    isImportantAction(action) {
        const importantActions = [
            'MULTI_SIG_COMPLETED',
            'COMPLIANCE_VIOLATION',
            'REGULATORY_SUBMISSION',
            'SECURITY_ALERT'
        ];
        
        return importantActions.includes(action);
    }

    /**
     * Validate electronic signature
     */
    async validateElectronicSignature(signature) {
        try {
            // Check signature format
            if (!signature.signerId || !signature.data || !signature.timestamp) {
                return false;
            }
            
            // Verify signer authorization
            const signer = await this.rbac.getUser(signature.signerId);
            if (!signer) return false;
            
            // Verify signature using HSM
            const isValid = await this.hsm.verifySignature(
                signature.data,
                signature.signature,
                signer.publicKey
            );
            
            return isValid;
            
        } catch (error) {
            console.error('Electronic signature validation failed:', error);
            return false;
        }
    }

    /**
     * Validate audit trail
     */
    validateAuditTrail(trail) {
        try {
            // Check trail completeness
            if (!Array.isArray(trail) || trail.length === 0) {
                return false;
            }
            
            // Verify hash chain
            let previousHash = null;
            
            for (const entry of trail) {
                // Verify entry format
                if (!this.isValidAuditEntry(entry)) {
                    return false;
                }
                
                // Verify hash chain
                if (previousHash && entry.previousHash !== previousHash) {
                    return false;
                }
                
                // Verify entry hash
                const calculatedHash = this.calculateEntryHash(entry);
                if (calculatedHash !== entry.hash) {
                    return false;
                }
                
                previousHash = entry.hash;
            }
            
            return true;
            
        } catch (error) {
            console.error('Audit trail validation failed:', error);
            return false;
        }
    }

    /**
     * Validate system compliance
     */
    async validateSystemCompliance() {
        const validations = [];
        
        // Validate HSM status
        validations.push(await this.hsm.validateStatus());
        
        // Validate RBAC configuration
        validations.push(await this.rbac.validateConfiguration());
        
        // Validate audit log integrity
        validations.push(this.validateAuditTrail(this.auditLog));
        
        // Validate encryption policies
        validations.push(this.validateEncryptionPolicies());
        
        // Check all validations passed
        return validations.every(v => v === true);
    }

    /**
     * Validate data privacy compliance
     */
    validateDataPrivacy(data) {
        // Check data classification
        if (!data.classification) {
            return false;
        }
        
        // Verify encryption for sensitive data
        if (data.classification === 'SENSITIVE' && !data.encrypted) {
            return false;
        }
        
        // Check access controls
        if (!data.accessControl || !Array.isArray(data.accessControl)) {
            return false;
        }
        
        // Verify retention policy
        if (!data.retentionPolicy) {
            return false;
        }
        
        return true;
    }

    /**
     * Create compliance report
     */
    async createComplianceReport(type) {
        const report = {
            id: crypto.randomBytes(16).toString('hex'),
            type,
            timestamp: Date.now(),
            systemStatus: await this.validateSystemCompliance(),
            auditSummary: this.summarizeAuditLog(),
            securityMetrics: await this.getSecurityMetrics(),
            validationResults: await this.runValidationChecks(type)
        };
        
        // Store report
        this.complianceReports.set(report.id, report);
        
        // Create blockchain transaction
        const transaction = await this.blockchain.createTransaction(
            'COMPLIANCE_REPORT',
            report,
            this.hsm.getSystemKey()
        );
        
        return {
            report,
            transaction
        };
    }

    /**
     * Get security metrics
     */
    async getSecurityMetrics() {
        return {
            multiSigTransactions: this.multiSig.size,
            activeEncryptionKeys: this.keyStore.size,
            auditLogEntries: this.auditLog.length,
            complianceReports: this.complianceReports.size,
            hsmStatus: await this.hsm.getStatus(),
            rbacUsers: await this.rbac.getUserCount(),
            validationFrameworks: this.validationFramework.size
        };
    }

    /**
     * Run validation checks
     */
    async runValidationChecks(type) {
        const framework = this.validationFramework.get(type);
        if (!framework) {
            throw new Error(`Validation framework not found: ${type}`);
        }
        
        const results = new Map();
        
        // Run all validations in framework
        for (const [check, validator] of Object.entries(framework)) {
            try {
                const result = await validator();
                results.set(check, {
                    passed: result,
                    timestamp: Date.now()
                });
            } catch (error) {
                results.set(check, {
                    passed: false,
                    error: error.message,
                    timestamp: Date.now()
                });
            }
        }
        
        return Array.from(results.entries());
    }
}

module.exports = SecurityAndCompliance;