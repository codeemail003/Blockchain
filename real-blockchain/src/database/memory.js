/**
 * @fileoverview In-memory database fallback for pharmaceutical blockchain
 * Used when Supabase is not available
 */

const logger = require('../logger');

class MemoryDatabase {
    constructor() {
        this.batches = new Map();
        this.transactions = new Map();
        this.temperatureHistory = new Map();
        this.alerts = new Map();
        this.stakeholders = new Map();
        this.blocks = new Map();
        this.initialized = true;
        logger.info('Memory database initialized (Supabase fallback)');
    }

    /**
     * Initialize database connection
     */
    async initialize() {
        this.initialized = true;
        logger.info('Memory database initialized successfully');
        return true;
    }

    /**
     * Save pharmaceutical batch to database
     */
    async saveBatch(batchData) {
        try {
            const batch = {
                id: batchData.id,
                batch_id: batchData.id,
                medicine_info: batchData.medicineInfo,
                quantity: batchData.quantity,
                expiration_date: batchData.expirationDate,
                manufacturing_location: batchData.manufacturingLocation,
                initial_temperature: batchData.initialTemperature,
                initial_humidity: batchData.initialHumidity,
                current_stakeholder: batchData.currentStakeholder,
                status: batchData.status || 'manufactured',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            this.batches.set(batchData.id, batch);
            logger.info(`Batch ${batchData.id} saved to memory database`);
            return batch;
        } catch (error) {
            logger.error('Failed to save batch:', error);
            throw error;
        }
    }

    /**
     * Get batch by ID
     */
    async getBatch(batchId) {
        try {
            return this.batches.get(batchId) || null;
        } catch (error) {
            logger.error('Failed to get batch:', error);
            throw error;
        }
    }

    /**
     * Update batch status
     */
    async updateBatchStatus(batchId, status, stakeholder = null) {
        try {
            const batch = this.batches.get(batchId);
            if (!batch) {
                throw new Error('Batch not found');
            }
            
            batch.status = status;
            batch.updated_at = new Date().toISOString();
            
            if (stakeholder) {
                batch.current_stakeholder = stakeholder;
            }
            
            this.batches.set(batchId, batch);
            logger.info(`Batch ${batchId} status updated to ${status}`);
            return batch;
        } catch (error) {
            logger.error('Failed to update batch status:', error);
            throw error;
        }
    }

    /**
     * Save batch transaction
     */
    async saveTransaction(transactionData) {
        try {
            const transaction = {
                id: transactionData.hash,
                batch_id: transactionData.batchId,
                transaction_hash: transactionData.hash,
                from_address: transactionData.from,
                to_address: transactionData.to,
                action: transactionData.action,
                stakeholder: transactionData.stakeholder,
                location: transactionData.location,
                sensor_data: transactionData.sensorData,
                signature: transactionData.signature,
                public_key: transactionData.publicKey,
                timestamp: new Date(transactionData.timestamp).toISOString(),
                block_index: transactionData.blockIndex,
                created_at: new Date().toISOString()
            };
            
            this.transactions.set(transactionData.hash, transaction);
            logger.info(`Transaction ${transactionData.hash} saved to memory database`);
            return transaction;
        } catch (error) {
            logger.error('Failed to save transaction:', error);
            throw error;
        }
    }

    /**
     * Get batch transaction history
     */
    async getBatchHistory(batchId) {
        try {
            const history = Array.from(this.transactions.values())
                .filter(tx => tx.batch_id === batchId)
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            return history;
        } catch (error) {
            logger.error('Failed to get batch history:', error);
            throw error;
        }
    }

    /**
     * Save temperature data
     */
    async saveTemperatureData(temperatureData) {
        try {
            const tempRecord = {
                id: `${temperatureData.batchId}_${Date.now()}`,
                batch_id: temperatureData.batchId,
                sensor_id: temperatureData.sensorId,
                temperature: temperatureData.temperature,
                humidity: temperatureData.humidity,
                light_level: temperatureData.light,
                tampering: temperatureData.tampering || false,
                gps_location: temperatureData.gps,
                timestamp: new Date(temperatureData.timestamp || Date.now()).toISOString(),
                created_at: new Date().toISOString()
            };
            
            this.temperatureHistory.set(tempRecord.id, tempRecord);
            logger.info(`Temperature data for batch ${temperatureData.batchId} saved`);
            return tempRecord;
        } catch (error) {
            logger.error('Failed to save temperature data:', error);
            throw error;
        }
    }

    /**
     * Get temperature history for batch
     */
    async getTemperatureHistory(batchId, hours = 24) {
        try {
            const startTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
            
            const history = Array.from(this.temperatureHistory.values())
                .filter(record => record.batch_id === batchId)
                .filter(record => new Date(record.timestamp) >= startTime)
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            return history;
        } catch (error) {
            logger.error('Failed to get temperature history:', error);
            throw error;
        }
    }

    /**
     * Save alert
     */
    async saveAlert(alertData) {
        try {
            const alert = {
                id: alertData.id,
                alert_id: alertData.id,
                batch_id: alertData.batchId,
                type: alertData.type,
                severity: alertData.severity,
                message: alertData.message,
                data: alertData.data,
                status: alertData.status || 'active',
                created_at: new Date().toISOString()
            };
            
            this.alerts.set(alertData.id, alert);
            logger.info(`Alert ${alertData.id} saved to memory database`);
            return alert;
        } catch (error) {
            logger.error('Failed to save alert:', error);
            throw error;
        }
    }

    /**
     * Get alerts with filters
     */
    async getAlerts(filters = {}) {
        try {
            let alerts = Array.from(this.alerts.values());
            
            if (filters.severity) {
                alerts = alerts.filter(alert => alert.severity === filters.severity);
            }
            if (filters.type) {
                alerts = alerts.filter(alert => alert.type === filters.type);
            }
            if (filters.batchId) {
                alerts = alerts.filter(alert => alert.batch_id === filters.batchId);
            }
            if (filters.status) {
                alerts = alerts.filter(alert => alert.status === filters.status);
            }
            
            return alerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } catch (error) {
            logger.error('Failed to get alerts:', error);
            throw error;
        }
    }

    /**
     * Update alert status
     */
    async updateAlertStatus(alertId, status, updatedBy, notes = null) {
        try {
            const alert = this.alerts.get(alertId);
            if (!alert) {
                throw new Error('Alert not found');
            }
            
            alert.status = status;
            alert.updated_at = new Date().toISOString();
            
            if (status === 'acknowledged') {
                alert.acknowledged_by = updatedBy;
                alert.acknowledged_at = new Date().toISOString();
            } else if (status === 'resolved') {
                alert.resolved_by = updatedBy;
                alert.resolved_at = new Date().toISOString();
            }
            
            if (notes) {
                alert.notes = notes;
            }
            
            this.alerts.set(alertId, alert);
            logger.info(`Alert ${alertId} status updated to ${status}`);
            return alert;
        } catch (error) {
            logger.error('Failed to update alert status:', error);
            throw error;
        }
    }

    /**
     * Save stakeholder
     */
    async saveStakeholder(stakeholderData) {
        try {
            const stakeholder = {
                id: stakeholderData.id,
                stakeholder_id: stakeholderData.id,
                name: stakeholderData.name,
                type: stakeholderData.type,
                address: stakeholderData.address,
                contact_info: stakeholderData.contactInfo,
                certifications: stakeholderData.certifications,
                status: stakeholderData.status || 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            this.stakeholders.set(stakeholderData.id, stakeholder);
            logger.info(`Stakeholder ${stakeholderData.id} saved to memory database`);
            return stakeholder;
        } catch (error) {
            logger.error('Failed to save stakeholder:', error);
            throw error;
        }
    }

    /**
     * Get stakeholder by ID
     */
    async getStakeholder(stakeholderId) {
        try {
            return this.stakeholders.get(stakeholderId) || null;
        } catch (error) {
            logger.error('Failed to get stakeholder:', error);
            throw error;
        }
    }

    /**
     * Save blockchain block
     */
    async saveBlock(blockData) {
        try {
            const block = {
                id: blockData.hash,
                block_index: blockData.index,
                block_hash: blockData.hash,
                previous_hash: blockData.previousHash,
                timestamp: new Date(blockData.timestamp).toISOString(),
                nonce: blockData.nonce,
                difficulty: blockData.difficulty,
                merkle_root: blockData.merkleRoot,
                transaction_count: blockData.transactions.length,
                block_data: blockData,
                created_at: new Date().toISOString()
            };
            
            this.blocks.set(blockData.hash, block);
            logger.info(`Block ${blockData.index} saved to memory database`);
            return block;
        } catch (error) {
            logger.error('Failed to save block:', error);
            throw error;
        }
    }

    /**
     * Get blockchain statistics
     */
    async getBlockchainStats() {
        try {
            const blocks = Array.from(this.blocks.values());
            const batches = Array.from(this.batches.values());
            const alerts = Array.from(this.alerts.values());
            
            const latestBlock = blocks.sort((a, b) => b.block_index - a.block_index)[0] || null;
            
            const batchStats = batches.reduce((acc, batch) => {
                acc[batch.status] = (acc[batch.status] || 0) + 1;
                return acc;
            }, {});

            const alertStats = alerts.reduce((acc, alert) => {
                acc[alert.severity] = (acc[alert.severity] || 0) + 1;
                acc[alert.status] = (acc[alert.status] || 0) + 1;
                return acc;
            }, {});

            return {
                latestBlock: latestBlock || null,
                totalBatches: batches.length,
                batchStatus: batchStats,
                totalAlerts: alerts.length,
                alertStats: alertStats
            };
        } catch (error) {
            logger.error('Failed to get blockchain stats:', error);
            throw error;
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            return {
                status: 'healthy',
                database: 'memory',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                database: 'memory',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = MemoryDatabase;