const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const https = require('https');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const Blockchain = require('./blockchain');
const config = require('./config');
const Wallet = require('./wallet');
const PharmaceuticalTransaction = require('./transaction');
const CryptoUtils = require('./crypto');
const IoTIntegration = require('./iot-integration');
const AlertSystem = require('./alerts');
const SupplyChain = require('./supply-chain');
const logger = require('./logger');
const { metrics, attachResponseTime } = require('./metrics');
const P2P = require('./p2p');
const ContractEngine = require('./contracts/engine');
const Templates = require('./contracts/templates');

class BlockchainNode {
    constructor(port = config.PORT) {
        this.port = port;
        this.blockchain = new Blockchain();
        this.wallet = new Wallet();
        this.alertSystem = new AlertSystem();
        this.iotIntegration = new IoTIntegration(this.blockchain, this.alertSystem);
        this.supplyChain = new SupplyChain(this.blockchain, this.alertSystem);
        this.app = express();
        this.isMining = false;
        
        this.setupMiddleware();
        this.setupRoutes();

        // Initialize P2P networking
        this.p2p = new P2P(this.blockchain, config);
        this.p2p.start();

        // Contracts
        this.contracts = new ContractEngine('./contract-state');
        this.contracts.open();
    }

    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        // Security headers
        this.app.use(helmet({
            crossOriginResourcePolicy: { policy: 'cross-origin' },
            contentSecurityPolicy: false
        }));

        // CORS configuration
        const corsOrigins = (config.CORS_ORIGINS || '*').split(',').map(s => s.trim());
        this.app.use(cors({
            origin: function(origin, callback) {
                if (!origin || corsOrigins.includes('*') || corsOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
            allowedHeaders: ['Content-Type','Authorization'],
            credentials: true,
            maxAge: 600
        }));

        // Rate limiting for API routes
        const limiter = rateLimit({
            windowMs: config.RATE_WINDOW_MS,
            max: config.RATE_MAX,
            standardHeaders: true,
            legacyHeaders: false,
            message: { error: 'Too many requests, please try again later.' }
        });
        this.app.use('/api', limiter);

        // Body parsing middleware with limits
        const jsonLimit = config.JSON_BODY_LIMIT;
        this.app.use(bodyParser.json({ limit: jsonLimit }));
        this.app.use(bodyParser.urlencoded({ extended: true, limit: jsonLimit }));

        // Response-time metrics
        attachResponseTime(this.app);

        // Specific handler for JSON parse errors
        this.app.use((error, req, res, next) => {
            if (error && error.type === 'entity.parse.failed') {
                return res.status(400).json({
                    error: 'Invalid JSON payload',
                    message: 'Malformed JSON body'
                });
            }
            if (error instanceof SyntaxError && 'body' in error) {
                return res.status(400).json({
                    error: 'Invalid JSON payload',
                    message: 'Syntax error in JSON body'
                });
            }
            return next(error);
        });
        
        // Request logging middleware
        this.app.use((req, res, next) => {
            logger.info(`${req.method} ${req.path}`, { ip: req.ip, userAgent: req.headers['user-agent'] });
            next();
        });
        
        // Serve static files from public directory
        this.app.use(express.static('public'));
        
        // Centralized error handler
        this.app.use((error, req, res, next) => {
            const status = error.status || 500;
            const code = error.code || 'INTERNAL_ERROR';
            const msg = status === 500 ? 'Internal server error' : (error.message || 'Request failed');
            if (status >= 500) {
                logger.error('Server Error', { message: error.message, stack: error.stack });
            } else {
                logger.warn('Request Error', { status, message: msg });
            }
            res.status(status).json({ error: msg, code, timestamp: new Date().toISOString() });
        });
    }

    /**
     * Setup API routes
     */
    setupRoutes() {
        // Blockchain info
        this.app.get('/api/blockchain', (req, res) => {
            res.json({
                chain: this.blockchain.chain.map(block => block.toJSON()),
                stats: this.blockchain.getStats(),
                isValid: this.blockchain.isChainValid()
            });
        });

        // Get latest block
        this.app.get('/api/blockchain/latest', (req, res) => {
            const latestBlock = this.blockchain.getLatestBlock();
            res.json(latestBlock.toJSON());
        });

        // Get block by index
        this.app.get('/api/blockchain/block/:index', (req, res) => {
            const index = parseInt(req.params.index);
            if (index >= 0 && index < this.blockchain.chain.length) {
                res.json(this.blockchain.chain[index].toJSON());
            } else {
                res.status(404).json({ error: 'Block not found' });
            }
        });

        // Get pending transactions
        this.app.get('/api/transactions/pending', (req, res) => {
            res.json(this.blockchain.pendingTransactions.map(tx => tx.toJSON()));
        });

        // Create new transaction (legacy path; prefer MetaMask-signed endpoints)
        this.app.post('/api/transactions', (req, res) => {
            try {
                const { from, to, amount, fee, privateKey } = req.body;

                if (!from || !to || !amount || !privateKey) {
                    return res.status(400).json({ 
                        error: 'Missing required fields: from, to, amount, privateKey' 
                    });
                }

                // Note: This endpoint is for legacy compatibility
                // For pharmaceutical transactions, use the batch endpoints
                const transaction = new PharmaceuticalTransaction(
                    from, to, 
                    'LEGACY_BATCH', // batchId
                    { name: 'Legacy Transaction', manufacturer: 'System', type: 'legacy', expiration: '2099-12-31' }, // medicineInfo
                    'transfer', // action
                    'system', // stakeholder
                    { lat: 0, lon: 0, facility: 'System' }, // location
                    { temperature: 20, humidity: 50, light: 0, tampering: false, timestamp: Date.now() }, // sensorData
                    privateKey, 
                    fee || 0.001
                );
                
                if (!transaction.isValid()) {
                    return res.status(400).json({ error: 'Invalid transaction' });
                }

                this.blockchain.addTransaction(transaction);
                metrics.recordTxProcessed();
                
                res.json({
                    message: 'Transaction added to pending transactions',
                    transaction: transaction.toJSON()
                });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        // Mine pending transactions
        this.app.post('/api/mine', (req, res) => {
            if (this.isMining) {
                return res.status(400).json({ error: 'Mining already in progress' });
            }

            const { error: vErr, value } = require('joi').object({
                minerAddress: require('joi').string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
            }).validate(req.body);
            if (vErr) return res.status(400).json({ error: vErr.message });
            const { minerAddress } = value;
            
            if (!minerAddress) {
                return res.status(400).json({ error: 'Miner address required' });
            }

            if (!CryptoUtils.isValidAddress(minerAddress)) {
                return res.status(400).json({ error: 'Invalid miner address' });
            }

            this.isMining = true;
            
            // Mine in background
            setTimeout(() => {
                try {
                    const block = this.blockchain.minePendingTransactions(minerAddress);
                    this.isMining = false;
                    
                    if (block) {
                        console.log(`✅ Block ${block.index} mined successfully!`);
                        try { this.p2p.broadcast({ type: 'INV', objType: 'block', hashes: [block.hash] }); } catch (_) {}
                    }
                } catch (error) {
                    console.error('Mining error:', error);
                    this.isMining = false;
                }
            }, 100);

            res.json({ 
                message: 'Mining started',
                minerAddress,
                pendingTransactions: this.blockchain.pendingTransactions.length
            });
        });

        // Get balance
        this.app.get('/api/balance/:address', (req, res) => {
            const { error: pErr, value } = require('joi').object({
                address: require('joi').string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
            }).validate(req.params);
            if (pErr) return res.status(400).json({ error: pErr.message });
            const { address } = value;
            
            if (!CryptoUtils.isValidAddress(address)) {
                return res.status(400).json({ error: 'Invalid address' });
            }

            const balance = this.blockchain.getBalance(address);
            res.json({ address, balance });
        });

        // Get transaction history
        this.app.get('/api/transactions/:address', (req, res) => {
            const { error: pErr, value } = require('joi').object({
                address: require('joi').string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
            }).validate(req.params);
            if (pErr) return res.status(400).json({ error: pErr.message });
            const { address } = value;
            
            if (!CryptoUtils.isValidAddress(address)) {
                return res.status(400).json({ error: 'Invalid address' });
            }

            const history = this.blockchain.getTransactionHistory(address);
            res.json({ address, history });
        });

        // Wallet routes
        this.app.get('/api/wallet', (req, res) => {
            const walletInfo = this.wallet.getWalletInfo();
            res.json(walletInfo);
        });

        this.app.post('/api/wallet/generate', (req, res) => {
            try {
                const walletInfo = this.wallet.generateWallet();
                res.json({
                    message: 'Wallet generated successfully',
                    wallet: walletInfo
                });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        this.app.post('/api/wallet/import', (req, res) => {
            try {
                const { error: wErr, value } = require('joi').object({ privateKey: require('joi').string().hex().required() }).validate(req.body);
                if (wErr) return res.status(400).json({ error: wErr.message });
                const { privateKey } = value;
                
                if (!privateKey) {
                    return res.status(400).json({ error: 'Private key required' });
                }

                const walletInfo = this.wallet.importWallet(privateKey);
                res.json({
                    message: 'Wallet imported successfully',
                    wallet: walletInfo
                });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        this.app.post('/api/wallet/transaction', (req, res) => {
            try {
                const { error: tErr, value } = require('joi').object({
                    to: require('joi').string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
                    amount: require('joi').number().positive().required(),
                    fee: require('joi').number().min(0).default(0.001)
                }).validate(req.body);
                if (tErr) return res.status(400).json({ error: tErr.message });
                const { to, amount, fee } = value;

                if (!this.wallet.isInitialized()) {
                    return res.status(400).json({ error: 'Wallet not initialized' });
                }

                if (!to || !amount) {
                    return res.status(400).json({ error: 'Recipient and amount required' });
                }

                const transaction = this.wallet.createTransaction(to, amount, fee || 0.001);
                this.blockchain.addTransaction(transaction);
                metrics.recordTxProcessed();

                res.json({
                    message: 'Transaction created and added to pending',
                    transaction: transaction.toJSON()
                });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        // Blockchain validation
        this.app.get('/api/blockchain/validate', (req, res) => {
            const isValid = this.blockchain.isChainValid();
            res.json({ isValid });
        });

        // Mining status
        this.app.get('/api/mining/status', (req, res) => {
            res.json({ 
                isMining: this.isMining,
                pendingTransactions: this.blockchain.pendingTransactions.length,
                difficulty: this.blockchain.difficulty
            });
        });

        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                brand: 'PharbitChain',
                timestamp: new Date().toISOString(),
                blockchain: {
                    blocks: this.blockchain.chain.length,
                    pendingTransactions: this.blockchain.pendingTransactions.length,
                    isValid: this.blockchain.isChainValid()
                },
                wallet: {
                    initialized: this.wallet.isInitialized(),
                    address: this.wallet.getAddress()
                },
                pharmaceutical: {
                    batches: this.supplyChain.getAllBatches().length,
                    activeAlerts: this.alertSystem.getActiveAlerts().length,
                    activeSensors: this.iotIntegration.getActiveSensors().size
                },
                db: { path: this.blockchain.dbPath, initialized: this.blockchain.initialized },
                system: metrics.getSystemStats(),
                metrics: metrics.summarize()
            });
        });

        // ===== PHARMACEUTICAL API ENDPOINTS =====

        // Get batch information
        this.app.get('/api/batch/:batchId', (req, res) => {
            try {
                const { error: pErr, value } = require('joi').object({ batchId: require('joi').string().min(3).required() }).validate(req.params);
                if (pErr) return res.status(400).json({ error: pErr.message });
                const { batchId } = value;
                const batch = this.supplyChain.getBatch(batchId);
                
                if (!batch) {
                    return res.status(404).json({ error: 'Batch not found' });
                }
                
                res.json({
                    batch: batch,
                    history: this.supplyChain.getBatchHistory(batchId),
                    temperatureHistory: this.supplyChain.getBatchTemperatureHistory(batchId),
                    authenticity: this.supplyChain.verifyBatchAuthenticity(batchId)
                });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        // Create new medicine batch
        // Supports two modes:
        // 1) Legacy: { batchInfo, manufacturerAddress, privateKey }
        // 2) MetaMask: { batchInfo, address, signature } where signature authorizes creation
        this.app.post('/api/batch', (req, res) => {
            try {
                const schema = require('joi').object({
                    batchInfo: require('joi').object({
                        medicineInfo: require('joi').object({
                            name: require('joi').string().min(1).required(),
                            manufacturer: require('joi').string().min(1).required(),
                            type: require('joi').string().min(1).required(),
                            expiration: require('joi').string().isoDate().required()
                        }).required(),
                        quantity: require('joi').number().integer().positive().required(),
                        expirationDate: require('joi').string().isoDate().required(),
                        manufacturingLocation: require('joi').object({
                            facility: require('joi').string().min(1).required(),
                            lat: require('joi').number().required(),
                            lon: require('joi').number().required()
                        }).required(),
                        initialTemperature: require('joi').number().required(),
                        initialHumidity: require('joi').number().required()
                    }).required(),
                    manufacturerAddress: require('joi').string().pattern(/^0x[a-fA-F0-9]{40}$/),
                    privateKey: require('joi').string().hex(),
                    address: require('joi').string().pattern(/^0x[a-fA-F0-9]{40}$/),
                    signature: require('joi').string().pattern(/^0x[a-fA-F0-9]+$/)
                }).xor('privateKey','signature');
                const { error: bErr, value } = schema.validate(req.body);
                if (bErr) return res.status(400).json({ error: bErr.message });
                const { batchInfo, manufacturerAddress, privateKey, address, signature } = value;

                let signerAddress = manufacturerAddress;
                let signerPrivateKey = privateKey;

                if (!batchInfo) {
                    return res.status(400).json({ error: 'Missing required field: batchInfo' });
                }

                // MetaMask flow
                if (signature && address) {
                    // Canonical message to sign
                    const message = JSON.stringify({
                        type: 'CREATE_BATCH',
                        batchInfo
                    });
                    const recovered = CryptoUtils.recoverEthAddressFromMessage(message, signature);
                    if (!recovered || recovered.toLowerCase() !== address.toLowerCase()) {
                        return res.status(401).json({ error: 'Signature verification failed' });
                    }
                    if (!CryptoUtils.isValidAddress(address)) {
                        return res.status(400).json({ error: 'Invalid Ethereum address' });
                    }
                    signerAddress = address;
                    // No private key on server side; transaction object will be unsigned but authorized by signature
                    signerPrivateKey = null;
                } else {
                    // Legacy flow
                    if (!signerAddress || !signerPrivateKey) {
                        return res.status(400).json({ 
                            error: 'Missing required fields: manufacturerAddress, privateKey' 
                        });
                    }
                    if (!CryptoUtils.isValidAddress(signerAddress)) {
                        return res.status(400).json({ error: 'Invalid manufacturerAddress' });
                    }
                    if (!CryptoUtils.isValidPrivateKey(signerPrivateKey)) {
                        return res.status(400).json({ error: 'Invalid privateKey' });
                    }
                }

                const result = this.supplyChain.createBatch(batchInfo, signerAddress, signerPrivateKey);
                
                res.json({
                    message: 'Batch created successfully',
                    batchId: result.batchId,
                    batch: result.batch,
                    transaction: result.transaction.toJSON()
                });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        // Get temperature history for batch
        this.app.get('/api/temperature/:batchId', (req, res) => {
            try {
                const pv = require('joi').object({ batchId: require('joi').string().min(3).required() }).validate(req.params);
                if (pv.error) return res.status(400).json({ error: pv.error.message });
                const qv = require('joi').object({ hours: require('joi').number().integer().min(1).max(720).default(24) }).validate(req.query);
                if (qv.error) return res.status(400).json({ error: qv.error.message });
                const { batchId } = pv.value;
                const { hours } = qv.value;
                
                const history = this.iotIntegration.getTemperatureHistory(batchId, parseInt(hours));
                
                res.json({
                    batchId: batchId,
                    history: history,
                    hours: parseInt(hours)
                });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        // Receive IoT sensor data
        this.app.post('/api/sensor-data', (req, res) => {
            try {
                const { value: sensorData, error: sErr } = require('joi').object({
                    batchId: require('joi').string().min(3).required(),
                    sensorId: require('joi').string().min(1).required(),
                    temperature: require('joi').number().min(-50).max(100),
                    humidity: require('joi').number().min(0).max(100),
                    light: require('joi').number().min(0),
                    tampering: require('joi').boolean(),
                    gps: require('joi').object({ lat: require('joi').number().required(), lon: require('joi').number().required() }).optional(),
                    timestamp: require('joi').number().optional()
                }).validate(req.body);
                if (sErr) return res.status(400).json({ error: sErr.message });
                
                if (!sensorData.batchId || !sensorData.sensorId) {
                    return res.status(400).json({ 
                        error: 'Missing required fields: batchId, sensorId' 
                    });
                }
                
                const result = this.iotIntegration.processSensorData(sensorData);
                
                res.json(result);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        // Verify batch authenticity
        this.app.get('/api/verify/:batchId', (req, res) => {
            try {
                const { error: vErr, value } = require('joi').object({ batchId: require('joi').string().min(3).required() }).validate(req.params);
                if (vErr) return res.status(400).json({ error: vErr.message });
                const { batchId } = value;
                const verification = this.supplyChain.verifyBatchAuthenticity(batchId);
                
                res.json({
                    batchId: batchId,
                    verification: verification
                });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        // Get active alerts
        this.app.get('/api/alerts', (req, res) => {
            try {
                const { error: qErr, value } = require('joi').object({
                    severity: require('joi').string().valid('normal','warning','critical').optional(),
                    type: require('joi').string().optional(),
                    batchId: require('joi').string().optional()
                }).validate(req.query);
                if (qErr) return res.status(400).json({ error: qErr.message });
                const { severity, type, batchId } = value;
                const filters = {};
                
                if (severity) filters.severity = severity;
                if (type) filters.type = type;
                if (batchId) filters.batchId = batchId;
                
                const alerts = this.alertSystem.getAlerts(filters);
                const stats = this.alertSystem.getAlertStats();
                
                res.json({
                    alerts: alerts,
                    stats: stats
                });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        // Acknowledge alert
        this.app.post('/api/alerts/:alertId/acknowledge', (req, res) => {
            try {
                const params = require('joi').object({ alertId: require('joi').string().min(3).required() }).validate(req.params);
                if (params.error) return res.status(400).json({ error: params.error.message });
                const body = require('joi').object({ acknowledgedBy: require('joi').string().min(1).required(), notes: require('joi').string().allow('').optional() }).validate(req.body);
                if (body.error) return res.status(400).json({ error: body.error.message });
                const { alertId } = params.value;
                const { acknowledgedBy, notes } = body.value;
                
                if (!acknowledgedBy) {
                    return res.status(400).json({ error: 'acknowledgedBy is required' });
                }
                
                const alert = this.alertSystem.acknowledgeAlert(alertId, acknowledgedBy, notes);
                
                res.json({
                    message: 'Alert acknowledged successfully',
                    alert: alert
                });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        // Resolve alert
        this.app.post('/api/alerts/:alertId/resolve', (req, res) => {
            try {
                const params = require('joi').object({ alertId: require('joi').string().min(3).required() }).validate(req.params);
                if (params.error) return res.status(400).json({ error: params.error.message });
                const body = require('joi').object({ resolvedBy: require('joi').string().min(1).required(), resolution: require('joi').string().allow('').optional() }).validate(req.body);
                if (body.error) return res.status(400).json({ error: body.error.message });
                const { alertId } = params.value;
                const { resolvedBy, resolution } = body.value;
                
                if (!resolvedBy) {
                    return res.status(400).json({ error: 'resolvedBy is required' });
                }
                
                const alert = this.alertSystem.resolveAlert(alertId, resolvedBy, resolution);
                
                res.json({
                    message: 'Alert resolved successfully',
                    alert: alert
                });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        // Get supply chain statistics
        this.app.get('/api/supply-chain/stats', (req, res) => {
            try {
                const stats = this.supplyChain.getSupplyChainStats();
                
                res.json({
                    stats: stats
                });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        // ===== CONTRACTS API =====
        // Deploy
        this.app.post('/api/contracts/deploy', async (req, res) => {
            try {
                const { code, template, initState } = req.body || {};
                const selected = template ? (Templates[template] && Templates[template].ops) : null;
                const ops = code && code.ops ? code.ops : selected;
                if (!ops) return res.status(400).json({ error: 'Provide code.ops or a valid template' });
                const out = await this.contracts.deploy({ code: { ops }, initState: initState || {} });
                res.json({ message: 'deployed', address: out.address });
            } catch (e) { res.status(400).json({ error: e.message }); }
        });
        // Call
        this.app.post('/api/contracts/call', async (req, res) => {
            try {
                const { address, ops, gasLimit } = req.body || {};
                if (!address || !ops) return res.status(400).json({ error: 'address and ops required' });
                const out = await this.contracts.call({ address, ops, gasLimit });
                res.json(out);
            } catch (e) { res.status(400).json({ error: e.message }); }
        });
        // State
        this.app.get('/api/contracts/state/:address', async (req, res) => {
            try {
                const st = await this.contracts.getState(req.params.address);
                if (!st) return res.status(404).json({ error: 'not_found' });
                res.json(st);
            } catch (e) { res.status(400).json({ error: e.message }); }
        });

        // ===== ADMIN / NODE MANAGEMENT API =====
        // List peers
        this.app.get('/api/admin/peers', (req, res) => {
            res.json({ peers: this.p2p.listPeers() });
        });
        // Add peer
        this.app.post('/api/admin/peers', (req, res) => {
            const { url } = req.body || {};
            if (!url) return res.status(400).json({ error: 'url is required' });
            this.p2p.addPeer(url);
            res.json({ message: 'connecting', url });
        });
        // Remove peer
        this.app.delete('/api/admin/peers', (req, res) => {
            const { url } = req.body || {};
            if (!url) return res.status(400).json({ error: 'url is required' });
            const ok = this.p2p.disconnect(url);
            res.json({ message: ok ? 'disconnected' : 'not_found', url });
        });
        // Start/stop mining (flag only; mining triggered by /api/mine)
        this.app.post('/api/admin/mining', (req, res) => {
            const { enabled } = req.body || {};
            if (enabled === undefined) return res.status(400).json({ error: 'enabled is required' });
            const prev = config.MINING_ENABLED;
            config.MINING_ENABLED = !!enabled;
            res.json({ previous: prev, current: config.MINING_ENABLED });
        });
        // Export blockchain JSON
        this.app.get('/api/admin/export', (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.json(this.blockchain.toJSON());
        });
        // Network stats
        this.app.get('/api/admin/network', (req, res) => {
            const tip = this.blockchain.getLatestBlock();
            res.json({
                peers: this.p2p.listPeers(),
                height: tip.index,
                hash: tip.hash,
                metrics: metrics.summarize()
            });
        });

        // ===== MOBILE-OPTIMIZED ENDPOINTS =====
        // Lightweight blockchain head
        this.app.get('/m/chain/head', (req, res) => {
            const tip = this.blockchain.getLatestBlock();
            res.json({ h: tip.index, x: tip.hash, p: this.blockchain.pendingTransactions.length });
        });
        // Batch state (compact)
        this.app.get('/m/batch/:id', (req, res) => {
            try {
                const b = this.supplyChain.getBatch(req.params.id);
                if (!b) return res.status(404).json({ e: 'nf' });
                res.json({ id: b.id, s: b.status, o: b.currentStakeholder, q: b.quantity, exp: b.expirationDate });
            } catch (e) { res.status(400).json({ e: 'err' }); }
        });
        // Offline tx template
        this.app.post('/m/tx/template', (req, res) => {
            const { to, amount, fee } = req.body || {};
            if (!to || !amount) return res.status(400).json({ e: 'bad' });
            res.json({ to, amount, fee: fee||0.001, nonce: Date.now() });
        });

        // Get supply chain journey
        this.app.get('/api/supply-chain/:batchId', (req, res) => {
            try {
                const { batchId } = req.params;
                const batch = this.supplyChain.getBatch(batchId);
                
                if (!batch) {
                    return res.status(404).json({ error: 'Batch not found' });
                }
                
                const history = this.supplyChain.getBatchHistory(batchId);
                const temperatureHistory = this.supplyChain.getBatchTemperatureHistory(batchId);
                const alerts = this.alertSystem.getBatchAlerts(batchId);
                
                res.json({
                    batchId: batchId,
                    batch: batch,
                    journey: history,
                    temperatureHistory: temperatureHistory,
                    alerts: alerts
                });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        // Transfer batch custody
        this.app.post('/api/supply-chain/transfer', (req, res) => {
            try {
                const schema = require('joi').object({
                    batchId: require('joi').string().min(3).required(),
                    fromStakeholder: require('joi').string().min(1).required(),
                    toStakeholder: require('joi').string().min(1).required(),
                    transferInfo: require('joi').object({
                        action: require('joi').string().min(1).required(),
                        location: require('joi').object({ facility: require('joi').string().min(1).required(), lat: require('joi').number().required(), lon: require('joi').number().required() }).required(),
                        sensorData: require('joi').object({ temperature: require('joi').number().required(), humidity: require('joi').number().required(), timestamp: require('joi').number().required() }).required()
                    }).required(),
                    privateKey: require('joi').string().hex(),
                    address: require('joi').string().pattern(/^0x[a-fA-F0-9]{40}$/),
                    signature: require('joi').string().pattern(/^0x[a-fA-F0-9]+$/)
                }).xor('privateKey','signature');
                const { error: tErr, value } = schema.validate(req.body);
                if (tErr) return res.status(400).json({ error: tErr.message });
                const { batchId, fromStakeholder, toStakeholder, transferInfo, privateKey, address, signature } = value;

                let signerPrivateKey = privateKey;
                
                if (!batchId || !fromStakeholder || !toStakeholder || !transferInfo) {
                    return res.status(400).json({ 
                        error: 'Missing required fields: batchId, fromStakeholder, toStakeholder, transferInfo' 
                    });
                }

                // MetaMask flow
                if (signature && address) {
                    const message = JSON.stringify({
                        type: 'TRANSFER_CUSTODY',
                        batchId,
                        fromStakeholder,
                        toStakeholder,
                        transferInfo
                    });
                    const recovered = CryptoUtils.recoverEthAddressFromMessage(message, signature);
                    if (!recovered || recovered.toLowerCase() !== address.toLowerCase()) {
                        return res.status(401).json({ error: 'Signature verification failed' });
                    }
                    signerPrivateKey = null;
                } else {
                    if (!signerPrivateKey) {
                        return res.status(400).json({ error: 'Missing required field: privateKey' });
                    }
                    if (!CryptoUtils.isValidPrivateKey(signerPrivateKey)) {
                        return res.status(400).json({ error: 'Invalid privateKey' });
                    }
                }

                const result = this.supplyChain.transferCustody(batchId, fromStakeholder, toStakeholder, transferInfo, signerPrivateKey);
                
                res.json({
                    message: 'Custody transferred successfully',
                    result: result
                });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        // Register stakeholder
        this.app.post('/api/stakeholders', (req, res) => {
            try {
                const { stakeholderId, stakeholderInfo } = req.body;
                
                if (!stakeholderId || !stakeholderInfo) {
                    return res.status(400).json({ 
                        error: 'Missing required fields: stakeholderId, stakeholderInfo' 
                    });
                }
                
                this.supplyChain.registerStakeholder(stakeholderId, stakeholderInfo);
                
                res.json({
                    message: 'Stakeholder registered successfully',
                    stakeholderId: stakeholderId
                });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        // Authorize stakeholder for batch
        this.app.post('/api/stakeholders/:stakeholderId/authorize/:batchId', (req, res) => {
            try {
                const { stakeholderId, batchId } = req.params;
                
                this.supplyChain.authorizeStakeholder(stakeholderId, batchId);
                
                res.json({
                    message: 'Stakeholder authorized successfully',
                    stakeholderId: stakeholderId,
                    batchId: batchId
                });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    }

    /**
     * Start the blockchain node
     */
    async start() {
        try {
            console.log('🚀 Starting PharbitChain Server...');
            console.log(`📡 Server will listen on port ${this.port}`);
            console.log(`🌐 Dashboard will be available at: http://localhost:${this.port}`);
            
            // Wait for blockchain initialization
            await this.blockchain.waitForInitialization();
            
            const host = '0.0.0.0';
            const httpsEnabled = config.HTTPS_ENABLED === true;
            if (httpsEnabled) {
                try {
                    const key = fs.readFileSync(config.HTTPS_KEY_PATH);
                    const cert = fs.readFileSync(config.HTTPS_CERT_PATH);
                    const server = https.createServer({ key, cert }, this.app);
                    server.listen(this.port, host, () => {
                        console.log(`\n✅ PharbitChain Server Successfully Started!`);
                        console.log(`📍 Server URL: https://localhost:${this.port}`);
                        console.log(`📊 Blockchain Stats:`, this.blockchain.getStats());
                        
                        if (this.wallet.isInitialized()) {
                            console.log(`💰 Wallet Address: ${this.wallet.getAddress()}`);
                        } else {
                            console.log(`⚠️  No wallet initialized. Use /api/wallet/generate to create one.`);
                        }
                    
                    console.log(`🌐 API Documentation:`);
                    console.log(`   GET  /api/blockchain - Get blockchain info`);
                    console.log(`   GET  /api/blockchain/latest - Get latest block`);
                    console.log(`   GET  /api/transactions/pending - Get pending transactions`);
                    console.log(`   POST /api/transactions - Create new transaction`);
                    console.log(`   POST /api/mine - Mine pending transactions`);
                    console.log(`   GET  /api/balance/:address - Get address balance`);
                    console.log(`   GET  /api/transactions/:address - Get transaction history`);
                    console.log(`   GET  /api/wallet - Get wallet info`);
                    console.log(`   POST /api/wallet/generate - Generate new wallet`);
                    console.log(`   POST /api/wallet/import - Import wallet`);
                    console.log(`   POST /api/wallet/transaction - Create transaction from wallet`);
                    console.log(`   GET  /api/blockchain/validate - Validate blockchain`);
                    console.log(`   GET  /api/mining/status - Get mining status`);
                    console.log(`   GET  /api/health - Health check`);
                    console.log(`\n💊 PharbitChain API Endpoints:`);
                    console.log(`   GET  /api/batch/:batchId - Get batch information`);
                    console.log(`   POST /api/batch - Create new medicine batch`);
                    console.log(`   GET  /api/temperature/:batchId - Get temperature history`);
                    console.log(`   POST /api/sensor-data - Receive IoT sensor data`);
                    console.log(`   GET  /api/verify/:batchId - Verify batch authenticity`);
                    console.log(`   GET  /api/alerts - Get active alerts`);
                    console.log(`   POST /api/alerts/:alertId/acknowledge - Acknowledge alert`);
                    console.log(`   POST /api/alerts/:alertId/resolve - Resolve alert`);
                    console.log(`   GET  /api/supply-chain/:batchId - Get supply chain journey`);
                    console.log(`   POST /api/supply-chain/transfer - Transfer batch custody`);
                    console.log(`   GET  /api/supply-chain/stats - Get supply chain statistics`);
                    console.log(`   POST /api/stakeholders - Register stakeholder`);
                    console.log(`   POST /api/stakeholders/:id/authorize/:batchId - Authorize stakeholder`);
                    console.log(`\n🎯 Ready for pharmaceutical supply chain operations!`);
                    console.log(`💊 Access the dashboard at: https://localhost:${this.port}`);
                });
                } catch (e) {
                    console.error('❌ Failed to start HTTPS server:', e.message);
                    process.exit(1);
                }
            } else {
                this.app.listen(this.port, host, () => {
                    console.log(`\n✅ PharbitChain Server Successfully Started!`);
                    console.log(`📍 Server URL: http://localhost:${this.port}`);
                    console.log(`📊 Blockchain Stats:`, this.blockchain.getStats());
                    
                    if (this.wallet.isInitialized()) {
                        console.log(`💰 Wallet Address: ${this.wallet.getAddress()}`);
                    } else {
                        console.log(`⚠️  No wallet initialized. Use /api/wallet/generate to create one.`);
                    }
                
                console.log(`🌐 API Documentation:`);
                    console.log(`   GET  /api/blockchain - Get blockchain info`);
                    console.log(`   GET  /api/blockchain/latest - Get latest block`);
                    console.log(`   GET  /api/transactions/pending - Get pending transactions`);
                    console.log(`   POST /api/transactions - Create new transaction`);
                    console.log(`   POST /api/mine - Mine pending transactions`);
                    console.log(`   GET  /api/balance/:address - Get address balance`);
                    console.log(`   GET  /api/transactions/:address - Get transaction history`);
                    console.log(`   GET  /api/wallet - Get wallet info`);
                    console.log(`   POST /api/wallet/generate - Generate new wallet`);
                    console.log(`   POST /api/wallet/import - Import wallet`);
                    console.log(`   POST /api/wallet/transaction - Create transaction from wallet`);
                    console.log(`   GET  /api/blockchain/validate - Validate blockchain`);
                    console.log(`   GET  /api/mining/status - Get mining status`);
                    console.log(`   GET  /api/health - Health check`);
                    console.log(`\n💊 PharbitChain API Endpoints:`);
                    console.log(`   GET  /api/batch/:batchId - Get batch information`);
                    console.log(`   POST /api/batch - Create new medicine batch`);
                    console.log(`   GET  /api/temperature/:batchId - Get temperature history`);
                    console.log(`   POST /api/sensor-data - Receive IoT sensor data`);
                    console.log(`   GET  /api/verify/:batchId - Verify batch authenticity`);
                    console.log(`   GET  /api/alerts - Get active alerts`);
                    console.log(`   POST /api/alerts/:alertId/acknowledge - Acknowledge alert`);
                    console.log(`   POST /api/alerts/:alertId/resolve - Resolve alert`);
                    console.log(`   GET  /api/supply-chain/:batchId - Get supply chain journey`);
                    console.log(`   POST /api/supply-chain/transfer - Transfer batch custody`);
                    console.log(`   GET  /api/supply-chain/stats - Get supply chain statistics`);
                    console.log(`   POST /api/stakeholders - Register stakeholder`);
                    console.log(`   POST /api/stakeholders/:id/authorize/:batchId - Authorize stakeholder`);
                    console.log(`\n🎯 Ready for pharmaceutical supply chain operations!`);
                    console.log(`💊 Access the dashboard at: http://localhost:${this.port}`);
                });
            }
        
        } catch (error) {
            console.error('❌ Failed to start PharbitChain Server:', error);
            process.exit(1);
        }
    }

    /**
     * Stop the blockchain node
     */
    stop() {
        console.log('🛑 Stopping blockchain node...');
        process.exit(0);
    }
}

// Start the blockchain node if this file is run directly
if (require.main === module) {
    const port = process.env.PORT || 3000;
    const node = new BlockchainNode(port);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        node.stop();
    });
    
    process.on('SIGTERM', () => {
        node.stop();
    });
    
    node.start().catch(error => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
}

module.exports = BlockchainNode;