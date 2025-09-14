const path = require('path');
const fs = require('fs');
const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const logsDir = path.resolve(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const isProd = (process.env.NODE_ENV || 'development') === 'production';

const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: isProd
        ? format.combine(format.timestamp(), format.json())
        : format.combine(format.colorize(), format.timestamp(), format.printf(({ level, message, timestamp, ...meta }) => `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`)),
    transports: [
        new transports.Console({ handleExceptions: true }),
        new DailyRotateFile({
            dirname: logsDir,
            filename: 'pharbitchain-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: process.env.LOG_MAX_SIZE || '10m',
            maxFiles: process.env.LOG_MAX_FILES || '14d'
        })
    ],
    exitOnError: false
});

module.exports = logger;

