const PharmaceuticalTransaction = require('./transaction');
const AlertSystem = require('./alerts');

class IoTIntegration {
    constructor(blockchain, alertSystem) {
        this.blockchain = blockchain;
        this.alertSystem = alertSystem;
        this.sensorThresholds = {
            temperature: {
                vaccine: { min: 2, max: 8, critical: { min: 1, max: 9 } },
                insulin: { min: 2, max: 8, critical: { min: 1, max: 9 } },
                antibiotic: { min: 15, max: 25, critical: { min: 10, max: 30 } },
                tablet: { min: 15, max: 30, critical: { min: 10, max: 35 } },
                default: { min: 2, max: 25, critical: { min: 1, max: 30 } }
            },
            humidity: {
                min: 30,
                max: 70,
                critical: { min: 20, max: 80 }
            },
            light: {
                max: 1000, // lux
                critical: 2000
            }
        };
        this.activeSensors = new Map(); // Track active sensors by batchId
    }

    /**
     * Register a new IoT sensor for a batch
     * @param {string} batchId - Medicine batch identifier
     * @param {Object} sensorConfig - Sensor configuration
     */
    registerSensor(batchId, sensorConfig) {
        this.activeSensors.set(batchId, {
            ...sensorConfig,
            lastReading: null,
            alerts: [],
            isActive: true
        });
        console.log(`📡 IoT sensor registered for batch ${batchId}`);
    }

    /**
     * Receive sensor data and process it
     * @param {Object} sensorData - Sensor data from IoT device
     * @returns {Object} Processing result
     */
    async processSensorData(sensorData) {
        const {
            batchId,
            temperature,
            humidity,
            light,
            tampering,
            gps,
            timestamp,
            sensorId
        } = sensorData;

        try {
            // Validate sensor data
            this.validateSensorData(sensorData);

            // Get current batch information
            const batchInfo = await this.getBatchInfo(batchId);
            if (!batchInfo) {
                throw new Error(`Batch ${batchId} not found`);
            }

            // Check for threshold violations
            const violations = this.checkThresholdViolations(batchInfo, sensorData);
            
            // Create transaction with sensor data
            const transaction = await this.createSensorTransaction(batchInfo, sensorData);

            // Process alerts if violations detected
            if (violations.length > 0) {
                await this.processViolations(batchId, violations, sensorData);
            }

            // Update sensor status
            this.updateSensorStatus(batchId, sensorData);

            return {
                success: true,
                transactionId: transaction.id,
                violations: violations,
                message: 'Sensor data processed successfully'
            };

        } catch (error) {
            console.error('Error processing sensor data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Validate incoming sensor data
     * @param {Object} sensorData - Sensor data to validate
     */
    validateSensorData(sensorData) {
        if (!sensorData.batchId) {
            throw new Error('Batch ID is required');
        }

        if (!sensorData.sensorId) {
            throw new Error('Sensor ID is required');
        }

        if (sensorData.temperature !== undefined && (sensorData.temperature < -50 || sensorData.temperature > 100)) {
            throw new Error('Temperature reading out of valid range (-50°C to 100°C)');
        }

        if (sensorData.humidity !== undefined && (sensorData.humidity < 0 || sensorData.humidity > 100)) {
            throw new Error('Humidity reading out of valid range (0% to 100%)');
        }

        if (sensorData.light !== undefined && sensorData.light < 0) {
            throw new Error('Light reading cannot be negative');
        }

        if (sensorData.gps && (!sensorData.gps.lat || !sensorData.gps.lon)) {
            throw new Error('GPS coordinates must include latitude and longitude');
        }
    }

    /**
     * Check for threshold violations
     * @param {Object} batchInfo - Batch information
     * @param {Object} sensorData - Sensor data
     * @returns {Array} Array of violations
     */
    checkThresholdViolations(batchInfo, sensorData) {
        const violations = [];
        const medicineType = batchInfo.medicineInfo.type || 'default';
        const thresholds = this.sensorThresholds;

        // Check temperature
        if (sensorData.temperature !== undefined) {
            const tempThresholds = thresholds.temperature[medicineType] || thresholds.temperature.default;
            
            if (sensorData.temperature < tempThresholds.min || sensorData.temperature > tempThresholds.max) {
                violations.push({
                    type: 'temperature',
                    severity: this.getTemperatureSeverity(sensorData.temperature, tempThresholds),
                    value: sensorData.temperature,
                    threshold: tempThresholds,
                    message: `Temperature ${sensorData.temperature}°C is outside acceptable range (${tempThresholds.min}-${tempThresholds.max}°C)`
                });
            }
        }

        // Check humidity
        if (sensorData.humidity !== undefined) {
            const humidityThresholds = thresholds.humidity;
            
            if (sensorData.humidity < humidityThresholds.min || sensorData.humidity > humidityThresholds.max) {
                violations.push({
                    type: 'humidity',
                    severity: this.getHumiditySeverity(sensorData.humidity, humidityThresholds),
                    value: sensorData.humidity,
                    threshold: humidityThresholds,
                    message: `Humidity ${sensorData.humidity}% is outside acceptable range (${humidityThresholds.min}-${humidityThresholds.max}%)`
                });
            }
        }

        // Check light exposure
        if (sensorData.light !== undefined && sensorData.light > thresholds.light.max) {
            violations.push({
                type: 'light',
                severity: sensorData.light > thresholds.light.critical ? 'critical' : 'warning',
                value: sensorData.light,
                threshold: thresholds.light,
                message: `Light exposure ${sensorData.light} lux exceeds maximum (${thresholds.light.max} lux)`
            });
        }

        // Check tampering
        if (sensorData.tampering === true) {
            violations.push({
                type: 'tampering',
                severity: 'critical',
                value: true,
                message: 'Tampering detected on medicine container'
            });
        }

        return violations;
    }

    /**
     * Get temperature severity level
     * @param {number} temperature - Current temperature
     * @param {Object} thresholds - Temperature thresholds
     * @returns {string} Severity level
     */
    getTemperatureSeverity(temperature, thresholds) {
        if (temperature < thresholds.critical.min || temperature > thresholds.critical.max) {
            return 'critical';
        }
        return 'warning';
    }

    /**
     * Get humidity severity level
     * @param {number} humidity - Current humidity
     * @param {Object} thresholds - Humidity thresholds
     * @returns {string} Severity level
     */
    getHumiditySeverity(humidity, thresholds) {
        if (humidity < thresholds.critical.min || humidity > thresholds.critical.max) {
            return 'critical';
        }
        return 'warning';
    }

    /**
     * Create transaction with sensor data
     * @param {Object} batchInfo - Batch information
     * @param {Object} sensorData - Sensor data
     * @returns {PharmaceuticalTransaction} Created transaction
     */
    async createSensorTransaction(batchInfo, sensorData) {
        // Get current stakeholder (from last transaction)
        const lastTransaction = await this.getLastTransaction(sensorData.batchId);
        const currentStakeholder = lastTransaction ? lastTransaction.stakeholder : batchInfo.manufacturer;

        // Create location data
        const location = {
            lat: sensorData.gps?.lat || 0,
            lon: sensorData.gps?.lon || 0,
            facility: currentStakeholder,
            timestamp: sensorData.timestamp || Date.now()
        };

        // Create sensor data object
        const processedSensorData = {
            temperature: sensorData.temperature,
            humidity: sensorData.humidity,
            light: sensorData.light,
            tampering: sensorData.tampering || false,
            timestamp: sensorData.timestamp || Date.now(),
            sensorId: sensorData.sensorId
        };

        // Create transaction
        const transaction = new PharmaceuticalTransaction(
            currentStakeholder, // from
            currentStakeholder, // to (same stakeholder for sensor updates)
            sensorData.batchId,
            batchInfo.medicineInfo,
            'monitored', // action for sensor updates
            currentStakeholder,
            location,
            processedSensorData,
            null, // No private key for IoT transactions
            0 // No fee for sensor updates
        );

        // Add to blockchain
        this.blockchain.addTransaction(transaction);

        return transaction;
    }

    /**
     * Process threshold violations and create alerts
     * @param {string} batchId - Batch identifier
     * @param {Array} violations - Array of violations
     * @param {Object} sensorData - Original sensor data
     */
    async processViolations(batchId, violations, sensorData) {
        for (const violation of violations) {
            // Create alert
            const alert = {
                id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                batchId: batchId,
                type: violation.type,
                severity: violation.severity,
                message: violation.message,
                value: violation.value,
                threshold: violation.threshold,
                timestamp: Date.now(),
                sensorId: sensorData.sensorId,
                location: sensorData.gps
            };

            // Add to alert system
            this.alertSystem.addAlert(alert);

            // Log violation
            console.log(`🚨 ${violation.severity.toUpperCase()} ALERT: ${violation.message} for batch ${batchId}`);
        }
    }

    /**
     * Update sensor status
     * @param {string} batchId - Batch identifier
     * @param {Object} sensorData - Sensor data
     */
    updateSensorStatus(batchId, sensorData) {
        const sensor = this.activeSensors.get(batchId);
        if (sensor) {
            sensor.lastReading = {
                timestamp: sensorData.timestamp || Date.now(),
                temperature: sensorData.temperature,
                humidity: sensorData.humidity,
                light: sensorData.light,
                tampering: sensorData.tampering
            };
        }
    }

    /**
     * Get batch information
     * @param {string} batchId - Batch identifier
     * @returns {Object} Batch information
     */
    async getBatchInfo(batchId) {
        // This would typically query the blockchain for batch information
        // For now, return a mock batch info
        return {
            batchId: batchId,
            medicineInfo: {
                name: 'COVID-19 Vaccine',
                manufacturer: 'PharmaCorpA',
                type: 'vaccine',
                dosage: '0.3ml',
                expiration: '2024-12-31'
            },
            manufacturer: 'manufacturer_pharmacorpa'
        };
    }

    /**
     * Get last transaction for a batch
     * @param {string} batchId - Batch identifier
     * @returns {Object} Last transaction
     */
    async getLastTransaction(batchId) {
        // This would query the blockchain for the last transaction of this batch
        // For now, return null
        return null;
    }

    /**
     * Get active sensors
     * @returns {Map} Active sensors
     */
    getActiveSensors() {
        return this.activeSensors;
    }

    /**
     * Get sensor status for a batch
     * @param {string} batchId - Batch identifier
     * @returns {Object} Sensor status
     */
    getSensorStatus(batchId) {
        return this.activeSensors.get(batchId);
    }

    /**
     * Deactivate sensor for a batch
     * @param {string} batchId - Batch identifier
     */
    deactivateSensor(batchId) {
        const sensor = this.activeSensors.get(batchId);
        if (sensor) {
            sensor.isActive = false;
            console.log(`📡 IoT sensor deactivated for batch ${batchId}`);
        }
    }

    /**
     * Get temperature history for a batch
     * @param {string} batchId - Batch identifier
     * @param {number} hours - Number of hours to look back
     * @returns {Array} Temperature history
     */
    async getTemperatureHistory(batchId, hours = 24) {
        // This would query the blockchain for temperature history
        // For now, return mock data
        const history = [];
        const now = Date.now();
        const interval = hours * 60 * 60 * 1000 / 24; // 24 data points

        for (let i = 0; i < 24; i++) {
            history.push({
                timestamp: now - (i * interval),
                temperature: 4 + Math.random() * 2, // Random temperature between 4-6°C
                humidity: 45 + Math.random() * 10 // Random humidity between 45-55%
            });
        }

        return history.reverse();
    }
}

module.exports = IoTIntegration;