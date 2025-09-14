/**
 * @fileoverview Winston Logger Configuration for PharbitChain
 * Comprehensive logging with file rotation and compliance features
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}] ${message}`;
        
        if (stack) {
            log += `\n${stack}`;
        }
        
        if (Object.keys(meta).length > 0) {
            log += `\n${JSON.stringify(meta, null, 2)}`;
        }
        
        return log;
    })
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        let log = `${timestamp} ${level}: ${message}`;
        if (stack) {
            log += `\n${stack}`;
        }
        return log;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: {
        service: 'pharbit-blockchain',
        version: '1.0.0',
        compliance: process.env.COMPLIANCE_MODE || 'FDA_21CFR11'
    },
    transports: [
        // Console transport for development
        new winston.transports.Console({
            format: consoleFormat,
            silent: process.env.NODE_ENV === 'test'
        }),

        // Combined log file
        new DailyRotateFile({
            filename: path.join(logsDir, 'pharbit-combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: process.env.LOG_MAX_SIZE || '20m',
            maxFiles: process.env.LOG_MAX_FILES || '14d',
            format: logFormat
        }),

        // Error log file
        new DailyRotateFile({
            filename: path.join(logsDir, 'pharbit-error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: process.env.LOG_MAX_SIZE || '20m',
            maxFiles: process.env.LOG_MAX_FILES || '30d',
            format: logFormat
        }),

        // Audit log file for compliance
        new DailyRotateFile({
            filename: path.join(logsDir, 'pharbit-audit-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'audit',
            maxSize: process.env.LOG_MAX_SIZE || '50m',
            maxFiles: process.env.AUDIT_RETENTION_DAYS || '2555d',
            format: logFormat
        }),

        // Security log file
        new DailyRotateFile({
            filename: path.join(logsDir, 'pharbit-security-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'security',
            maxSize: process.env.LOG_MAX_SIZE || '20m',
            maxFiles: process.env.LOG_MAX_FILES || '90d',
            format: logFormat
        })
    ],

    // Handle exceptions and rejections
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
            format: logFormat
        })
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log'),
            format: logFormat
        })
    ]
});

// Add custom log levels for pharmaceutical compliance
logger.addColors({
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
    audit: 'cyan',
    security: 'red',
    compliance: 'blue',
    transaction: 'green',
    blockchain: 'blue',
    document: 'yellow',
    batch: 'cyan'
});

// Add custom methods for pharmaceutical logging
logger.audit = (message, meta = {}) => {
    logger.log('audit', message, {
        ...meta,
        type: 'audit',
        timestamp: new Date().toISOString(),
        compliance: process.env.COMPLIANCE_MODE || 'FDA_21CFR11'
    });
};

logger.security = (message, meta = {}) => {
    logger.log('security', message, {
        ...meta,
        type: 'security',
        timestamp: new Date().toISOString(),
        severity: meta.severity || 'medium'
    });
};

logger.compliance = (message, meta = {}) => {
    logger.log('compliance', message, {
        ...meta,
        type: 'compliance',
        timestamp: new Date().toISOString(),
        mode: process.env.COMPLIANCE_MODE || 'FDA_21CFR11'
    });
};

logger.transaction = (message, meta = {}) => {
    logger.log('transaction', message, {
        ...meta,
        type: 'transaction',
        timestamp: new Date().toISOString()
    });
};

logger.blockchain = (message, meta = {}) => {
    logger.log('blockchain', message, {
        ...meta,
        type: 'blockchain',
        timestamp: new Date().toISOString()
    });
};

logger.document = (message, meta = {}) => {
    logger.log('document', message, {
        ...meta,
        type: 'document',
        timestamp: new Date().toISOString()
    });
};

logger.batch = (message, meta = {}) => {
    logger.log('batch', message, {
        ...meta,
        type: 'batch',
        timestamp: new Date().toISOString()
    });
};

// Pharmaceutical compliance logging methods
logger.logUserAction = (userId, action, details = {}) => {
    logger.audit(`User Action: ${action}`, {
        userId,
        action,
        details,
        compliance: 'FDA_21CFR11',
        digitalSignature: details.signature || null
    });
};

logger.logDocumentAccess = (documentId, userId, action, details = {}) => {
    logger.audit(`Document Access: ${action}`, {
        documentId,
        userId,
        action,
        details,
        compliance: 'FDA_21CFR11',
        accessTimestamp: new Date().toISOString()
    });
};

logger.logBatchOperation = (batchId, operation, details = {}) => {
    logger.batch(`Batch Operation: ${operation}`, {
        batchId,
        operation,
        details,
        compliance: 'DSCSA',
        timestamp: new Date().toISOString()
    });
};

logger.logComplianceViolation = (violation, details = {}) => {
    logger.compliance(`Compliance Violation: ${violation}`, {
        violation,
        details,
        severity: 'high',
        timestamp: new Date().toISOString(),
        actionRequired: true
    });
};

logger.logSecurityEvent = (event, details = {}) => {
    logger.security(`Security Event: ${event}`, {
        event,
        details,
        timestamp: new Date().toISOString(),
        severity: details.severity || 'medium'
    });
};

logger.logTransaction = (transaction, details = {}) => {
    logger.transaction(`Transaction: ${transaction.type}`, {
        transactionId: transaction.hash,
        type: transaction.type,
        from: transaction.from,
        to: transaction.to,
        amount: transaction.amount,
        details,
        timestamp: new Date().toISOString()
    });
};

logger.logBlockMining = (block, details = {}) => {
    logger.blockchain(`Block Mined: ${block.hash}`, {
        blockIndex: block.index,
        blockHash: block.hash,
        transactionCount: block.transactions.length,
        difficulty: block.difficulty,
        nonce: block.nonce,
        blockTime: block.blockTime,
        details,
        timestamp: new Date().toISOString()
    });
};

// Performance monitoring
logger.logPerformance = (operation, duration, details = {}) => {
    logger.info(`Performance: ${operation}`, {
        operation,
        duration,
        durationMs: duration,
        details,
        timestamp: new Date().toISOString()
    });
};

// Error logging with context
logger.logError = (error, context = {}) => {
    logger.error(`Error: ${error.message}`, {
        error: {
            message: error.message,
            stack: error.stack,
            name: error.name
        },
        context,
        timestamp: new Date().toISOString()
    });
};

// Database operation logging
logger.logDatabaseOperation = (operation, table, details = {}) => {
    logger.debug(`Database Operation: ${operation}`, {
        operation,
        table,
        details,
        timestamp: new Date().toISOString()
    });
};

// API request logging
logger.logApiRequest = (req, res, duration) => {
    const logData = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id || null,
        timestamp: new Date().toISOString()
    };

    if (res.statusCode >= 400) {
        logger.warn(`API Request: ${req.method} ${req.originalUrl}`, logData);
    } else {
        logger.http(`API Request: ${req.method} ${req.originalUrl}`, logData);
    }
};

// Export logger instance
module.exports = logger;