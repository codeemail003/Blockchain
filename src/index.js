/**
 * @fileoverview Main Application Entry Point for PharbitChain
 * Production-ready pharmaceutical blockchain with AWS integration
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('express-async-errors');

// Import services and utilities
const CredentialManager = require('./config/credentials');
const Blockchain = require('./blockchain/Blockchain');
const S3Service = require('./services/s3Service');
const logger = require('./utils/logger');
const DatabaseService = require('./services/databaseService');
const SupabaseService = require('./services/supabaseService');
const AuthService = require('./services/authService');
const ComplianceService = require('./services/complianceService');

// Import controllers
const AuthController = require('./controllers/authController');
const BlockchainController = require('./controllers/blockchainController');
const DocumentController = require('./controllers/documentController');
const BatchController = require('./controllers/batchController');
const ComplianceController = require('./controllers/complianceController');
const HealthController = require('./controllers/healthController');

class PharbitChainApp {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.credentials = null;
        this.blockchain = null;
        this.s3Service = null;
        this.databaseService = null;
        this.supabaseService = null;
        this.authService = null;
        this.complianceService = null;
        
        this.initialize();
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            logger.info('🚀 Initializing PharbitChain Application...');
            
            // Initialize credential management
            await this.initializeCredentials();
            
            // Initialize services
            await this.initializeServices();
            
            // Setup middleware
            this.setupMiddleware();
            
            // Setup routes
            this.setupRoutes();
            
            // Setup error handling
            this.setupErrorHandling();
            
            // Start the server
            await this.startServer();
            
            logger.info('✅ PharbitChain Application initialized successfully');
            
        } catch (error) {
            logger.error('❌ Application initialization failed:', error);
            process.exit(1);
        }
    }

    /**
     * Initialize credential management
     */
    async initializeCredentials() {
        try {
            const credentialManager = new CredentialManager();
            this.credentials = await credentialManager.initialize();
            logger.info('✅ Credentials initialized');
        } catch (error) {
            logger.error('❌ Credential initialization failed:', error);
            throw error;
        }
    }

    /**
     * Initialize all services
     */
    async initializeServices() {
        try {
            // Initialize blockchain
            this.blockchain = new Blockchain({
                difficulty: parseInt(process.env.BLOCKCHAIN_DIFFICULTY) || 4,
                miningReward: parseInt(process.env.BLOCKCHAIN_MINING_REWARD) || 50,
                blockTime: parseInt(process.env.BLOCKCHAIN_BLOCK_TIME) || 60000,
                complianceMode: this.credentials.COMPLIANCE_MODE,
                auditRetentionDays: parseInt(this.credentials.AUDIT_RETENTION_DAYS) || 2555,
                digitalSignatureRequired: this.credentials.DIGITAL_SIGNATURE_REQUIRED === 'true'
            });

            // Load existing blockchain data
            await this.blockchain.loadFromDatabase();
            logger.info('✅ Blockchain initialized');

            // Initialize S3 service
            this.s3Service = new S3Service(this.credentials);
            logger.info('✅ S3 service initialized');

            // Initialize database service
            this.databaseService = new DatabaseService(this.credentials);
            await this.databaseService.initialize();
            logger.info('✅ Database service initialized');

            // Initialize Supabase service
            this.supabaseService = new SupabaseService(this.credentials);
            await this.supabaseService.initialize();
            logger.info('✅ Supabase service initialized');

            // Initialize auth service
            this.authService = new AuthService(this.credentials);
            logger.info('✅ Auth service initialized');

            // Initialize compliance service
            this.complianceService = new ComplianceService(this.credentials);
            logger.info('✅ Compliance service initialized');

        } catch (error) {
            logger.error('❌ Service initialization failed:', error);
            throw error;
        }
    }

    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
            crossOriginEmbedderPolicy: false
        }));

        // CORS configuration
        this.app.use(cors({
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: parseInt(process.env.API_RATE_WINDOW) || 15 * 60 * 1000, // 15 minutes
            max: parseInt(process.env.API_RATE_LIMIT) || 100, // limit each IP to 100 requests per windowMs
            message: {
                error: 'Too many requests from this IP, please try again later.',
                retryAfter: Math.ceil((parseInt(process.env.API_RATE_WINDOW) || 15 * 60 * 1000) / 1000)
            },
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use('/api/', limiter);

        // Compression
        this.app.use(compression());

        // Logging
        this.app.use(morgan('combined', {
            stream: {
                write: (message) => logger.info(message.trim())
            }
        }));

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request validation
        this.app.use((req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors.array()
                });
            }
            next();
        });

        // Add services to request object
        this.app.use((req, res, next) => {
            req.blockchain = this.blockchain;
            req.s3Service = this.s3Service;
            req.databaseService = this.databaseService;
            req.supabaseService = this.supabaseService;
            req.authService = this.authService;
            req.complianceService = this.complianceService;
            req.credentials = this.credentials;
            next();
        });
    }

    /**
     * Setup API routes
     */
    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', HealthController.healthCheck);
        this.app.get('/api/health', HealthController.healthCheck);

        // API documentation
        this.setupSwagger();

        // Authentication routes
        this.app.use('/api/auth', AuthController);

        // Blockchain routes
        this.app.use('/api/blockchain', BlockchainController);

        // Document management routes
        this.app.use('/api/documents', DocumentController);

        // Batch management routes
        this.app.use('/api/batches', BatchController);

        // Compliance routes
        this.app.use('/api/compliance', ComplianceController);

        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                name: 'PharbitChain',
                version: '1.0.0',
                description: 'Pharmaceutical Supply Chain Blockchain',
                status: 'operational',
                compliance: this.credentials.COMPLIANCE_MODE,
                endpoints: {
                    health: '/api/health',
                    blockchain: '/api/blockchain',
                    documents: '/api/documents',
                    batches: '/api/batches',
                    compliance: '/api/compliance',
                    docs: '/api-docs'
                }
            });
        });

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                message: `The requested endpoint ${req.originalUrl} does not exist`,
                availableEndpoints: [
                    'GET /health',
                    'GET /api/health',
                    'POST /api/auth/login',
                    'POST /api/auth/register',
                    'GET /api/blockchain/status',
                    'POST /api/blockchain/transaction',
                    'GET /api/documents',
                    'POST /api/documents/upload',
                    'GET /api/batches',
                    'POST /api/batches/create',
                    'GET /api/compliance/audit-trail',
                    'GET /api-docs'
                ]
            });
        });
    }

    /**
     * Setup Swagger documentation
     */
    setupSwagger() {
        const swaggerOptions = {
            definition: {
                openapi: '3.0.0',
                info: {
                    title: 'PharbitChain API',
                    version: '1.0.0',
                    description: 'Pharmaceutical Supply Chain Blockchain API',
                    contact: {
                        name: 'PharbitChain Team',
                        email: 'support@pharbit.com'
                    }
                },
                servers: [
                    {
                        url: process.env.API_BASE_URL || 'http://localhost:3000',
                        description: 'Development server'
                    }
                ],
                components: {
                    securitySchemes: {
                        bearerAuth: {
                            type: 'http',
                            scheme: 'bearer',
                            bearerFormat: 'JWT'
                        }
                    }
                },
                security: [
                    {
                        bearerAuth: []
                    }
                ]
            },
            apis: ['./src/controllers/*.js']
        };

        const specs = swaggerJsdoc(swaggerOptions);
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
            explorer: true,
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'PharbitChain API Documentation'
        }));
    }

    /**
     * Setup error handling
     */
    setupErrorHandling() {
        // Global error handler
        this.app.use((error, req, res, next) => {
            logger.error('Unhandled error:', error);

            // Don't leak error details in production
            const isDevelopment = process.env.NODE_ENV === 'development';
            
            res.status(error.status || 500).json({
                error: 'Internal server error',
                message: isDevelopment ? error.message : 'Something went wrong',
                ...(isDevelopment && { stack: error.stack })
            });
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            process.exit(1);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            logger.info('SIGTERM received, shutting down gracefully');
            this.shutdown();
        });

        process.on('SIGINT', () => {
            logger.info('SIGINT received, shutting down gracefully');
            this.shutdown();
        });
    }

    /**
     * Start the server
     */
    async startServer() {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.port, () => {
                logger.info(`🚀 PharbitChain server running on port ${this.port}`);
                logger.info(`📚 API Documentation: http://localhost:${this.port}/api-docs`);
                logger.info(`🏥 Health Check: http://localhost:${this.port}/health`);
                logger.info(`🔗 API Base URL: http://localhost:${this.port}/api`);
                
                // Start blockchain mining if configured
                if (process.env.AUTO_MINING === 'true') {
                    this.blockchain.startMining(process.env.MINING_ADDRESS || 'system');
                    logger.info('⛏️  Automatic mining started');
                }
                
                resolve();
            });

            this.server.on('error', (error) => {
                logger.error('Server startup failed:', error);
                reject(error);
            });
        });
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        try {
            logger.info('🛑 Shutting down PharbitChain...');
            
            // Stop blockchain mining
            if (this.blockchain) {
                this.blockchain.stopMining();
            }
            
            // Close database connections
            if (this.databaseService) {
                await this.databaseService.close();
            }
            
            // Close server
            if (this.server) {
                this.server.close(() => {
                    logger.info('✅ Server closed successfully');
                    process.exit(0);
                });
            }
            
        } catch (error) {
            logger.error('❌ Error during shutdown:', error);
            process.exit(1);
        }
    }
}

// Start the application
if (require.main === module) {
    const app = new PharbitChainApp();
}

module.exports = PharbitChainApp;