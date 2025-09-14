/**
 * @fileoverview Secure credential management system for PharbitChain
 * Handles AWS credentials, database connections, and security keys
 * with validation and environment-specific configuration
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class CredentialManager {
    constructor() {
        this.requiredEnvVars = [
            'AWS_REGION',
            'AWS_S3_BUCKET',
            'AWS_ACCESS_KEY_ID',
            'AWS_SECRET_ACCESS_KEY',
            'JWT_SECRET',
            'ENCRYPTION_KEY',
            'DATABASE_URL',
            'REDIS_URL'
        ];
        
        this.optionalEnvVars = [
            'SMTP_HOST',
            'SMTP_USER',
            'SMTP_PASS',
            'VIRUS_SCAN_API_KEY',
            'CLOUDWATCH_GROUP'
        ];
        
        this.credentials = {};
        this.isValidated = false;
    }

    /**
     * Initialize and validate all credentials
     * @returns {Promise<Object>} Validated credentials object
     */
    async initialize() {
        try {
            console.log('🔐 Initializing credential management system...');
            
            // Load environment variables
            this.loadEnvironmentVariables();
            
            // Validate required credentials
            await this.validateCredentials();
            
            // Generate missing credentials if needed
            await this.generateMissingCredentials();
            
            // Test AWS connectivity
            await this.testAWSCredentials();
            
            // Test database connectivity
            await this.testDatabaseCredentials();
            
            this.isValidated = true;
            console.log('✅ Credential management system initialized successfully');
            
            return this.credentials;
            
        } catch (error) {
            console.error('❌ Credential initialization failed:', error.message);
            throw new Error(`Credential validation failed: ${error.message}`);
        }
    }

    /**
     * Load environment variables from .env file
     */
    loadEnvironmentVariables() {
        const envPath = path.join(process.cwd(), '.env');
        
        if (fs.existsSync(envPath)) {
            require('dotenv').config({ path: envPath });
            console.log('📄 Loaded environment variables from .env file');
        } else {
            console.log('⚠️  No .env file found, using system environment variables');
        }
    }

    /**
     * Validate all required credentials
     */
    async validateCredentials() {
        const missing = [];
        const invalid = [];

        for (const envVar of this.requiredEnvVars) {
            const value = process.env[envVar];
            
            if (!value) {
                missing.push(envVar);
                continue;
            }

            // Validate specific credential formats
            if (envVar === 'AWS_ACCESS_KEY_ID' && !this.isValidAWSAccessKey(value)) {
                invalid.push(`${envVar}: Invalid AWS Access Key format`);
            }
            
            if (envVar === 'AWS_SECRET_ACCESS_KEY' && !this.isValidAWSSecretKey(value)) {
                invalid.push(`${envVar}: Invalid AWS Secret Key format`);
            }
            
            if (envVar === 'JWT_SECRET' && value.length < 32) {
                invalid.push(`${envVar}: JWT secret must be at least 32 characters`);
            }
            
            if (envVar === 'ENCRYPTION_KEY' && value.length < 32) {
                invalid.push(`${envVar}: Encryption key must be at least 32 characters`);
            }

            this.credentials[envVar] = value;
        }

        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }

        if (invalid.length > 0) {
            throw new Error(`Invalid credentials: ${invalid.join(', ')}`);
        }
    }

    /**
     * Generate missing credentials with secure defaults
     */
    async generateMissingCredentials() {
        // Generate JWT secret if not provided
        if (!this.credentials.JWT_SECRET) {
            this.credentials.JWT_SECRET = crypto.randomBytes(64).toString('base64');
            console.log('🔑 Generated JWT secret');
        }

        // Generate encryption key if not provided
        if (!this.credentials.ENCRYPTION_KEY) {
            this.credentials.ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
            console.log('🔑 Generated encryption key');
        }

        // Set default values for optional variables
        this.credentials.NODE_ENV = process.env.NODE_ENV || 'development';
        this.credentials.PORT = process.env.PORT || 3000;
        this.credentials.LOG_LEVEL = process.env.LOG_LEVEL || 'info';
        this.credentials.BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    }

    /**
     * Test AWS credentials by attempting to list S3 buckets
     */
    async testAWSCredentials() {
        try {
            const AWS = require('aws-sdk');
            
            AWS.config.update({
                accessKeyId: this.credentials.AWS_ACCESS_KEY_ID,
                secretAccessKey: this.credentials.AWS_SECRET_ACCESS_KEY,
                region: this.credentials.AWS_REGION
            });

            const s3 = new AWS.S3();
            await s3.listBuckets().promise();
            
            console.log('✅ AWS credentials validated successfully');
            
            // Test S3 bucket access
            try {
                await s3.headBucket({ Bucket: this.credentials.AWS_S3_BUCKET }).promise();
                console.log(`✅ S3 bucket '${this.credentials.AWS_S3_BUCKET}' is accessible`);
            } catch (error) {
                if (error.statusCode === 404) {
                    console.log(`⚠️  S3 bucket '${this.credentials.AWS_S3_BUCKET}' does not exist, will be created on first use`);
                } else {
                    throw error;
                }
            }
            
        } catch (error) {
            throw new Error(`AWS credentials test failed: ${error.message}`);
        }
    }

    /**
     * Test database credentials
     */
    async testDatabaseCredentials() {
        try {
            // Test PostgreSQL connection
            const { Client } = require('pg');
            const client = new Client({
                connectionString: this.credentials.DATABASE_URL
            });
            
            await client.connect();
            await client.query('SELECT 1');
            await client.end();
            
            console.log('✅ PostgreSQL database connection validated');
            
            // Test Redis connection
            const Redis = require('ioredis');
            const redis = new Redis(this.credentials.REDIS_URL);
            
            await redis.ping();
            await redis.disconnect();
            
            console.log('✅ Redis cache connection validated');
            
        } catch (error) {
            throw new Error(`Database credentials test failed: ${error.message}`);
        }
    }

    /**
     * Validate AWS Access Key format
     * @param {string} accessKey - AWS Access Key to validate
     * @returns {boolean} True if valid format
     */
    isValidAWSAccessKey(accessKey) {
        return /^AKIA[0-9A-Z]{16}$/.test(accessKey);
    }

    /**
     * Validate AWS Secret Key format
     * @param {string} secretKey - AWS Secret Key to validate
     * @returns {boolean} True if valid format
     */
    isValidAWSSecretKey(secretKey) {
        return /^[A-Za-z0-9/+=]{40}$/.test(secretKey);
    }

    /**
     * Get validated credentials
     * @returns {Object} Credentials object
     */
    getCredentials() {
        if (!this.isValidated) {
            throw new Error('Credentials not validated. Call initialize() first.');
        }
        return { ...this.credentials };
    }

    /**
     * Get AWS configuration object
     * @returns {Object} AWS configuration
     */
    getAWSConfig() {
        return {
            accessKeyId: this.credentials.AWS_ACCESS_KEY_ID,
            secretAccessKey: this.credentials.AWS_SECRET_ACCESS_KEY,
            region: this.credentials.AWS_REGION
        };
    }

    /**
     * Get database configuration object
     * @returns {Object} Database configuration
     */
    getDatabaseConfig() {
        return {
            postgres: {
                url: this.credentials.DATABASE_URL,
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                database: process.env.DB_NAME || 'pharbit',
                username: process.env.DB_USER || 'pharbit_user',
                password: process.env.DB_PASSWORD
            },
            redis: {
                url: this.credentials.REDIS_URL,
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD
            },
            leveldb: {
                path: process.env.LEVELDB_PATH || './blockchain-data'
            }
        };
    }

    /**
     * Get security configuration object
     * @returns {Object} Security configuration
     */
    getSecurityConfig() {
        return {
            jwt: {
                secret: this.credentials.JWT_SECRET,
                expiresIn: process.env.JWT_EXPIRES_IN || '24h',
                refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
            },
            encryption: {
                key: this.credentials.ENCRYPTION_KEY,
                algorithm: 'aes-256-gcm'
            },
            bcrypt: {
                rounds: this.credentials.BCRYPT_ROUNDS
            },
            rateLimit: {
                windowMs: parseInt(process.env.API_RATE_WINDOW) || 900000,
                max: parseInt(process.env.API_RATE_LIMIT) || 100
            }
        };
    }

    /**
     * Get pharmaceutical compliance configuration
     * @returns {Object} Compliance configuration
     */
    getComplianceConfig() {
        return {
            mode: process.env.COMPLIANCE_MODE || 'FDA_21CFR11',
            auditRetentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS) || 2555,
            digitalSignatureRequired: process.env.DIGITAL_SIGNATURE_REQUIRED === 'true',
            dscsaEnabled: process.env.DSCSA_ENABLED === 'true',
            serializationFormat: process.env.SERIALIZATION_FORMAT || 'EPCIS',
            documentEncryption: process.env.DOCUMENT_ENCRYPTION === 'true',
            documentRetentionDays: parseInt(process.env.DOCUMENT_RETENTION_DAYS) || 2555,
            virusScanEnabled: process.env.VIRUS_SCAN_ENABLED === 'true'
        };
    }

    /**
     * Create a secure .env file with generated credentials
     * @param {string} filePath - Path to save .env file
     */
    async createEnvFile(filePath = '.env') {
        const envContent = Object.entries(this.credentials)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        fs.writeFileSync(filePath, envContent);
        console.log(`📄 Created .env file at ${filePath}`);
    }

    /**
     * Mask sensitive credentials for logging
     * @param {Object} credentials - Credentials object
     * @returns {Object} Masked credentials
     */
    maskCredentials(credentials) {
        const masked = { ...credentials };
        
        if (masked.AWS_ACCESS_KEY_ID) {
            masked.AWS_ACCESS_KEY_ID = masked.AWS_ACCESS_KEY_ID.substring(0, 8) + '...';
        }
        
        if (masked.AWS_SECRET_ACCESS_KEY) {
            masked.AWS_SECRET_ACCESS_KEY = '***';
        }
        
        if (masked.JWT_SECRET) {
            masked.JWT_SECRET = masked.JWT_SECRET.substring(0, 8) + '...';
        }
        
        if (masked.ENCRYPTION_KEY) {
            masked.ENCRYPTION_KEY = '***';
        }
        
        return masked;
    }
}

module.exports = CredentialManager;