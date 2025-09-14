/**
 * @fileoverview Core Blockchain Implementation for PharbitChain
 * Implements Proof of Work consensus, transaction validation, and pharmaceutical-specific features
 */

const crypto = require('crypto');
const level = require('level');
const MerkleTree = require('merkle');
const logger = require('../utils/logger');

class Blockchain {
    constructor(options = {}) {
        this.chain = [];
        this.pendingTransactions = [];
        this.difficulty = options.difficulty || 4;
        this.miningReward = options.miningReward || 50;
        this.blockTime = options.blockTime || 60000; // 1 minute
        this.database = null;
        this.isMining = false;
        this.miningInterval = null;
        
        // Pharmaceutical-specific configuration
        this.complianceMode = options.complianceMode || 'FDA_21CFR11';
        this.auditRetentionDays = options.auditRetentionDays || 2555;
        this.digitalSignatureRequired = options.digitalSignatureRequired || true;
        
        // Initialize database
        this.initializeDatabase();
        
        // Create genesis block
        this.createGenesisBlock();
    }

    /**
     * Initialize LevelDB for blockchain storage
     */
    initializeDatabase() {
        try {
            this.database = level('./blockchain-data', { valueEncoding: 'json' });
            logger.info('Blockchain database initialized');
        } catch (error) {
            logger.error('Failed to initialize blockchain database:', error);
            throw new Error('Database initialization failed');
        }
    }

    /**
     * Create the genesis block
     */
    createGenesisBlock() {
        const genesisBlock = {
            index: 0,
            timestamp: new Date().toISOString(),
            transactions: [{
                type: 'GENESIS',
                from: null,
                to: null,
                amount: 0,
                data: {
                    message: 'PharbitChain Genesis Block - Pharmaceutical Supply Chain Blockchain',
                    complianceMode: this.complianceMode,
                    version: '1.0.0'
                },
                hash: '',
                signature: '',
                timestamp: new Date().toISOString()
            }],
            previousHash: '0',
            nonce: 0,
            hash: '',
            merkleRoot: '',
            difficulty: this.difficulty,
            blockTime: 0,
            pharmaceuticalData: {
                complianceMode: this.complianceMode,
                auditTrail: true,
                digitalSignatures: true,
                version: '1.0.0'
            }
        };

        // Calculate hash and merkle root
        genesisBlock.merkleRoot = this.calculateMerkleRoot(genesisBlock.transactions);
        genesisBlock.hash = this.calculateBlockHash(genesisBlock);
        
        this.chain.push(genesisBlock);
        this.saveBlock(genesisBlock);
        
        logger.info('Genesis block created');
    }

    /**
     * Add a new transaction to pending transactions
     * @param {Object} transaction - Transaction object
     * @returns {boolean} Success status
     */
    addTransaction(transaction) {
        try {
            // Validate transaction
            if (!this.validateTransaction(transaction)) {
                throw new Error('Invalid transaction');
            }

            // Add pharmaceutical compliance data
            transaction.pharmaceuticalData = {
                complianceMode: this.complianceMode,
                auditTimestamp: new Date().toISOString(),
                digitalSignature: transaction.signature || '',
                batchId: transaction.data?.batchId || null,
                documentHash: transaction.data?.documentHash || null,
                regulatoryCompliance: this.checkRegulatoryCompliance(transaction)
            };

            this.pendingTransactions.push(transaction);
            logger.info(`Transaction added: ${transaction.hash}`);
            
            return true;
        } catch (error) {
            logger.error('Failed to add transaction:', error);
            return false;
        }
    }

    /**
     * Validate transaction structure and content
     * @param {Object} transaction - Transaction to validate
     * @returns {boolean} Validation result
     */
    validateTransaction(transaction) {
        try {
            // Check required fields
            if (!transaction.from || !transaction.to || !transaction.amount) {
                return false;
            }

            // Validate transaction hash
            const calculatedHash = this.calculateTransactionHash(transaction);
            if (calculatedHash !== transaction.hash) {
                return false;
            }

            // Validate digital signature if required
            if (this.digitalSignatureRequired && !transaction.signature) {
                return false;
            }

            // Validate pharmaceutical-specific data
            if (transaction.type === 'BATCH_CREATE' || transaction.type === 'BATCH_UPDATE') {
                if (!transaction.data?.batchId || !transaction.data?.productCode) {
                    return false;
                }
            }

            // Check for double spending
            if (this.isDoubleSpending(transaction)) {
                return false;
            }

            return true;
        } catch (error) {
            logger.error('Transaction validation error:', error);
            return false;
        }
    }

    /**
     * Check regulatory compliance for transaction
     * @param {Object} transaction - Transaction to check
     * @returns {Object} Compliance status
     */
    checkRegulatoryCompliance(transaction) {
        const compliance = {
            fda21CFR11: false,
            dscsa: false,
            gdpr: false,
            iso27001: false
        };

        // FDA 21 CFR Part 11 compliance
        if (this.complianceMode === 'FDA_21CFR11') {
            compliance.fda21CFR11 = transaction.signature && 
                                  transaction.timestamp && 
                                  transaction.data?.auditTrail;
        }

        // DSCSA (Drug Supply Chain Security Act) compliance
        if (transaction.type === 'BATCH_CREATE' || transaction.type === 'BATCH_TRANSFER') {
            compliance.dscsa = transaction.data?.serializationData && 
                             transaction.data?.productIdentifier;
        }

        // GDPR compliance
        compliance.gdpr = !transaction.data?.personalData || 
                         transaction.data?.dataProcessingConsent;

        // ISO 27001 compliance
        compliance.iso27001 = transaction.encryption && 
                             transaction.accessControl;

        return compliance;
    }

    /**
     * Check for double spending
     * @param {Object} transaction - Transaction to check
     * @returns {boolean} True if double spending detected
     */
    isDoubleSpending(transaction) {
        // Check pending transactions
        for (const pendingTx of this.pendingTransactions) {
            if (pendingTx.from === transaction.from && 
                pendingTx.amount === transaction.amount && 
                pendingTx.timestamp === transaction.timestamp) {
                return true;
            }
        }

        // Check confirmed transactions
        for (const block of this.chain) {
            for (const tx of block.transactions) {
                if (tx.from === transaction.from && 
                    tx.amount === transaction.amount && 
                    tx.timestamp === transaction.timestamp) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Calculate transaction hash
     * @param {Object} transaction - Transaction object
     * @returns {string} Transaction hash
     */
    calculateTransactionHash(transaction) {
        const data = {
            from: transaction.from,
            to: transaction.to,
            amount: transaction.amount,
            timestamp: transaction.timestamp,
            data: transaction.data || {}
        };

        return crypto
            .createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex');
    }

    /**
     * Calculate block hash
     * @param {Object} block - Block object
     * @returns {string} Block hash
     */
    calculateBlockHash(block) {
        const data = {
            index: block.index,
            timestamp: block.timestamp,
            transactions: block.transactions,
            previousHash: block.previousHash,
            nonce: block.nonce,
            merkleRoot: block.merkleRoot,
            difficulty: block.difficulty
        };

        return crypto
            .createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex');
    }

    /**
     * Calculate Merkle root for transactions
     * @param {Array} transactions - Array of transactions
     * @returns {string} Merkle root
     */
    calculateMerkleRoot(transactions) {
        if (transactions.length === 0) {
            return '';
        }

        const hashes = transactions.map(tx => tx.hash);
        const tree = new MerkleTree(hashes);
        return tree.root();
    }

    /**
     * Mine a new block
     * @param {string} miningRewardAddress - Address to receive mining reward
     * @returns {Object} Mined block
     */
    async mineBlock(miningRewardAddress) {
        try {
            const startTime = Date.now();
            
            // Create mining reward transaction
            const rewardTransaction = {
                type: 'MINING_REWARD',
                from: null,
                to: miningRewardAddress,
                amount: this.miningReward,
                data: {
                    blockIndex: this.chain.length,
                    miningReward: this.miningReward
                },
                hash: '',
                signature: '',
                timestamp: new Date().toISOString()
            };

            rewardTransaction.hash = this.calculateTransactionHash(rewardTransaction);
            this.pendingTransactions.push(rewardTransaction);

            // Create new block
            const block = {
                index: this.chain.length,
                timestamp: new Date().toISOString(),
                transactions: [...this.pendingTransactions],
                previousHash: this.getLatestBlock().hash,
                nonce: 0,
                hash: '',
                merkleRoot: '',
                difficulty: this.difficulty,
                blockTime: 0,
                pharmaceuticalData: {
                    complianceMode: this.complianceMode,
                    auditTrail: true,
                    digitalSignatures: this.digitalSignatureRequired,
                    batchCount: this.pendingTransactions.filter(tx => 
                        tx.type === 'BATCH_CREATE' || tx.type === 'BATCH_UPDATE'
                    ).length,
                    documentCount: this.pendingTransactions.filter(tx => 
                        tx.type === 'DOCUMENT_UPLOAD' || tx.type === 'DOCUMENT_UPDATE'
                    ).length
                }
            };

            // Calculate merkle root
            block.merkleRoot = this.calculateMerkleRoot(block.transactions);

            // Mine the block (Proof of Work)
            block.hash = await this.proofOfWork(block);
            
            // Calculate block time
            block.blockTime = Date.now() - startTime;

            // Add block to chain
            this.chain.push(block);
            this.pendingTransactions = [];
            
            // Save block to database
            await this.saveBlock(block);

            // Adjust difficulty based on block time
            this.adjustDifficulty();

            logger.info(`Block mined: ${block.hash} (${block.nonce} nonce)`);
            
            return block;
        } catch (error) {
            logger.error('Block mining failed:', error);
            throw new Error(`Block mining failed: ${error.message}`);
        }
    }

    /**
     * Proof of Work algorithm
     * @param {Object} block - Block to mine
     * @returns {Promise<string>} Block hash
     */
    async proofOfWork(block) {
        const target = '0'.repeat(this.difficulty);
        
        while (true) {
            block.nonce++;
            const hash = this.calculateBlockHash(block);
            
            if (hash.startsWith(target)) {
                return hash;
            }
            
            // Check if mining should stop
            if (this.isMining === false) {
                throw new Error('Mining stopped');
            }
        }
    }

    /**
     * Adjust mining difficulty based on block time
     */
    adjustDifficulty() {
        if (this.chain.length < 2) return;

        const latestBlock = this.chain[this.chain.length - 1];
        const previousBlock = this.chain[this.chain.length - 2];
        
        const timeDifference = new Date(latestBlock.timestamp) - new Date(previousBlock.timestamp);
        
        // If block time is too fast, increase difficulty
        if (timeDifference < this.blockTime / 2) {
            this.difficulty++;
        }
        // If block time is too slow, decrease difficulty
        else if (timeDifference > this.blockTime * 2) {
            this.difficulty = Math.max(1, this.difficulty - 1);
        }
    }

    /**
     * Start automatic mining
     * @param {string} miningRewardAddress - Address to receive mining rewards
     */
    startMining(miningRewardAddress) {
        if (this.isMining) {
            logger.warn('Mining already in progress');
            return;
        }

        this.isMining = true;
        logger.info('Starting automatic mining...');

        this.miningInterval = setInterval(async () => {
            try {
                if (this.pendingTransactions.length > 0) {
                    await this.mineBlock(miningRewardAddress);
                }
            } catch (error) {
                logger.error('Mining error:', error);
            }
        }, this.blockTime);
    }

    /**
     * Stop automatic mining
     */
    stopMining() {
        if (this.miningInterval) {
            clearInterval(this.miningInterval);
            this.miningInterval = null;
        }
        this.isMining = false;
        logger.info('Mining stopped');
    }

    /**
     * Get the latest block
     * @returns {Object} Latest block
     */
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    /**
     * Get blockchain statistics
     * @returns {Object} Blockchain statistics
     */
    getStats() {
        const totalTransactions = this.chain.reduce((sum, block) => sum + block.transactions.length, 0);
        const totalMiningRewards = this.chain.reduce((sum, block) => {
            return sum + block.transactions.filter(tx => tx.type === 'MINING_REWARD').length * this.miningReward;
        }, 0);

        const pharmaceuticalStats = {
            batchTransactions: this.chain.reduce((sum, block) => {
                return sum + block.transactions.filter(tx => 
                    tx.type === 'BATCH_CREATE' || tx.type === 'BATCH_UPDATE'
                ).length;
            }, 0),
            documentTransactions: this.chain.reduce((sum, block) => {
                return sum + block.transactions.filter(tx => 
                    tx.type === 'DOCUMENT_UPLOAD' || tx.type === 'DOCUMENT_UPDATE'
                ).length;
            }, 0),
            complianceViolations: this.chain.reduce((sum, block) => {
                return sum + block.transactions.filter(tx => 
                    !tx.pharmaceuticalData?.regulatoryCompliance?.fda21CFR11
                ).length;
            }, 0)
        };

        return {
            chainLength: this.chain.length,
            totalTransactions,
            pendingTransactions: this.pendingTransactions.length,
            difficulty: this.difficulty,
            miningReward: this.miningReward,
            totalMiningRewards,
            isMining: this.isMining,
            complianceMode: this.complianceMode,
            pharmaceuticalStats,
            averageBlockTime: this.calculateAverageBlockTime(),
            lastBlockTime: this.chain.length > 0 ? this.getLatestBlock().blockTime : 0
        };
    }

    /**
     * Calculate average block time
     * @returns {number} Average block time in milliseconds
     */
    calculateAverageBlockTime() {
        if (this.chain.length < 2) return 0;

        let totalTime = 0;
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];
            const timeDiff = new Date(currentBlock.timestamp) - new Date(previousBlock.timestamp);
            totalTime += timeDiff;
        }

        return totalTime / (this.chain.length - 1);
    }

    /**
     * Validate the entire blockchain
     * @returns {boolean} Validation result
     */
    validateChain() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            // Check if current block hash is valid
            if (currentBlock.hash !== this.calculateBlockHash(currentBlock)) {
                return false;
            }

            // Check if current block points to previous block
            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }

            // Validate all transactions in the block
            for (const transaction of currentBlock.transactions) {
                if (!this.validateTransaction(transaction)) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Save block to database
     * @param {Object} block - Block to save
     */
    async saveBlock(block) {
        try {
            await this.database.put(`block:${block.index}`, block);
            await this.database.put('latestBlock', block.index);
            logger.debug(`Block ${block.index} saved to database`);
        } catch (error) {
            logger.error('Failed to save block to database:', error);
        }
    }

    /**
     * Load blockchain from database
     */
    async loadFromDatabase() {
        try {
            const latestBlockIndex = await this.database.get('latestBlock');
            
            for (let i = 0; i <= latestBlockIndex; i++) {
                const block = await this.database.get(`block:${i}`);
                this.chain.push(block);
            }
            
            logger.info(`Loaded ${this.chain.length} blocks from database`);
        } catch (error) {
            logger.warn('No existing blockchain data found, starting fresh');
        }
    }

    /**
     * Get block by index
     * @param {number} index - Block index
     * @returns {Object} Block object
     */
    getBlock(index) {
        return this.chain[index] || null;
    }

    /**
     * Get block by hash
     * @param {string} hash - Block hash
     * @returns {Object} Block object
     */
    getBlockByHash(hash) {
        return this.chain.find(block => block.hash === hash) || null;
    }

    /**
     * Get transaction by hash
     * @param {string} hash - Transaction hash
     * @returns {Object} Transaction object
     */
    getTransaction(hash) {
        for (const block of this.chain) {
            const transaction = block.transactions.find(tx => tx.hash === hash);
            if (transaction) {
                return transaction;
            }
        }
        return null;
    }

    /**
     * Get transactions by address
     * @param {string} address - Wallet address
     * @returns {Array} Array of transactions
     */
    getTransactionsByAddress(address) {
        const transactions = [];
        
        for (const block of this.chain) {
            for (const transaction of block.transactions) {
                if (transaction.from === address || transaction.to === address) {
                    transactions.push(transaction);
                }
            }
        }
        
        return transactions;
    }

    /**
     * Get pharmaceutical batch history
     * @param {string} batchId - Batch ID
     * @returns {Array} Array of batch-related transactions
     */
    getBatchHistory(batchId) {
        const transactions = [];
        
        for (const block of this.chain) {
            for (const transaction of block.transactions) {
                if (transaction.data?.batchId === batchId) {
                    transactions.push(transaction);
                }
            }
        }
        
        return transactions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }
}

module.exports = Blockchain;