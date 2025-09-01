const CryptoUtils = require('./crypto');
const { v4: uuidv4 } = require('uuid');

class PharmaceuticalTransaction {
    /**
     * Create a new pharmaceutical transaction
     * @param {string} from - Sender address (stakeholder)
     * @param {string} to - Receiver address (stakeholder)
     * @param {string} batchId - Medicine batch identifier
     * @param {Object} medicineInfo - Medicine information
     * @param {string} action - Supply chain action
     * @param {string} stakeholder - Current stakeholder
     * @param {Object} location - Location information
     * @param {Object} sensorData - IoT sensor data
     * @param {string} privateKey - Sender's private key for signing
     * @param {number} fee - Transaction fee
     */
    constructor(from, to, batchId, medicineInfo, action, stakeholder, location, sensorData, privateKey, fee = 0.001) {
        this.id = uuidv4();
        this.from = from;
        this.to = to;
        this.batchId = batchId;
        this.medicineInfo = medicineInfo;
        this.action = action;
        this.stakeholder = stakeholder;
        this.location = location;
        this.sensorData = sensorData;
        this.fee = fee;
        this.timestamp = Date.now();
        this.signature = null;
        this.publicKey = null;

        // Validate pharmaceutical-specific fields
        this.validatePharmaFields();

        // Sign the transaction if private key is provided
        if (privateKey) {
            this.sign(privateKey);
        }
    }

    /**
     * Validate pharmaceutical-specific transaction fields
     */
    validatePharmaFields() {
        if (!this.batchId || typeof this.batchId !== 'string') {
            throw new Error('Invalid batch ID');
        }

        if (!this.medicineInfo || typeof this.medicineInfo !== 'object') {
            throw new Error('Invalid medicine information');
        }

        if (!this.medicineInfo.name || !this.medicineInfo.manufacturer || !this.medicineInfo.expiration) {
            throw new Error('Medicine info must include name, manufacturer, and expiration');
        }

        if (!this.action || !['produced', 'shipped', 'received', 'dispensed', 'returned', 'destroyed'].includes(this.action)) {
            throw new Error('Invalid action. Must be: produced, shipped, received, dispensed, returned, or destroyed');
        }

        if (!this.stakeholder || typeof this.stakeholder !== 'string') {
            throw new Error('Invalid stakeholder');
        }

        if (!this.location || typeof this.location !== 'object') {
            throw new Error('Invalid location data');
        }

        if (!this.sensorData || typeof this.sensorData !== 'object') {
            throw new Error('Invalid sensor data');
        }

        // Validate temperature range for vaccines (2-8°C)
        if (this.medicineInfo.type === 'vaccine' && this.sensorData.temperature) {
            if (this.sensorData.temperature < 2 || this.sensorData.temperature > 8) {
                console.warn(`⚠️  Temperature alert: ${this.sensorData.temperature}°C for vaccine batch ${this.batchId}`);
            }
        }

        // Validate expiration date
        const expirationDate = new Date(this.medicineInfo.expiration);
        if (expirationDate <= new Date()) {
            throw new Error('Medicine has expired');
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

        // Validate pharmaceutical fields
        try {
            this.validatePharmaFields();
        } catch (error) {
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
            batchId: this.batchId,
            medicineInfo: this.medicineInfo,
            action: this.action,
            stakeholder: this.stakeholder,
            location: this.location,
            sensorData: this.sensorData,
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
            batchId: this.batchId,
            medicineInfo: this.medicineInfo,
            action: this.action,
            stakeholder: this.stakeholder,
            location: this.location,
            sensorData: this.sensorData,
            fee: this.fee,
            timestamp: this.timestamp,
            signature: this.signature,
            publicKey: this.publicKey
        });
        return CryptoUtils.doubleSha256(data);
    }

    /**
     * Check if temperature is within acceptable range
     * @returns {boolean} True if temperature is acceptable
     */
    isTemperatureAcceptable() {
        if (!this.sensorData.temperature) return true;

        const temp = this.sensorData.temperature;
        
        // Different temperature ranges for different medicine types
        switch (this.medicineInfo.type) {
            case 'vaccine':
                return temp >= 2 && temp <= 8;
            case 'insulin':
                return temp >= 2 && temp <= 8;
            case 'antibiotic':
                return temp >= 15 && temp <= 25;
            case 'tablet':
                return temp >= 15 && temp <= 30;
            default:
                return temp >= 2 && temp <= 25; // Default range
        }
    }

    /**
     * Check if medicine is expired
     * @returns {boolean} True if medicine is expired
     */
    isExpired() {
        const expirationDate = new Date(this.medicineInfo.expiration);
        return expirationDate <= new Date();
    }

    /**
     * Get temperature status
     * @returns {string} Temperature status (normal, warning, critical)
     */
    getTemperatureStatus() {
        if (!this.sensorData.temperature) return 'unknown';

        const temp = this.sensorData.temperature;
        
        switch (this.medicineInfo.type) {
            case 'vaccine':
                if (temp >= 2 && temp <= 8) return 'normal';
                if (temp >= 1 && temp <= 9) return 'warning';
                return 'critical';
            case 'insulin':
                if (temp >= 2 && temp <= 8) return 'normal';
                if (temp >= 1 && temp <= 9) return 'warning';
                return 'critical';
            default:
                if (temp >= 15 && temp <= 25) return 'normal';
                if (temp >= 10 && temp <= 30) return 'warning';
                return 'critical';
        }
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
            batchId: this.batchId,
            medicineInfo: this.medicineInfo,
            action: this.action,
            stakeholder: this.stakeholder,
            location: this.location,
            sensorData: this.sensorData,
            fee: this.fee,
            timestamp: this.timestamp,
            signature: this.signature,
            publicKey: this.publicKey,
            hash: this.getHash(),
            temperatureStatus: this.getTemperatureStatus(),
            isExpired: this.isExpired(),
            isTemperatureAcceptable: this.isTemperatureAcceptable()
        };
    }

    /**
     * Create transaction from JSON
     * @param {Object} json - Transaction JSON object
     * @returns {PharmaceuticalTransaction} Transaction instance
     */
    static fromJSON(json) {
        const transaction = new PharmaceuticalTransaction(
            json.from, 
            json.to, 
            json.batchId, 
            json.medicineInfo, 
            json.action, 
            json.stakeholder, 
            json.location, 
            json.sensorData
        );
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
            return this.batchId && 
                   this.medicineInfo &&
                   this.action &&
                   this.stakeholder &&
                   this.location &&
                   this.sensorData &&
                   this.fee >= 0 &&
                   this.to &&
                   this.timestamp > 0;
        }
        
        return this.verify() && 
               this.batchId && 
               this.medicineInfo &&
               this.action &&
               this.stakeholder &&
               this.location &&
               this.sensorData &&
               this.fee >= 0 &&
               this.from !== this.to;
    }

    /**
     * Get supply chain action description
     * @returns {string} Human-readable action description
     */
    getActionDescription() {
        const actionDescriptions = {
            'produced': 'Medicine batch produced at manufacturing facility',
            'shipped': 'Medicine batch shipped to next stakeholder',
            'received': 'Medicine batch received at destination',
            'dispensed': 'Medicine dispensed to patient',
            'returned': 'Medicine batch returned due to issues',
            'destroyed': 'Medicine batch destroyed (expired/contaminated)'
        };
        return actionDescriptions[this.action] || 'Unknown action';
    }

    /**
     * Get stakeholder type
     * @returns {string} Stakeholder type
     */
    getStakeholderType() {
        if (this.stakeholder.includes('manufacturer')) return 'Manufacturer';
        if (this.stakeholder.includes('distributor')) return 'Distributor';
        if (this.stakeholder.includes('pharmacy')) return 'Pharmacy';
        if (this.stakeholder.includes('hospital')) return 'Hospital';
        if (this.stakeholder.includes('clinic')) return 'Clinic';
        return 'Other';
    }
}

module.exports = PharmaceuticalTransaction;