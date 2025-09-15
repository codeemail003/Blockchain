/**
 * @fileoverview Multi-layer Database Service for PharbitChain
 * Handles PostgreSQL, Redis, and LevelDB integration
 */

const { Sequelize, DataTypes } = require('sequelize');
const Redis = require('ioredis');
const level = require('level');
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

class DatabaseService {
    constructor(credentials) {
        this.credentials = credentials;
        this.sequelize = null;
        this.redis = null;
        this.leveldb = null;
        this.supabase = null;
        this.models = {};
    }

    /**
     * Initialize all database connections
     */
    async initialize() {
        try {
            // Initialize Supabase
            await this.initializeSupabase();
            
            // Initialize PostgreSQL (using Supabase)
            await this.initializePostgreSQL();
            
            // Initialize Redis
            await this.initializeRedis();
            
            // Initialize LevelDB
            await this.initializeLevelDB();
            
            // Define models
            this.defineModels();
            
            // Sync database
            await this.syncDatabase();
            
            logger.info('✅ All database connections initialized');
            
        } catch (error) {
            logger.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    /**
     * Initialize Supabase client
     */
    async initializeSupabase() {
        try {
            this.supabase = createClient(
                this.credentials.SUPABASE_URL,
                this.credentials.SUPABASE_ANON_KEY
            );

            // Test connection
            const { data, error } = await this.supabase
                .from('pg_tables')
                .select('*')
                .limit(1);

            if (error) {
                logger.warn('Supabase connection test failed, but continuing:', error.message);
            } else {
                logger.info('✅ Supabase connection established');
            }
            
        } catch (error) {
            logger.error('❌ Supabase connection failed:', error);
            throw error;
        }
    }

    /**
     * Initialize PostgreSQL connection
     */
    async initializePostgreSQL() {
        try {
            this.sequelize = new Sequelize(this.credentials.DATABASE_URL, {
                dialect: 'postgres',
                logging: (msg) => logger.debug(msg),
                pool: {
                    max: 10,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                },
                define: {
                    timestamps: true,
                    underscored: true,
                    paranoid: true // Soft deletes
                }
            });

            await this.sequelize.authenticate();
            logger.info('✅ PostgreSQL connection established');
            
        } catch (error) {
            logger.error('❌ PostgreSQL connection failed:', error);
            throw error;
        }
    }

    /**
     * Initialize Redis connection
     */
    async initializeRedis() {
        try {
            this.redis = new Redis(this.credentials.REDIS_URL, {
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: 3,
                lazyConnect: true
            });

            this.redis.on('connect', () => {
                logger.info('✅ Redis connection established');
            });

            this.redis.on('error', (error) => {
                logger.error('❌ Redis connection error:', error);
            });

            await this.redis.connect();
            
        } catch (error) {
            logger.error('❌ Redis connection failed:', error);
            throw error;
        }
    }

    /**
     * Initialize LevelDB connection
     */
    async initializeLevelDB() {
        try {
            this.leveldb = level(this.credentials.LEVELDB_PATH || './blockchain-data', {
                valueEncoding: 'json'
            });
            
            logger.info('✅ LevelDB connection established');
            
        } catch (error) {
            logger.error('❌ LevelDB connection failed:', error);
            throw error;
        }
    }

    /**
     * Define Sequelize models
     */
    defineModels() {
        // User model
        this.models.User = this.sequelize.define('User', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    isEmail: true
                }
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false
            },
            firstName: {
                type: DataTypes.STRING,
                allowNull: false
            },
            lastName: {
                type: DataTypes.STRING,
                allowNull: false
            },
            role: {
                type: DataTypes.ENUM('admin', 'manufacturer', 'distributor', 'pharmacy', 'regulator', 'auditor'),
                allowNull: false,
                defaultValue: 'manufacturer'
            },
            organization: {
                type: DataTypes.STRING,
                allowNull: false
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },
            lastLogin: {
                type: DataTypes.DATE
            },
            complianceData: {
                type: DataTypes.JSONB,
                defaultValue: {}
            }
        });

        // Batch model
        this.models.Batch = this.sequelize.define('Batch', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            batchId: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
            },
            productCode: {
                type: DataTypes.STRING,
                allowNull: false
            },
            productName: {
                type: DataTypes.STRING,
                allowNull: false
            },
            manufacturer: {
                type: DataTypes.STRING,
                allowNull: false
            },
            quantity: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            status: {
                type: DataTypes.ENUM('created', 'in_production', 'quality_control', 'approved', 'shipped', 'delivered', 'recalled'),
                defaultValue: 'created'
            },
            productionDate: {
                type: DataTypes.DATE,
                allowNull: false
            },
            expiryDate: {
                type: DataTypes.DATE,
                allowNull: false
            },
            currentLocation: {
                type: DataTypes.STRING,
                allowNull: false
            },
            currentOwner: {
                type: DataTypes.STRING,
                allowNull: false
            },
            serializationData: {
                type: DataTypes.JSONB,
                defaultValue: {}
            },
            complianceData: {
                type: DataTypes.JSONB,
                defaultValue: {}
            },
            blockchainHash: {
                type: DataTypes.STRING,
                unique: true
            }
        });

        // Document model
        this.models.Document = this.sequelize.define('Document', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            fileId: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
            },
            fileName: {
                type: DataTypes.STRING,
                allowNull: false
            },
            originalName: {
                type: DataTypes.STRING,
                allowNull: false
            },
            fileSize: {
                type: DataTypes.BIGINT,
                allowNull: false
            },
            mimeType: {
                type: DataTypes.STRING,
                allowNull: false
            },
            fileHash: {
                type: DataTypes.STRING,
                allowNull: false
            },
            s3Key: {
                type: DataTypes.STRING,
                allowNull: false
            },
            s3Url: {
                type: DataTypes.STRING,
                allowNull: false
            },
            documentType: {
                type: DataTypes.ENUM('certificate', 'batch_document', 'regulatory', 'lab_report', 'compliance', 'other'),
                allowNull: false
            },
            batchId: {
                type: DataTypes.STRING,
                allowNull: true
            },
            uploadedBy: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            isApproved: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            approvedBy: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            approvedAt: {
                type: DataTypes.DATE,
                allowNull: true
            },
            digitalSignature: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            metadata: {
                type: DataTypes.JSONB,
                defaultValue: {}
            }
        });

        // Audit Trail model
        this.models.AuditTrail = this.sequelize.define('AuditTrail', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            action: {
                type: DataTypes.STRING,
                allowNull: false
            },
            entityType: {
                type: DataTypes.STRING,
                allowNull: false
            },
            entityId: {
                type: DataTypes.STRING,
                allowNull: false
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            oldValues: {
                type: DataTypes.JSONB,
                allowNull: true
            },
            newValues: {
                type: DataTypes.JSONB,
                allowNull: true
            },
            ipAddress: {
                type: DataTypes.STRING,
                allowNull: true
            },
            userAgent: {
                type: DataTypes.STRING,
                allowNull: true
            },
            complianceData: {
                type: DataTypes.JSONB,
                defaultValue: {}
            }
        });

        // Compliance Violation model
        this.models.ComplianceViolation = this.sequelize.define('ComplianceViolation', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            violationType: {
                type: DataTypes.ENUM('FDA_21CFR11', 'DSCSA', 'GDPR', 'ISO27001', 'CUSTOM'),
                allowNull: false
            },
            severity: {
                type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
                allowNull: false
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            entityType: {
                type: DataTypes.STRING,
                allowNull: false
            },
            entityId: {
                type: DataTypes.STRING,
                allowNull: false
            },
            detectedBy: {
                type: DataTypes.STRING,
                allowNull: false
            },
            status: {
                type: DataTypes.ENUM('open', 'investigating', 'resolved', 'false_positive'),
                defaultValue: 'open'
            },
            resolution: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            resolvedBy: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            resolvedAt: {
                type: DataTypes.DATE,
                allowNull: true
            },
            metadata: {
                type: DataTypes.JSONB,
                defaultValue: {}
            }
        });

        // Define associations
        this.defineAssociations();
    }

    /**
     * Define model associations
     */
    defineAssociations() {
        // User associations
        this.models.User.hasMany(this.models.Document, { foreignKey: 'uploadedBy', as: 'uploadedDocuments' });
        this.models.User.hasMany(this.models.Document, { foreignKey: 'approvedBy', as: 'approvedDocuments' });
        this.models.User.hasMany(this.models.AuditTrail, { foreignKey: 'userId', as: 'auditTrails' });
        this.models.User.hasMany(this.models.ComplianceViolation, { foreignKey: 'resolvedBy', as: 'resolvedViolations' });

        // Document associations
        this.models.Document.belongsTo(this.models.User, { foreignKey: 'uploadedBy', as: 'uploader' });
        this.models.Document.belongsTo(this.models.User, { foreignKey: 'approvedBy', as: 'approver' });

        // Audit Trail associations
        this.models.AuditTrail.belongsTo(this.models.User, { foreignKey: 'userId', as: 'user' });

        // Compliance Violation associations
        this.models.ComplianceViolation.belongsTo(this.models.User, { foreignKey: 'resolvedBy', as: 'resolver' });
    }

    /**
     * Sync database with models
     */
    async syncDatabase() {
        try {
            if (process.env.NODE_ENV === 'development') {
                await this.sequelize.sync({ alter: true });
                logger.info('✅ Database synced (development mode)');
            } else {
                await this.sequelize.sync();
                logger.info('✅ Database synced (production mode)');
            }
        } catch (error) {
            logger.error('❌ Database sync failed:', error);
            throw error;
        }
    }

    /**
     * Get Sequelize instance
     */
    getSequelize() {
        return this.sequelize;
    }

    /**
     * Get Redis instance
     */
    getRedis() {
        return this.redis;
    }

    /**
     * Get LevelDB instance
     */
    getLevelDB() {
        return this.leveldb;
    }

    /**
     * Get Supabase client
     */
    getSupabase() {
        return this.supabase;
    }

    /**
     * Get model by name
     */
    getModel(name) {
        return this.models[name];
    }

    /**
     * Cache operations
     */
    async cacheSet(key, value, ttl = 3600) {
        try {
            await this.redis.setex(key, ttl, JSON.stringify(value));
            logger.debug(`Cached: ${key}`);
        } catch (error) {
            logger.error('Cache set error:', error);
        }
    }

    async cacheGet(key) {
        try {
            const value = await this.redis.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error('Cache get error:', error);
            return null;
        }
    }

    async cacheDel(key) {
        try {
            await this.redis.del(key);
            logger.debug(`Cache deleted: ${key}`);
        } catch (error) {
            logger.error('Cache delete error:', error);
        }
    }

    /**
     * Transaction operations
     */
    async transaction(callback) {
        const t = await this.sequelize.transaction();
        try {
            const result = await callback(t);
            await t.commit();
            return result;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            // Check Supabase
            const { data: supabaseData, error: supabaseError } = await this.supabase
                .from('pg_tables')
                .select('*')
                .limit(1);
            
            // Check PostgreSQL
            await this.sequelize.authenticate();
            
            // Check Redis
            await this.redis.ping();
            
            // Check LevelDB
            await this.leveldb.get('health-check').catch(() => {});
            
            return {
                status: 'healthy',
                databases: {
                    supabase: supabaseError ? 'error' : 'connected',
                    postgresql: 'connected',
                    redis: 'connected',
                    leveldb: 'connected'
                },
                supabaseError: supabaseError?.message,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Database health check failed:', error);
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Close all database connections
     */
    async close() {
        try {
            if (this.sequelize) {
                await this.sequelize.close();
                logger.info('✅ PostgreSQL connection closed');
            }
            
            if (this.redis) {
                await this.redis.disconnect();
                logger.info('✅ Redis connection closed');
            }
            
            if (this.leveldb) {
                await this.leveldb.close();
                logger.info('✅ LevelDB connection closed');
            }
            
        } catch (error) {
            logger.error('Error closing database connections:', error);
        }
    }
}

module.exports = DatabaseService;