const PharmaceuticalTransaction = require('./transaction');
const AlertSystem = require('./alerts');

class SupplyChain {
    constructor(blockchain, alertSystem) {
        this.blockchain = blockchain;
        this.alertSystem = alertSystem;
        this.batches = new Map(); // Track batch information
        this.stakeholders = new Map(); // Track authorized stakeholders
        this.supplyChainRules = {
            // Define valid supply chain flows
            flows: {
                'vaccine': ['manufacturer', 'distributor', 'pharmacy', 'hospital', 'clinic'],
                'antibiotic': ['manufacturer', 'distributor', 'pharmacy', 'hospital'],
                'insulin': ['manufacturer', 'distributor', 'pharmacy', 'hospital'],
                'tablet': ['manufacturer', 'distributor', 'pharmacy']
            },
            // Temperature requirements by medicine type
            temperatureRequirements: {
                'vaccine': { min: 2, max: 8, critical: { min: 1, max: 9 } },
                'insulin': { min: 2, max: 8, critical: { min: 1, max: 9 } },
                'antibiotic': { min: 15, max: 25, critical: { min: 10, max: 30 } },
                'tablet': { min: 15, max: 30, critical: { min: 10, max: 35 } }
            },
            // Maximum transit times (in hours)
            transitTimes: {
                'vaccine': 48, // 48 hours for vaccines
                'insulin': 48, // 48 hours for insulin
                'antibiotic': 72, // 72 hours for antibiotics
                'tablet': 120 // 120 hours for tablets
            }
        };
    }

    /**
     * Create a new medicine batch
     * @param {Object} batchInfo - Batch information
     * @param {string} manufacturerAddress - Manufacturer's wallet address
     * @param {string} privateKey - Manufacturer's private key
     * @returns {Object} Created batch information
     */
    createBatch(batchInfo, manufacturerAddress, privateKey) {
        const batchId = this.generateBatchId(batchInfo);
        
        // Validate batch information
        this.validateBatchInfo(batchInfo);
        
        // Create batch record
        const batch = {
            id: batchId,
            ...batchInfo,
            manufacturer: manufacturerAddress,
            createdAt: Date.now(),
            status: 'produced',
            currentStakeholder: 'manufacturer',
            location: batchInfo.manufacturingLocation || { lat: 0, lon: 0, facility: 'Manufacturing Facility' },
            temperatureHistory: [],
            custodyChain: [],
            alerts: []
        };
        
        // Store batch information
        this.batches.set(batchId, batch);
        
        // Create initial transaction
        const transaction = new PharmaceuticalTransaction(
            manufacturerAddress,
            manufacturerAddress,
            batchId,
            batchInfo.medicineInfo,
            'produced',
            'manufacturer',
            batch.location,
            {
                temperature: batchInfo.initialTemperature || 4.0,
                humidity: batchInfo.initialHumidity || 45,
                light: 0,
                tampering: false,
                timestamp: Date.now()
            },
            privateKey,
            0
        );
        
        // Add to blockchain
        this.blockchain.addTransaction(transaction);
        
        // Add to custody chain
        batch.custodyChain.push({
            action: 'produced',
            stakeholder: 'manufacturer',
            timestamp: Date.now(),
            transactionId: transaction.id,
            location: batch.location
        });
        
        console.log(`🏭 Batch ${batchId} created successfully`);
        
        return {
            batchId: batchId,
            batch: batch,
            transaction: transaction
        };
    }

    /**
     * Transfer custody of a batch
     * @param {string} batchId - Batch identifier
     * @param {string} fromStakeholder - Current stakeholder
     * @param {string} toStakeholder - New stakeholder
     * @param {Object} transferInfo - Transfer information
     * @param {string} privateKey - Current stakeholder's private key
     * @returns {Object} Transfer result
     */
    transferCustody(batchId, fromStakeholder, toStakeholder, transferInfo, privateKey) {
        const batch = this.batches.get(batchId);
        
        if (!batch) {
            throw new Error(`Batch ${batchId} not found`);
        }
        
        // Validate custody transfer
        this.validateCustodyTransfer(batch, fromStakeholder, toStakeholder, transferInfo);
        
        // Check temperature compliance
        const temperatureCompliance = this.checkTemperatureCompliance(batch, transferInfo.sensorData);
        if (!temperatureCompliance.compliant) {
            // Create temperature alert
            this.alertSystem.addAlert({
                id: `temp_alert_${Date.now()}`,
                batchId: batchId,
                type: 'temperature',
                severity: temperatureCompliance.severity,
                message: `Temperature ${transferInfo.sensorData.temperature}°C outside acceptable range during transfer`,
                value: transferInfo.sensorData.temperature,
                timestamp: Date.now()
            });
        }
        
        // Create transfer transaction
        const transaction = new PharmaceuticalTransaction(
            fromStakeholder,
            toStakeholder,
            batchId,
            batch.medicineInfo,
            transferInfo.action || 'shipped',
            toStakeholder,
            transferInfo.location,
            transferInfo.sensorData,
            privateKey,
            0
        );
        
        // Add to blockchain
        this.blockchain.addTransaction(transaction);
        
        // Update batch status
        batch.currentStakeholder = toStakeholder;
        batch.status = transferInfo.action || 'shipped';
        batch.location = transferInfo.location;
        
        // Add to custody chain
        batch.custodyChain.push({
            action: transferInfo.action || 'shipped',
            fromStakeholder: fromStakeholder,
            toStakeholder: toStakeholder,
            timestamp: Date.now(),
            transactionId: transaction.id,
            location: transferInfo.location,
            temperature: transferInfo.sensorData.temperature,
            humidity: transferInfo.sensorData.humidity
        });
        
        // Update temperature history
        if (transferInfo.sensorData.temperature) {
            batch.temperatureHistory.push({
                timestamp: Date.now(),
                temperature: transferInfo.sensorData.temperature,
                location: transferInfo.location,
                stakeholder: toStakeholder
            });
        }
        
        console.log(`📦 Batch ${batchId} transferred from ${fromStakeholder} to ${toStakeholder}`);
        
        return {
            success: true,
            transaction: transaction,
            temperatureCompliance: temperatureCompliance
        };
    }

    /**
     * Validate batch information
     * @param {Object} batchInfo - Batch information to validate
     */
    validateBatchInfo(batchInfo) {
        if (!batchInfo.medicineInfo) {
            throw new Error('Medicine information is required');
        }
        
        if (!batchInfo.medicineInfo.name || !batchInfo.medicineInfo.manufacturer) {
            throw new Error('Medicine name and manufacturer are required');
        }
        
        if (!batchInfo.medicineInfo.type) {
            throw new Error('Medicine type is required');
        }
        
        if (!batchInfo.quantity || batchInfo.quantity <= 0) {
            throw new Error('Valid quantity is required');
        }
        
        if (!batchInfo.expirationDate) {
            throw new Error('Expiration date is required');
        }
        
        // Check if expiration date is in the future
        const expirationDate = new Date(batchInfo.expirationDate);
        if (expirationDate <= new Date()) {
            throw new Error('Expiration date must be in the future');
        }
    }

    /**
     * Validate custody transfer
     * @param {Object} batch - Batch information
     * @param {string} fromStakeholder - Current stakeholder
     * @param {string} toStakeholder - New stakeholder
     * @param {Object} transferInfo - Transfer information
     */
    validateCustodyTransfer(batch, fromStakeholder, toStakeholder, transferInfo) {
        // Check if current stakeholder matches
        if (batch.currentStakeholder !== fromStakeholder) {
            throw new Error(`Current stakeholder is ${batch.currentStakeholder}, not ${fromStakeholder}`);
        }
        
        // Check if transfer is allowed in supply chain flow
        const medicineType = batch.medicineInfo.type;
        const allowedFlow = this.supplyChainRules.flows[medicineType];
        
        if (!allowedFlow) {
            throw new Error(`No supply chain flow defined for medicine type: ${medicineType}`);
        }
        
        const fromIndex = allowedFlow.indexOf(fromStakeholder);
        const toIndex = allowedFlow.indexOf(toStakeholder);
        
        if (fromIndex === -1 || toIndex === -1) {
            throw new Error(`Invalid stakeholder in supply chain flow`);
        }
        
        if (toIndex <= fromIndex) {
            throw new Error(`Cannot transfer to ${toStakeholder} from ${fromStakeholder} in supply chain flow`);
        }
        
        // Check if stakeholders are authorized
        if (!this.isStakeholderAuthorized(fromStakeholder, batch.id)) {
            throw new Error(`${fromStakeholder} is not authorized for batch ${batch.id}`);
        }
        
        if (!this.isStakeholderAuthorized(toStakeholder, batch.id)) {
            throw new Error(`${toStakeholder} is not authorized for batch ${batch.id}`);
        }
    }

    /**
     * Check temperature compliance
     * @param {Object} batch - Batch information
     * @param {Object} sensorData - Sensor data
     * @returns {Object} Compliance result
     */
    checkTemperatureCompliance(batch, sensorData) {
        const medicineType = batch.medicineInfo.type;
        const requirements = this.supplyChainRules.temperatureRequirements[medicineType];
        
        if (!requirements || !sensorData.temperature) {
            return { compliant: true, severity: 'normal' };
        }
        
        const temp = sensorData.temperature;
        
        if (temp >= requirements.min && temp <= requirements.max) {
            return { compliant: true, severity: 'normal' };
        } else if (temp >= requirements.critical.min && temp <= requirements.critical.max) {
            return { compliant: false, severity: 'warning' };
        } else {
            return { compliant: false, severity: 'critical' };
        }
    }

    /**
     * Generate batch ID
     * @param {Object} batchInfo - Batch information
     * @returns {string} Generated batch ID
     */
    generateBatchId(batchInfo) {
        const timestamp = Date.now();
        const medicineCode = batchInfo.medicineInfo.name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
        const manufacturerCode = batchInfo.medicineInfo.manufacturer.replace(/\s+/g, '').substring(0, 3).toUpperCase();
        const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase();
        
        return `BATCH_${medicineCode}_${manufacturerCode}_${timestamp}_${randomSuffix}`;
    }

    /**
     * Get batch information
     * @param {string} batchId - Batch identifier
     * @returns {Object} Batch information
     */
    getBatch(batchId) {
        return this.batches.get(batchId);
    }

    /**
     * Get all batches
     * @returns {Array} Array of all batches
     */
    getAllBatches() {
        return Array.from(this.batches.values());
    }

    /**
     * Get batch history
     * @param {string} batchId - Batch identifier
     * @returns {Array} Batch history
     */
    getBatchHistory(batchId) {
        const batch = this.batches.get(batchId);
        if (!batch) {
            throw new Error(`Batch ${batchId} not found`);
        }
        
        return batch.custodyChain;
    }

    /**
     * Get temperature history for a batch
     * @param {string} batchId - Batch identifier
     * @returns {Array} Temperature history
     */
    getBatchTemperatureHistory(batchId) {
        const batch = this.batches.get(batchId);
        if (!batch) {
            throw new Error(`Batch ${batchId} not found`);
        }
        
        return batch.temperatureHistory;
    }

    /**
     * Verify batch authenticity
     * @param {string} batchId - Batch identifier
     * @returns {Object} Verification result
     */
    verifyBatchAuthenticity(batchId) {
        const batch = this.batches.get(batchId);
        
        if (!batch) {
            return {
                authentic: false,
                reason: 'Batch not found in system'
            };
        }
        
        // Check if batch has valid custody chain
        if (batch.custodyChain.length === 0) {
            return {
                authentic: false,
                reason: 'No custody chain found'
            };
        }
        
        // Check if batch is expired
        const expirationDate = new Date(batch.expirationDate);
        if (expirationDate <= new Date()) {
            return {
                authentic: false,
                reason: 'Batch has expired',
                expirationDate: batch.expirationDate
            };
        }
        
        // Check for temperature violations
        const temperatureViolations = batch.temperatureHistory.filter(reading => {
            const requirements = this.supplyChainRules.temperatureRequirements[batch.medicineInfo.type];
            if (!requirements) return false;
            
            return reading.temperature < requirements.min || reading.temperature > requirements.max;
        });
        
        if (temperatureViolations.length > 0) {
            return {
                authentic: true,
                compromised: true,
                reason: 'Temperature violations detected',
                violations: temperatureViolations
            };
        }
        
        return {
            authentic: true,
            compromised: false,
            reason: 'Batch is authentic and properly stored'
        };
    }

    /**
     * Register a stakeholder
     * @param {string} stakeholderId - Stakeholder identifier
     * @param {Object} stakeholderInfo - Stakeholder information
     */
    registerStakeholder(stakeholderId, stakeholderInfo) {
        this.stakeholders.set(stakeholderId, {
            id: stakeholderId,
            ...stakeholderInfo,
            registeredAt: Date.now(),
            authorizedBatches: new Set()
        });
        
        console.log(`👤 Stakeholder ${stakeholderId} registered`);
    }

    /**
     * Authorize stakeholder for a batch
     * @param {string} stakeholderId - Stakeholder identifier
     * @param {string} batchId - Batch identifier
     */
    authorizeStakeholder(stakeholderId, batchId) {
        const stakeholder = this.stakeholders.get(stakeholderId);
        if (!stakeholder) {
            throw new Error(`Stakeholder ${stakeholderId} not found`);
        }
        
        stakeholder.authorizedBatches.add(batchId);
        console.log(`✅ Stakeholder ${stakeholderId} authorized for batch ${batchId}`);
    }

    /**
     * Check if stakeholder is authorized for a batch
     * @param {string} stakeholderId - Stakeholder identifier
     * @param {string} batchId - Batch identifier
     * @returns {boolean} True if authorized
     */
    isStakeholderAuthorized(stakeholderId, batchId) {
        const stakeholder = this.stakeholders.get(stakeholderId);
        if (!stakeholder) {
            return false;
        }
        
        return stakeholder.authorizedBatches.has(batchId);
    }

    /**
     * Get supply chain statistics
     * @returns {Object} Supply chain statistics
     */
    getSupplyChainStats() {
        const batches = Array.from(this.batches.values());
        
        const stats = {
            totalBatches: batches.length,
            byStatus: {},
            byMedicineType: {},
            byStakeholder: {},
            temperatureViolations: 0,
            expiredBatches: 0
        };
        
        batches.forEach(batch => {
            // Count by status
            stats.byStatus[batch.status] = (stats.byStatus[batch.status] || 0) + 1;
            
            // Count by medicine type
            const medicineType = batch.medicineInfo.type;
            stats.byMedicineType[medicineType] = (stats.byMedicineType[medicineType] || 0) + 1;
            
            // Count by current stakeholder
            stats.byStakeholder[batch.currentStakeholder] = (stats.byStakeholder[batch.currentStakeholder] || 0) + 1;
            
            // Check for temperature violations
            const hasTempViolations = batch.temperatureHistory.some(reading => {
                const requirements = this.supplyChainRules.temperatureRequirements[medicineType];
                if (!requirements) return false;
                return reading.temperature < requirements.min || reading.temperature > requirements.max;
            });
            
            if (hasTempViolations) {
                stats.temperatureViolations++;
            }
            
            // Check for expired batches
            const expirationDate = new Date(batch.expirationDate);
            if (expirationDate <= new Date()) {
                stats.expiredBatches++;
            }
        });
        
        return stats;
    }

    /**
     * Export batch data to CSV
     * @param {string} filePath - Output file path
     */
    exportBatchDataToCSV(filePath) {
        const batches = Array.from(this.batches.values());
        
        const csvHeader = 'Batch ID,Medicine Name,Manufacturer,Type,Status,Current Stakeholder,Quantity,Expiration Date,Created At\n';
        const csvRows = batches.map(batch => 
            `${batch.id},"${batch.medicineInfo.name}","${batch.medicineInfo.manufacturer}",${batch.medicineInfo.type},${batch.status},${batch.currentStakeholder},${batch.quantity},"${batch.expirationDate}",${new Date(batch.createdAt).toISOString()}`
        ).join('\n');
        
        const csvContent = csvHeader + csvRows;
        require('fs').writeFileSync(filePath, csvContent);
        
        console.log(`📊 Batch data exported to ${filePath}`);
    }
}

module.exports = SupplyChain;