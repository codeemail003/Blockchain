const CryptoUtils = require('./crypto');
const Transaction = require('./transaction');

class Block {
    /**
     * Create a new block
     * @param {number} index - Block index
     * @param {Array} transactions - Array of transactions
     * @param {string} previousHash - Hash of previous block
     * @param {number} difficulty - Mining difficulty
     */
    constructor(index, transactions, previousHash, difficulty = 4) {
        this.index = index;
        this.timestamp = Date.now();
        this.transactions = transactions || [];
        this.previousHash = previousHash;
        this.nonce = 0;
        this.hash = null;
        this.merkleRoot = null;
        this.difficulty = difficulty;
        this.miningTime = 0;

        // Calculate merkle root
        this.calculateMerkleRoot();
    }

    /**
     * Calculate Merkle root of transactions
     */
    calculateMerkleRoot() {
        if (this.transactions.length === 0) {
            this.merkleRoot = CryptoUtils.sha256('empty');
            return;
        }

        // Get transaction hashes
        const transactionHashes = this.transactions.map(tx => 
            typeof tx === 'string' ? tx : tx.getHash()
        );

        // Build Merkle tree
        this.merkleRoot = this.buildMerkleTree(transactionHashes);
    }

    /**
     * Build Merkle tree from transaction hashes
     * @param {Array} hashes - Array of transaction hashes
     * @returns {string} Merkle root
     */
    buildMerkleTree(hashes) {
        if (hashes.length === 1) {
            return hashes[0];
        }

        const newHashes = [];
        for (let i = 0; i < hashes.length; i += 2) {
            const left = hashes[i];
            const right = i + 1 < hashes.length ? hashes[i + 1] : left;
            const combined = left + right;
            newHashes.push(CryptoUtils.sha256(combined));
        }

        return this.buildMerkleTree(newHashes);
    }

    /**
     * Calculate block hash
     * @returns {string} Block hash
     */
    calculateHash() {
        const data = JSON.stringify({
            index: this.index,
            timestamp: this.timestamp,
            transactions: this.transactions.map(tx => 
                typeof tx === 'string' ? tx : tx.getHash()
            ),
            previousHash: this.previousHash,
            nonce: this.nonce,
            merkleRoot: this.merkleRoot,
            difficulty: this.difficulty
        });
        return CryptoUtils.doubleSha256(data);
    }

    /**
     * Mine the block (Proof of Work)
     * @param {number} maxAttempts - Maximum mining attempts
     * @returns {boolean} True if block was successfully mined
     */
    mine(maxAttempts = 1000000) {
        const startTime = Date.now();
        const target = '0'.repeat(this.difficulty);

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            this.nonce = CryptoUtils.generateNonce();
            this.hash = this.calculateHash();

            if (this.hash.startsWith(target)) {
                this.miningTime = Date.now() - startTime;
                return true;
            }
        }

        return false;
    }

    /**
     * Verify block hash
     * @returns {boolean} True if hash is valid
     */
    verifyHash() {
        const calculatedHash = this.calculateHash();
        return calculatedHash === this.hash;
    }

    /**
     * Verify Proof of Work
     * @returns {boolean} True if PoW is valid
     */
    verifyProofOfWork() {
        if (!this.hash) return false;
        const target = '0'.repeat(this.difficulty);
        return this.hash.startsWith(target);
    }

    /**
     * Verify all transactions in the block
     * @returns {boolean} True if all transactions are valid
     */
    verifyTransactions() {
        return this.transactions.every(tx => {
            if (typeof tx === 'string') return true; // Already verified hash
            
            // System transactions (mining rewards) don't need signatures
            if (tx.from === '0x0000000000000000000000000000000000000000') {
                return tx.amount > 0 && tx.to && tx.timestamp > 0;
            }
            
            return tx.isValid();
        });
    }

    /**
     * Add transaction to block
     * @param {Transaction} transaction - Transaction to add
     */
    addTransaction(transaction) {
        if (transaction.isValid()) {
            this.transactions.push(transaction);
            this.calculateMerkleRoot();
            return true;
        }
        return false;
    }

    /**
     * Get block size in bytes
     * @returns {number} Block size
     */
    getSize() {
        return Buffer.byteLength(JSON.stringify(this.toJSON()), 'utf8');
    }

    /**
     * Convert block to JSON
     * @returns {Object} Block as JSON object
     */
    toJSON() {
        return {
            index: this.index,
            timestamp: this.timestamp,
            transactions: this.transactions.map(tx => 
                typeof tx === 'string' ? tx : tx.toJSON()
            ),
            previousHash: this.previousHash,
            nonce: this.nonce,
            hash: this.hash,
            merkleRoot: this.merkleRoot,
            difficulty: this.difficulty,
            miningTime: this.miningTime
        };
    }

    /**
     * Create block from JSON
     * @param {Object} json - Block JSON object
     * @returns {Block} Block instance
     */
    static fromJSON(json) {
        const block = new Block(
            json.index,
            json.transactions.map(tx => 
                typeof tx === 'string' ? tx : Transaction.fromJSON(tx)
            ),
            json.previousHash,
            json.difficulty
        );
        
        block.timestamp = json.timestamp;
        block.nonce = json.nonce;
        block.hash = json.hash;
        block.merkleRoot = json.merkleRoot;
        block.miningTime = json.miningTime;
        
        return block;
    }

    /**
     * Create genesis block
     * @returns {Block} Genesis block
     */
    static createGenesisBlock() {
        const genesisBlock = new Block(0, [], '0'.repeat(64), 4);
        genesisBlock.timestamp = 1640995200000; // Fixed timestamp for genesis
        genesisBlock.hash = genesisBlock.calculateHash();
        return genesisBlock;
    }

    /**
     * Validate block structure
     * @returns {boolean} True if block is valid
     */
    isValid() {
        if (!this.verifyHash()) {
            console.log('Block hash verification failed');
            return false;
        }
        if (!this.verifyProofOfWork()) {
            console.log('Block proof of work verification failed');
            return false;
        }
        if (!this.verifyTransactions()) {
            console.log('Block transactions verification failed');
            return false;
        }
        if (this.index < 0) {
            console.log('Block index is negative');
            return false;
        }
        if (this.timestamp <= 0) {
            console.log('Block timestamp is invalid');
            return false;
        }
        return true;
    }
}

module.exports = Block;