const Block = require('./block');
const Transaction = require('./transaction');
const CryptoUtils = require('./crypto');
const { Level } = require('level');

class Blockchain {
    /**
     * Initialize blockchain
     * @param {string} dbPath - Database path for persistence
     */
    constructor(dbPath = './blockchain-db') {
        this.chain = [];
        this.pendingTransactions = [];
        this.difficulty = 4;
        this.miningReward = 50;
        this.blockSize = 1000; // Maximum transactions per block
        this.db = null;
        this.dbPath = dbPath;
        
        // Initialize database
        this.initDatabase();
    }

    /**
     * Initialize LevelDB for persistence
     */
    async initDatabase() {
        try {
            this.db = new Level(this.dbPath);
            await this.loadChain();
        } catch (error) {
            console.log('Creating new blockchain...');
            this.db = new Level(this.dbPath);
            this.createGenesisBlock();
        }
    }

    /**
     * Create genesis block
     */
    createGenesisBlock() {
        const genesisBlock = Block.createGenesisBlock();
        this.chain.push(genesisBlock);
        this.saveChain();
    }

    /**
     * Get the latest block
     * @returns {Block} Latest block
     */
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    /**
     * Add a new transaction to pending transactions
     * @param {Transaction} transaction - Transaction to add
     * @returns {boolean} True if transaction was added
     */
    addTransaction(transaction) {
        if (!transaction.isValid()) {
            throw new Error('Invalid transaction');
        }

        // Check if sender has sufficient balance
        const senderBalance = this.getBalance(transaction.from);
        if (senderBalance < transaction.amount + transaction.fee) {
            throw new Error('Insufficient balance');
        }

        // Check for double spending
        const pendingSpent = this.pendingTransactions
            .filter(tx => tx.from === transaction.from)
            .reduce((sum, tx) => sum + tx.amount + tx.fee, 0);

        if (senderBalance < pendingSpent + transaction.amount + transaction.fee) {
            throw new Error('Double spending detected');
        }

        this.pendingTransactions.push(transaction);
        return true;
    }

    /**
     * Mine pending transactions
     * @param {string} minerAddress - Address to receive mining reward
     * @returns {Block} Mined block
     */
    minePendingTransactions(minerAddress) {
        // Create mining reward transaction
        const rewardTransaction = new Transaction(
            '0x0000000000000000000000000000000000000000', // System address
            minerAddress,
            this.miningReward,
            null, // No private key needed for system transaction
            0
        );

        // Add reward transaction to pending transactions
        this.pendingTransactions.push(rewardTransaction);

        // Create new block
        const previousHash = this.chain.length > 0 ? this.getLatestBlock().hash : '0';
        const block = new Block(
            this.chain.length,
            this.pendingTransactions.slice(0, this.blockSize),
            previousHash,
            this.difficulty
        );

        // Mine the block
        console.log('⛏️  Mining block...');
        const startTime = Date.now();
        const success = block.mine();
        const miningTime = Date.now() - startTime;

        if (success) {
            console.log(`✅ Block mined in ${miningTime}ms! Hash: ${block.hash}`);
            
            // Add block to chain
            this.addBlock(block);
            
            // Remove mined transactions from pending
            this.pendingTransactions = this.pendingTransactions.slice(this.blockSize);
            
            return block;
        } else {
            console.log('❌ Mining failed');
            return null;
        }
    }

    /**
     * Add a new block to the chain
     * @param {Block} block - Block to add
     * @returns {boolean} True if block was added
     */
    addBlock(block) {
        if (!this.isValidNewBlock(block)) {
            throw new Error('Invalid block');
        }

        this.chain.push(block);
        this.saveChain();
        return true;
    }

    /**
     * Validate a new block
     * @param {Block} block - Block to validate
     * @returns {boolean} True if block is valid
     */
    isValidNewBlock(block) {
        const previousBlock = this.getLatestBlock();

        // For genesis block (first block)
        if (block.index === 0) {
            if (block.previousHash !== '0') {
                console.log('Genesis block must have previous hash of "0"');
                return false;
            }
        } else {
            // Check block index
            if (block.index !== previousBlock.index + 1) {
                console.log(`Block index mismatch: expected ${previousBlock.index + 1}, got ${block.index}`);
                return false;
            }

            // Check previous hash
            if (block.previousHash !== previousBlock.hash) {
                console.log(`Previous hash mismatch: expected ${previousBlock.hash}, got ${block.previousHash}`);
                return false;
            }
        }

        // Check block validity
        if (!block.isValid()) {
            console.log('Block validation failed');
            return false;
        }

        return true;
    }

    /**
     * Validate the entire blockchain
     * @returns {boolean} True if blockchain is valid
     */
    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            // Check block validity
            if (!currentBlock.isValid()) {
                return false;
            }

            // Check chain continuity
            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }

            // Check block index
            if (currentBlock.index !== previousBlock.index + 1) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get balance of an address
     * @param {string} address - Address to check
     * @returns {number} Balance
     */
    getBalance(address) {
        let balance = 0;

        // Check all blocks for transactions
        for (const block of this.chain) {
            for (const transaction of block.transactions) {
                if (transaction.from === address) {
                    balance -= transaction.amount + transaction.fee;
                }
                if (transaction.to === address) {
                    balance += transaction.amount;
                }
            }
        }

        // Check pending transactions
        for (const transaction of this.pendingTransactions) {
            if (transaction.from === address) {
                balance -= transaction.amount + transaction.fee;
            }
            if (transaction.to === address) {
                balance += transaction.amount;
            }
        }

        return balance;
    }

    /**
     * Get transaction history for an address
     * @param {string} address - Address to check
     * @returns {Array} Transaction history
     */
    getTransactionHistory(address) {
        const history = [];

        for (const block of this.chain) {
            for (const transaction of block.transactions) {
                if (transaction.from === address || transaction.to === address) {
                    history.push({
                        ...transaction.toJSON(),
                        blockIndex: block.index,
                        blockHash: block.hash,
                        confirmed: true
                    });
                }
            }
        }

        // Add pending transactions
        for (const transaction of this.pendingTransactions) {
            if (transaction.from === address || transaction.to === address) {
                history.push({
                    ...transaction.toJSON(),
                    confirmed: false
                });
            }
        }

        return history.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Get blockchain statistics
     * @returns {Object} Blockchain statistics
     */
    getStats() {
        const totalTransactions = this.chain.reduce((sum, block) => 
            sum + block.transactions.length, 0
        );

        const totalMiningTime = this.chain.reduce((sum, block) => 
            sum + (block.miningTime || 0), 0
        );

        return {
            totalBlocks: this.chain.length,
            totalTransactions,
            pendingTransactions: this.pendingTransactions.length,
            difficulty: this.difficulty,
            miningReward: this.miningReward,
            averageMiningTime: totalMiningTime / this.chain.length,
            chainSize: this.chain.reduce((sum, block) => sum + block.getSize(), 0)
        };
    }

    /**
     * Save blockchain to database
     */
    async saveChain() {
        try {
            await this.db.put('chain', JSON.stringify(this.chain.map(block => block.toJSON())));
            await this.db.put('pending', JSON.stringify(this.pendingTransactions.map(tx => tx.toJSON())));
        } catch (error) {
            console.error('Error saving blockchain:', error);
        }
    }

    /**
     * Load blockchain from database
     */
    async loadChain() {
        try {
            const chainData = await this.db.get('chain');
            const pendingData = await this.db.get('pending');

            this.chain = JSON.parse(chainData).map(blockData => Block.fromJSON(blockData));
            this.pendingTransactions = JSON.parse(pendingData).map(txData => Transaction.fromJSON(txData));

            console.log(`📚 Loaded blockchain with ${this.chain.length} blocks`);
        } catch (error) {
            console.error('Error loading blockchain:', error);
            throw error;
        }
    }

    /**
     * Get blockchain as JSON
     * @returns {Object} Blockchain as JSON
     */
    toJSON() {
        return {
            chain: this.chain.map(block => block.toJSON()),
            pendingTransactions: this.pendingTransactions.map(tx => tx.toJSON()),
            difficulty: this.difficulty,
            miningReward: this.miningReward,
            stats: this.getStats()
        };
    }
}

module.exports = Blockchain;