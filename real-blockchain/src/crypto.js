const crypto = require('crypto');
const EC = require('elliptic').ec;

// Initialize elliptic curve cryptography (secp256k1 - same as Bitcoin)
const ec = new EC('secp256k1');

class CryptoUtils {
    /**
     * Generate a new key pair
     * @returns {Object} { privateKey, publicKey, address }
     */
    static generateKeyPair() {
        const keyPair = ec.genKeyPair();
        const privateKey = keyPair.getPrivate('hex');
        const publicKey = keyPair.getPublic('hex');
        const address = this.generateAddress(publicKey);
        
        return {
            privateKey,
            publicKey,
            address
        };
    }

    /**
     * Generate address from public key
     * @param {string} publicKey - The public key
     * @returns {string} The generated address
     */
    static generateAddress(publicKey) {
        const hash = crypto.createHash('sha256').update(publicKey).digest('hex');
        const ripemd160 = crypto.createHash('ripemd160').update(hash).digest('hex');
        return `0x${ripemd160}`;
    }

    /**
     * Sign data with private key
     * @param {string} data - Data to sign
     * @param {string} privateKey - Private key in hex format
     * @returns {string} Signature in hex format
     */
    static sign(data, privateKey) {
        const keyPair = ec.keyFromPrivate(privateKey, 'hex');
        const hash = crypto.createHash('sha256').update(data).digest('hex');
        const signature = keyPair.sign(hash);
        return signature.toDER('hex');
    }

    /**
     * Verify signature
     * @param {string} data - Original data
     * @param {string} signature - Signature to verify
     * @param {string} publicKey - Public key in hex format
     * @returns {boolean} True if signature is valid
     */
    static verify(data, signature, publicKey) {
        try {
            const keyPair = ec.keyFromPublic(publicKey, 'hex');
            const hash = crypto.createHash('sha256').update(data).digest('hex');
            return keyPair.verify(hash, signature);
        } catch (error) {
            return false;
        }
    }

    /**
     * Create SHA256 hash
     * @param {string} data - Data to hash
     * @returns {string} Hash in hex format
     */
    static sha256(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Create double SHA256 hash (like Bitcoin)
     * @param {string} data - Data to hash
     * @returns {string} Double hash in hex format
     */
    static doubleSha256(data) {
        const firstHash = crypto.createHash('sha256').update(data).digest('hex');
        return crypto.createHash('sha256').update(firstHash).digest('hex');
    }

    /**
     * Generate random nonce
     * @returns {number} Random nonce
     */
    static generateNonce() {
        return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    }

    /**
     * Validate address format
     * @param {string} address - Address to validate
     * @returns {boolean} True if address is valid
     */
    static isValidAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    /**
     * Validate private key format
     * @param {string} privateKey - Private key to validate
     * @returns {boolean} True if private key is valid
     */
    static isValidPrivateKey(privateKey) {
        try {
            ec.keyFromPrivate(privateKey, 'hex');
            return true;
        } catch (error) {
            return false;
        }
    }
}

module.exports = CryptoUtils;