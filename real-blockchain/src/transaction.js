const CryptoUtils = require('./crypto');
const { v4: uuidv4 } = require('uuid');

class Transaction {
    /**
     * Create a new transaction
     * @param {string} from - Sender address
     * @param {string} to - Receiver address
     * @param {number} amount - Amount to transfer
     * @param {string} privateKey - Sender's private key for signing
     * @param {number} fee - Transaction fee
     */
    constructor(from, to, amount, privateKey, fee = 0.001) {
        this.id = uuidv4();
        this.from = from;
        this.to = to;
        this.amount = amount;
        this.fee = fee;
        this.timestamp = Date.now();
        this.signature = null;
        this.publicKey = null;

        // Sign the transaction if private key is provided
        if (privateKey) {
            this.sign(privateKey);
        }
    }

    /**
     * Sign the transaction with private key
     * @param {string} privateKey - Private key to sign with
     */
    sign(privateKey) {
        if (!CryptoUtils.isValidPrivateKey(privateKey)) {
            throw new Error('Invalid private key');
        }

        // Create transaction data to sign (excluding signature and publicKey)
        const transactionData = this.getTransactionData();
        this.signature = CryptoUtils.sign(transactionData, privateKey);
        
        // Get public key from private key
        const keyPair = require('elliptic').ec('secp256k1').keyFromPrivate(privateKey, 'hex');
        this.publicKey = keyPair.getPublic('hex');
    }

    /**
     * Verify transaction signature
     * @returns {boolean} True if signature is valid
     */
    verify() {
        if (!this.signature || !this.publicKey) {
            return false;
        }

        // Validate addresses
        if (!CryptoUtils.isValidAddress(this.from) || !CryptoUtils.isValidAddress(this.to)) {
            return false;
        }

        // Validate amount
        if (this.amount <= 0 || this.fee < 0) {
            return false;
        }

        // Verify signature
        const transactionData = this.getTransactionData();
        return CryptoUtils.verify(transactionData, this.signature, this.publicKey);
    }

    /**
     * Get transaction data for signing/verification
     * @returns {string} Transaction data string
     */
    getTransactionData() {
        return JSON.stringify({
            id: this.id,
            from: this.from,
            to: this.to,
            amount: this.amount,
            fee: this.fee,
            timestamp: this.timestamp
        });
    }

    /**
     * Calculate transaction hash
     * @returns {string} Transaction hash
     */
    getHash() {
        const data = JSON.stringify({
            id: this.id,
            from: this.from,
            to: this.to,
            amount: this.amount,
            fee: this.fee,
            timestamp: this.timestamp,
            signature: this.signature,
            publicKey: this.publicKey
        });
        return CryptoUtils.doubleSha256(data);
    }

    /**
     * Convert transaction to JSON
     * @returns {Object} Transaction as JSON object
     */
    toJSON() {
        return {
            id: this.id,
            from: this.from,
            to: this.to,
            amount: this.amount,
            fee: this.fee,
            timestamp: this.timestamp,
            signature: this.signature,
            publicKey: this.publicKey,
            hash: this.getHash()
        };
    }

    /**
     * Create transaction from JSON
     * @param {Object} json - Transaction JSON object
     * @returns {Transaction} Transaction instance
     */
    static fromJSON(json) {
        const transaction = new Transaction(json.from, json.to, json.amount);
        transaction.id = json.id;
        transaction.fee = json.fee;
        transaction.timestamp = json.timestamp;
        transaction.signature = json.signature;
        transaction.publicKey = json.publicKey;
        return transaction;
    }

    /**
     * Validate transaction structure
     * @returns {boolean} True if transaction is valid
     */
    isValid() {
        // System transactions (mining rewards) don't need signatures
        if (this.from === '0x0000000000000000000000000000000000000000') {
            return this.amount > 0 && 
                   this.fee >= 0 &&
                   this.to &&
                   this.timestamp > 0;
        }
        
        return this.verify() && 
               this.amount > 0 && 
               this.fee >= 0 &&
               this.from !== this.to;
    }
}

module.exports = Transaction;