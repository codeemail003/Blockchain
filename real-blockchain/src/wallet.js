const CryptoUtils = require('./crypto');
const Transaction = require('./transaction');
const fs = require('fs');
const path = require('path');

class Wallet {
    /**
     * Create a new wallet
     * @param {string} walletPath - Path to store wallet data
     */
    constructor(walletPath = './wallet') {
        this.walletPath = walletPath;
        this.privateKey = null;
        this.publicKey = null;
        this.address = null;
        
        // Create wallet directory if it doesn't exist
        if (!fs.existsSync(this.walletPath)) {
            fs.mkdirSync(this.walletPath, { recursive: true });
        }
        
        // Try to load existing wallet
        this.loadWallet();
    }

    /**
     * Generate a new wallet
     * @returns {Object} Wallet information
     */
    generateWallet() {
        const keyPair = CryptoUtils.generateKeyPair();
        
        this.privateKey = keyPair.privateKey;
        this.publicKey = keyPair.publicKey;
        this.address = keyPair.address;
        
        // Save wallet
        this.saveWallet();
        
        return {
            address: this.address,
            publicKey: this.publicKey,
            privateKey: this.privateKey
        };
    }

    /**
     * Import wallet from private key
     * @param {string} privateKey - Private key to import
     * @returns {Object} Wallet information
     */
    importWallet(privateKey) {
        if (!CryptoUtils.isValidPrivateKey(privateKey)) {
            throw new Error('Invalid private key');
        }

        const keyPair = require('elliptic').ec('secp256k1').keyFromPrivate(privateKey, 'hex');
        
        this.privateKey = privateKey;
        this.publicKey = keyPair.getPublic('hex');
        this.address = CryptoUtils.generateAddress(this.publicKey);
        
        // Save wallet
        this.saveWallet();
        
        return {
            address: this.address,
            publicKey: this.publicKey,
            privateKey: this.privateKey
        };
    }

    /**
     * Create a new transaction
     * @param {string} to - Recipient address
     * @param {number} amount - Amount to send
     * @param {number} fee - Transaction fee
     * @returns {Transaction} New transaction
     */
    createTransaction(to, amount, fee = 0.001) {
        if (!this.privateKey) {
            throw new Error('Wallet not initialized. Generate or import a wallet first.');
        }

        if (!CryptoUtils.isValidAddress(to)) {
            throw new Error('Invalid recipient address');
        }

        if (amount <= 0) {
            throw new Error('Amount must be greater than 0');
        }

        if (fee < 0) {
            throw new Error('Fee cannot be negative');
        }

        return new Transaction(this.address, to, amount, this.privateKey, fee);
    }

    /**
     * Sign a message with private key
     * @param {string} message - Message to sign
     * @returns {string} Signature
     */
    signMessage(message) {
        if (!this.privateKey) {
            throw new Error('Wallet not initialized');
        }

        return CryptoUtils.sign(message, this.privateKey);
    }

    /**
     * Verify a message signature
     * @param {string} message - Original message
     * @param {string} signature - Signature to verify
     * @param {string} publicKey - Public key
     * @returns {boolean} True if signature is valid
     */
    verifyMessage(message, signature, publicKey) {
        return CryptoUtils.verify(message, signature, publicKey);
    }

    /**
     * Get wallet information
     * @returns {Object} Wallet information
     */
    getWalletInfo() {
        if (!this.address) {
            return null;
        }

        return {
            address: this.address,
            publicKey: this.publicKey,
            hasPrivateKey: !!this.privateKey
        };
    }

    /**
     * Export wallet to file
     * @param {string} filename - Filename to export to
     */
    exportWallet(filename = 'wallet-backup.json') {
        if (!this.privateKey) {
            throw new Error('No wallet to export');
        }

        const walletData = {
            privateKey: this.privateKey,
            publicKey: this.publicKey,
            address: this.address,
            exportedAt: new Date().toISOString()
        };

        const filePath = path.join(this.walletPath, filename);
        fs.writeFileSync(filePath, JSON.stringify(walletData, null, 2));
        
        console.log(`💾 Wallet exported to: ${filePath}`);
        return filePath;
    }

    /**
     * Import wallet from file
     * @param {string} filename - Filename to import from
     */
    importWalletFromFile(filename = 'wallet-backup.json') {
        const filePath = path.join(this.walletPath, filename);
        
        if (!fs.existsSync(filePath)) {
            throw new Error(`Wallet file not found: ${filePath}`);
        }

        const walletData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        if (!walletData.privateKey) {
            throw new Error('Invalid wallet file: missing private key');
        }

        return this.importWallet(walletData.privateKey);
    }

    /**
     * Save wallet to disk
     */
    saveWallet() {
        if (!this.address) return;

        const walletData = {
            address: this.address,
            publicKey: this.publicKey,
            privateKey: this.privateKey,
            savedAt: new Date().toISOString()
        };

        const filePath = path.join(this.walletPath, 'wallet.json');
        fs.writeFileSync(filePath, JSON.stringify(walletData, null, 2));
    }

    /**
     * Load wallet from disk
     */
    loadWallet() {
        const filePath = path.join(this.walletPath, 'wallet.json');
        
        if (fs.existsSync(filePath)) {
            try {
                const walletData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                this.address = walletData.address;
                this.publicKey = walletData.publicKey;
                this.privateKey = walletData.privateKey;
                
                console.log(`📚 Wallet loaded: ${this.address}`);
            } catch (error) {
                console.error('Error loading wallet:', error);
            }
        }
    }

    /**
     * Delete wallet from disk
     */
    deleteWallet() {
        const filePath = path.join(this.walletPath, 'wallet.json');
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('🗑️  Wallet deleted from disk');
        }

        this.privateKey = null;
        this.publicKey = null;
        this.address = null;
    }

    /**
     * Check if wallet is initialized
     * @returns {boolean} True if wallet is initialized
     */
    isInitialized() {
        return !!this.address;
    }

    /**
     * Get wallet address
     * @returns {string} Wallet address
     */
    getAddress() {
        return this.address;
    }

    /**
     * Get public key
     * @returns {string} Public key
     */
    getPublicKey() {
        return this.publicKey;
    }

    /**
     * Check if wallet has private key
     * @returns {boolean} True if private key is available
     */
    hasPrivateKey() {
        return !!this.privateKey;
    }
}

module.exports = Wallet;