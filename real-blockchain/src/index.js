const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const Wallet = require('./wallet');
const PharmaceuticalTransaction = require('./transaction');
const CryptoUtils = require('./crypto');
const IoTIntegration = require('./iot-integration');
const AlertSystem = require('./alerts');
const SupplyChain = require('./supply-chain');

class BlockchainNode {
    constructor(port = 3000) {
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
    }

    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        // CORS middleware
        this.app.use(cors());
        
        // Body parsing middleware
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        
        // Request logging middleware
        this.app.use((req, res, next) => {
            console.log(`📡 ${req.method} ${req.path} - ${new Date().toISOString()}`);
            next();
        });
        
        // Serve static files from public directory
        this.app.use(express.static('public'));
        
        // Error handling middleware
        this.app.use((error, req, res, next) => {
            console.error('❌ Server Error:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                message: error.message,
                timestamp: new Date().toISOString()
            });
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

        // Create new transaction
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

            const { minerAddress } = req.body;
            
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
            const { address } = req.params;
            
            if (!CryptoUtils.isValidAddress(address)) {
                return res.status(400).json({ error: 'Invalid address' });
            }

            const balance = this.blockchain.getBalance(address);
            res.json({ address, balance });
        });

        // Get transaction history
        this.app.get('/api/transactions/:address', (req, res) => {
            const { address } = req.params;
            
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
                const { privateKey } = req.body;
                
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
                const { to, amount, fee } = req.body;

                if (!this.wallet.isInitialized()) {
                    return res.status(400).json({ error: 'Wallet not initialized' });
                }

                if (!to || !amount) {
                    return res.status(400).json({ error: 'Recipient and amount required' });
                }

                const transaction = this.wallet.createTransaction(to, amount, fee || 0.001);
                this.blockchain.addTransaction(transaction);

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
                }
            });
        });

        // ===== PHARMACEUTICAL API ENDPOINTS =====

        // Get batch information
        this.app.get('/api/batch/:batchId', (req, res) => {
            try {
                const { batchId } = req.params;
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
        this.app.post('/api/batch', (req, res) => {
            try {
                const { batchInfo, manufacturerAddress, privateKey } = req.body;
                
                if (!batchInfo || !manufacturerAddress || !privateKey) {
                    return res.status(400).json({ 
                        error: 'Missing required fields: batchInfo, manufacturerAddress, privateKey' 
                    });
                }
                
                const result = this.supplyChain.createBatch(batchInfo, manufacturerAddress, privateKey);
                
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
                const { batchId } = req.params;
                const { hours = 24 } = req.query;
                
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
                const sensorData = req.body;
                
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
                const { batchId } = req.params;
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
                const { severity, type, batchId } = req.query;
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
                const { alertId } = req.params;
                const { acknowledgedBy, notes } = req.body;
                
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
                const { alertId } = req.params;
                const { resolvedBy, resolution } = req.body;
                
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
                const { batchId, fromStakeholder, toStakeholder, transferInfo, privateKey } = req.body;
                
                if (!batchId || !fromStakeholder || !toStakeholder || !transferInfo || !privateKey) {
                    return res.status(400).json({ 
                        error: 'Missing required fields: batchId, fromStakeholder, toStakeholder, transferInfo, privateKey' 
                    });
                }
                
                const result = this.supplyChain.transferCustody(batchId, fromStakeholder, toStakeholder, transferInfo, privateKey);
                
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
            console.log('🚀 Starting Pharbit Pharmaceutical Blockchain Server...');
            console.log(`📡 Server will listen on port ${this.port}`);
            console.log(`🌐 Dashboard will be available at: http://localhost:${this.port}`);
            
            // Wait for blockchain initialization
            await this.blockchain.waitForInitialization();
            
            this.app.listen(this.port, () => {
                console.log(`\n✅ Pharbit Blockchain Server Successfully Started!`);
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
            console.log(`\n💊 Pharmaceutical API Endpoints:`);
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
        
        } catch (error) {
            console.error('❌ Failed to start Pharbit Blockchain Server:', error);
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