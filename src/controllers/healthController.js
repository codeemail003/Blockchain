/**
 * @fileoverview Health Controller for PharbitChain
 * Handles system health monitoring and status checks
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Get system health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Health status retrieved successfully
 *       503:
 *         description: System unhealthy
 */
router.get('/health', async (req, res) => {
    try {
        const healthChecks = {
            timestamp: new Date().toISOString(),
            status: 'healthy',
            services: {},
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: '1.0.0',
            compliance: req.credentials?.COMPLIANCE_MODE || 'FDA_21CFR11'
        };

        // Check database health
        try {
            const dbHealth = await req.databaseService.healthCheck();
            healthChecks.services.database = dbHealth;
        } catch (error) {
            healthChecks.services.database = {
                status: 'unhealthy',
                error: error.message
            };
            healthChecks.status = 'unhealthy';
        }

        // Check blockchain health
        try {
            const blockchainStats = req.blockchain.getStats();
            const isValid = req.blockchain.validateChain();
            healthChecks.services.blockchain = {
                status: isValid ? 'healthy' : 'unhealthy',
                chainLength: blockchainStats.chainLength,
                pendingTransactions: blockchainStats.pendingTransactions,
                isMining: blockchainStats.isMining,
                isValid
            };
            
            if (!isValid) {
                healthChecks.status = 'unhealthy';
            }
        } catch (error) {
            healthChecks.services.blockchain = {
                status: 'unhealthy',
                error: error.message
            };
            healthChecks.status = 'unhealthy';
        }

        // Check S3 health
        try {
            const s3Stats = await req.s3Service.getStorageStats();
            healthChecks.services.s3 = {
                status: 'healthy',
                bucketName: s3Stats.bucketName,
                region: s3Stats.region,
                totalDocuments: s3Stats.totalDocuments,
                totalSize: s3Stats.totalSizeFormatted
            };
        } catch (error) {
            healthChecks.services.s3 = {
                status: 'unhealthy',
                error: error.message
            };
            healthChecks.status = 'unhealthy';
        }

        // Check Redis health
        try {
            await req.databaseService.getRedis().ping();
            healthChecks.services.redis = {
                status: 'healthy'
            };
        } catch (error) {
            healthChecks.services.redis = {
                status: 'unhealthy',
                error: error.message
            };
            healthChecks.status = 'unhealthy';
        }

        // Check LevelDB health
        try {
            await req.databaseService.getLevelDB().get('health-check').catch(() => {});
            healthChecks.services.leveldb = {
                status: 'healthy'
            };
        } catch (error) {
            healthChecks.services.leveldb = {
                status: 'unhealthy',
                error: error.message
            };
            healthChecks.status = 'unhealthy';
        }

        const statusCode = healthChecks.status === 'healthy' ? 200 : 503;
        
        logger.info('Health check completed', {
            status: healthChecks.status,
            services: Object.keys(healthChecks.services).length
        });

        res.status(statusCode).json(healthChecks);

    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({
            timestamp: new Date().toISOString(),
            status: 'unhealthy',
            error: 'Health check failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/health/detailed:
 *   get:
 *     summary: Get detailed system health status
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Detailed health status retrieved successfully
 */
router.get('/detailed', req.authService.authenticate, async (req, res) => {
    try {
        const detailedHealth = {
            timestamp: new Date().toISOString(),
            status: 'healthy',
            system: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                platform: process.platform,
                nodeVersion: process.version,
                pid: process.pid
            },
            services: {},
            blockchain: {},
            compliance: {},
            performance: {}
        };

        // Database detailed health
        try {
            const dbHealth = await req.databaseService.healthCheck();
            detailedHealth.services.database = dbHealth;
            
            // Get database statistics
            const userCount = await req.databaseService.getModel('User').count();
            const batchCount = await req.databaseService.getModel('Batch').count();
            const documentCount = await req.databaseService.getModel('Document').count();
            const auditCount = await req.databaseService.getModel('AuditTrail').count();
            
            detailedHealth.services.database.statistics = {
                users: userCount,
                batches: batchCount,
                documents: documentCount,
                auditEntries: auditCount
            };
        } catch (error) {
            detailedHealth.services.database = {
                status: 'unhealthy',
                error: error.message
            };
            detailedHealth.status = 'unhealthy';
        }

        // Blockchain detailed health
        try {
            const blockchainStats = req.blockchain.getStats();
            const isValid = req.blockchain.validateChain();
            
            detailedHealth.blockchain = {
                status: isValid ? 'healthy' : 'unhealthy',
                ...blockchainStats,
                isValid,
                latestBlock: req.blockchain.getLatestBlock()
            };
            
            if (!isValid) {
                detailedHealth.status = 'unhealthy';
            }
        } catch (error) {
            detailedHealth.blockchain = {
                status: 'unhealthy',
                error: error.message
            };
            detailedHealth.status = 'unhealthy';
        }

        // S3 detailed health
        try {
            const s3Stats = await req.s3Service.getStorageStats();
            detailedHealth.services.s3 = {
                status: 'healthy',
                ...s3Stats
            };
        } catch (error) {
            detailedHealth.services.s3 = {
                status: 'unhealthy',
                error: error.message
            };
            detailedHealth.status = 'unhealthy';
        }

        // Compliance health
        try {
            const retentionCheck = await req.complianceService.checkDataRetentionCompliance(req.databaseService);
            detailedHealth.compliance = {
                status: retentionCheck.compliant ? 'healthy' : 'warning',
                retentionCheck,
                mode: req.credentials.COMPLIANCE_MODE || 'FDA_21CFR11',
                digitalSignatureRequired: req.credentials.DIGITAL_SIGNATURE_REQUIRED === 'true',
                dscsaEnabled: req.credentials.DSCSA_ENABLED === 'true'
            };
        } catch (error) {
            detailedHealth.compliance = {
                status: 'unhealthy',
                error: error.message
            };
            detailedHealth.status = 'unhealthy';
        }

        // Performance metrics
        try {
            const startTime = Date.now();
            
            // Test database query performance
            const dbStartTime = Date.now();
            await req.databaseService.getModel('User').findOne();
            const dbQueryTime = Date.now() - dbStartTime;
            
            // Test Redis performance
            const redisStartTime = Date.now();
            await req.databaseService.getRedis().ping();
            const redisQueryTime = Date.now() - redisStartTime;
            
            // Test blockchain performance
            const blockchainStartTime = Date.now();
            req.blockchain.getStats();
            const blockchainQueryTime = Date.now() - blockchainStartTime;
            
            detailedHealth.performance = {
                responseTime: Date.now() - startTime,
                databaseQueryTime: dbQueryTime,
                redisQueryTime: redisQueryTime,
                blockchainQueryTime: blockchainQueryTime
            };
        } catch (error) {
            detailedHealth.performance = {
                error: error.message
            };
        }

        const statusCode = detailedHealth.status === 'healthy' ? 200 : 503;
        
        logger.info('Detailed health check completed', {
            status: detailedHealth.status,
            responseTime: detailedHealth.performance?.responseTime
        });

        res.status(statusCode).json(detailedHealth);

    } catch (error) {
        logger.error('Detailed health check failed:', error);
        res.status(503).json({
            timestamp: new Date().toISOString(),
            status: 'unhealthy',
            error: 'Detailed health check failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/health/ready:
 *   get:
 *     summary: Check if system is ready to accept requests
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System is ready
 *       503:
 *         description: System is not ready
 */
router.get('/ready', async (req, res) => {
    try {
        // Quick readiness checks
        const checks = {
            database: false,
            redis: false,
            blockchain: false
        };

        // Check database
        try {
            await req.databaseService.getSequelize().authenticate();
            checks.database = true;
        } catch (error) {
            logger.debug('Database readiness check failed:', error.message);
        }

        // Check Redis
        try {
            await req.databaseService.getRedis().ping();
            checks.redis = true;
        } catch (error) {
            logger.debug('Redis readiness check failed:', error.message);
        }

        // Check blockchain
        try {
            req.blockchain.getStats();
            checks.blockchain = true;
        } catch (error) {
            logger.debug('Blockchain readiness check failed:', error.message);
        }

        const isReady = Object.values(checks).every(check => check === true);
        const statusCode = isReady ? 200 : 503;

        res.status(statusCode).json({
            timestamp: new Date().toISOString(),
            ready: isReady,
            checks
        });

    } catch (error) {
        logger.error('Readiness check failed:', error);
        res.status(503).json({
            timestamp: new Date().toISOString(),
            ready: false,
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/health/live:
 *   get:
 *     summary: Check if system is alive (liveness probe)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System is alive
 */
router.get('/live', (req, res) => {
    res.json({
        timestamp: new Date().toISOString(),
        alive: true,
        uptime: process.uptime()
    });
});

module.exports = router;