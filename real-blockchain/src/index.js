const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const Wallet = require('./wallet');
const Transaction = require('./transaction');
const CryptoUtils = require('./crypto');

class BlockchainNode {
    constructor(port = 3000) {
        this.port = port;
        this.blockchain = new Blockchain();
        this.wallet = new Wallet();
        this.app = express();
        this.isMining = false;
        
        this.setupMiddleware();
        this.setupRoutes();
    }

    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        
        // Serve static files from public directory
        this.app.use(express.static('public'));
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

                const transaction = new Transaction(from, to, amount, privateKey, fee || 0.001);
                
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
                }
            });
        });
    }

    /**
     * Start the blockchain node
     */
    start() {
        this.app.listen(this.port, () => {
            console.log(`🚀 Real Blockchain Node started on port ${this.port}`);
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
        });
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
    
    node.start();
}

module.exports = BlockchainNode;