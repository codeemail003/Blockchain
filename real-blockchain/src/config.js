const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load base .env first (optional)
const rootDir = path.resolve(__dirname, '..');
const baseEnvPath = path.join(rootDir, '.env');
if (fs.existsSync(baseEnvPath)) {
    dotenv.config({ path: baseEnvPath });
}

// Load environment-specific .env.{environment}
const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = `.env.${nodeEnv}`;
const envPath = path.join(rootDir, envFile);
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

// Helper to read numbers/booleans safely
const toInt = (v, def) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : def;
};
const toFloat = (v, def) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : def;
};
const toBool = (v, def) => {
    if (v === 'true') return true;
    if (v === 'false') return false;
    return def;
};

const config = {
    env: nodeEnv,
    // Server
    PORT: toInt(process.env.PORT, 3000),
    CORS_ORIGINS: process.env.CORS_ORIGINS || '*',
    JSON_BODY_LIMIT: process.env.JSON_BODY_LIMIT || '1mb',
    RATE_WINDOW_MS: toInt(process.env.RATE_WINDOW_MS, 60000),
    RATE_MAX: toInt(process.env.RATE_MAX, 120),
    HTTPS_ENABLED: toBool(process.env.HTTPS_ENABLED, false),
    HTTPS_KEY_PATH: process.env.HTTPS_KEY_PATH || '',
    HTTPS_CERT_PATH: process.env.HTTPS_CERT_PATH || '',

    // Blockchain
    DB_PATH: process.env.DB_PATH || path.join(rootDir, 'blockchain-db'),
    DIFFICULTY: toInt(process.env.DIFFICULTY, 4),
    MINING_REWARD: toFloat(process.env.MINING_REWARD, 50),
    BLOCK_SIZE: toInt(process.env.BLOCK_SIZE, 1000),

    // Network constants (future use)
    NETWORK_ID: process.env.NETWORK_ID || 'pharbitchain-local',
    MAX_PEERS: toInt(process.env.MAX_PEERS, 50),

    // Security keys (if any future signing/secrets required)
    JWT_SECRET: process.env.JWT_SECRET || '',
};

module.exports = config;

