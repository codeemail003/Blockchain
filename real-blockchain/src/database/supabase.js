/**
 * @fileoverview Supabase database integration for pharmaceutical blockchain
 * Handles all database operations for batches, transactions, and blockchain data
 */

const { createClient } = require('@supabase/supabase-js');
const logger = require('../logger');

class SupabaseDatabase {
    constructor() {
        this.supabaseUrl = process.env.SUPABASE_URL;
        this.supabaseKey = process.env.SUPABASE_ANON_KEY;
        
        if (!this.supabaseUrl || !this.supabaseKey) {
            throw new Error('Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
        }
        
        this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
        this.initialized = false;
    }

    /**
     * Initialize database connection and create tables if needed
     */
    async initialize() {
        try {
            // Test connection
            const { data, error } = await this.supabase
                .from('pharmaceutical_batches')
                .select('count')
                .limit(1);
            
            if (error && error.code !== 'PGRST116') { // Table doesn't exist error
                throw error;
            }
            
            this.initialized = true;
            logger.info('Supabase database initialized successfully');
            
            // Create tables if they don't exist
            await this.createTables();
            
        } catch (error) {
            logger.error('Failed to initialize Supabase database:', error);
            throw error;
        }
    }

    /**
     * Create database tables for pharmaceutical data
     */
    async createTables() {
        const tables = [
            {
                name: 'pharmaceutical_batches',
                schema: `
                    CREATE TABLE IF NOT EXISTS pharmaceutical_batches (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        batch_id VARCHAR(255) UNIQUE NOT NULL,
                        medicine_info JSONB NOT NULL,
                        quantity INTEGER NOT NULL,
                        expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
                        manufacturing_location JSONB NOT NULL,
                        initial_temperature DECIMAL(5,2) NOT NULL,
                        initial_humidity DECIMAL(5,2) NOT NULL,
                        current_stakeholder VARCHAR(255) NOT NULL,
                        status VARCHAR(50) NOT NULL DEFAULT 'manufactured',
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                `
            },
            {
                name: 'batch_transactions',
                schema: `
                    CREATE TABLE IF NOT EXISTS batch_transactions (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        batch_id VARCHAR(255) NOT NULL REFERENCES pharmaceutical_batches(batch_id),
                        transaction_hash VARCHAR(255) UNIQUE NOT NULL,
                        from_address VARCHAR(255) NOT NULL,
                        to_address VARCHAR(255) NOT NULL,
                        action VARCHAR(100) NOT NULL,
                        stakeholder VARCHAR(255) NOT NULL,
                        location JSONB NOT NULL,
                        sensor_data JSONB NOT NULL,
                        signature VARCHAR(255) NOT NULL,
                        public_key TEXT NOT NULL,
                        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        block_index INTEGER,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                `
            },
            {
                name: 'temperature_history',
                schema: `
                    CREATE TABLE IF NOT EXISTS temperature_history (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        batch_id VARCHAR(255) NOT NULL REFERENCES pharmaceutical_batches(batch_id),
                        sensor_id VARCHAR(255) NOT NULL,
                        temperature DECIMAL(5,2) NOT NULL,
                        humidity DECIMAL(5,2) NOT NULL,
                        light_level DECIMAL(8,2),
                        tampering BOOLEAN DEFAULT FALSE,
                        gps_location JSONB,
                        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                `
            },
            {
                name: 'alerts',
                schema: `
                    CREATE TABLE IF NOT EXISTS alerts (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        alert_id VARCHAR(255) UNIQUE NOT NULL,
                        batch_id VARCHAR(255) REFERENCES pharmaceutical_batches(batch_id),
                        type VARCHAR(100) NOT NULL,
                        severity VARCHAR(20) NOT NULL DEFAULT 'normal',
                        message TEXT NOT NULL,
                        data JSONB,
                        status VARCHAR(20) NOT NULL DEFAULT 'active',
                        acknowledged_by VARCHAR(255),
                        acknowledged_at TIMESTAMP WITH TIME ZONE,
                        resolved_by VARCHAR(255),
                        resolved_at TIMESTAMP WITH TIME ZONE,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                `
            },
            {
                name: 'stakeholders',
                schema: `
                    CREATE TABLE IF NOT EXISTS stakeholders (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        stakeholder_id VARCHAR(255) UNIQUE NOT NULL,
                        name VARCHAR(255) NOT NULL,
                        type VARCHAR(100) NOT NULL,
                        address VARCHAR(255) NOT NULL,
                        contact_info JSONB,
                        certifications JSONB,
                        status VARCHAR(20) NOT NULL DEFAULT 'active',
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                `
            },
            {
                name: 'blockchain_blocks',
                schema: `
                    CREATE TABLE IF NOT EXISTS blockchain_blocks (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        block_index INTEGER UNIQUE NOT NULL,
                        block_hash VARCHAR(255) UNIQUE NOT NULL,
                        previous_hash VARCHAR(255) NOT NULL,
                        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
                        nonce INTEGER NOT NULL,
                        difficulty INTEGER NOT NULL,
                        merkle_root VARCHAR(255) NOT NULL,
                        transaction_count INTEGER NOT NULL,
                        block_data JSONB NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                `
            }
        ];

        for (const table of tables) {
            try {
                const { error } = await this.supabase.rpc('exec_sql', { sql: table.schema });
                if (error) {
                    logger.warn(`Table ${table.name} might already exist:`, error.message);
                } else {
                    logger.info(`Created table: ${table.name}`);
                }
            } catch (error) {
                logger.warn(`Could not create table ${table.name}:`, error.message);
            }
        }
    }

    /**
     * Save pharmaceutical batch to database
     */
    async saveBatch(batchData) {
        try {
            const { data, error } = await this.supabase
                .from('pharmaceutical_batches')
                .insert([{
                    batch_id: batchData.id,
                    medicine_info: batchData.medicineInfo,
                    quantity: batchData.quantity,
                    expiration_date: batchData.expirationDate,
                    manufacturing_location: batchData.manufacturingLocation,
                    initial_temperature: batchData.initialTemperature,
                    initial_humidity: batchData.initialHumidity,
                    current_stakeholder: batchData.currentStakeholder,
                    status: batchData.status || 'manufactured'
                }])
                .select();

            if (error) throw error;
            
            logger.info(`Batch ${batchData.id} saved to database`);
            return data[0];
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
            const { data, error } = await this.supabase
                .from('pharmaceutical_batches')
                .select('*')
                .eq('batch_id', batchId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            if (error.code === 'PGRST116') {
                return null; // Not found
            }
            logger.error('Failed to get batch:', error);
            throw error;
        }
    }

    /**
     * Update batch status
     */
    async updateBatchStatus(batchId, status, stakeholder = null) {
        try {
            const updateData = { 
                status, 
                updated_at: new Date().toISOString() 
            };
            
            if (stakeholder) {
                updateData.current_stakeholder = stakeholder;
            }

            const { data, error } = await this.supabase
                .from('pharmaceutical_batches')
                .update(updateData)
                .eq('batch_id', batchId)
                .select();

            if (error) throw error;
            
            logger.info(`Batch ${batchId} status updated to ${status}`);
            return data[0];
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
            const { data, error } = await this.supabase
                .from('batch_transactions')
                .insert([{
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
                    block_index: transactionData.blockIndex
                }])
                .select();

            if (error) throw error;
            
            logger.info(`Transaction ${transactionData.hash} saved to database`);
            return data[0];
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
            const { data, error } = await this.supabase
                .from('batch_transactions')
                .select('*')
                .eq('batch_id', batchId)
                .order('timestamp', { ascending: true });

            if (error) throw error;
            return data || [];
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
            const { data, error } = await this.supabase
                .from('temperature_history')
                .insert([{
                    batch_id: temperatureData.batchId,
                    sensor_id: temperatureData.sensorId,
                    temperature: temperatureData.temperature,
                    humidity: temperatureData.humidity,
                    light_level: temperatureData.light,
                    tampering: temperatureData.tampering || false,
                    gps_location: temperatureData.gps,
                    timestamp: new Date(temperatureData.timestamp || Date.now()).toISOString()
                }])
                .select();

            if (error) throw error;
            
            logger.info(`Temperature data for batch ${temperatureData.batchId} saved`);
            return data[0];
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
            
            const { data, error } = await this.supabase
                .from('temperature_history')
                .select('*')
                .eq('batch_id', batchId)
                .gte('timestamp', startTime.toISOString())
                .order('timestamp', { ascending: true });

            if (error) throw error;
            return data || [];
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
            const { data, error } = await this.supabase
                .from('alerts')
                .insert([{
                    alert_id: alertData.id,
                    batch_id: alertData.batchId,
                    type: alertData.type,
                    severity: alertData.severity,
                    message: alertData.message,
                    data: alertData.data,
                    status: alertData.status || 'active'
                }])
                .select();

            if (error) throw error;
            
            logger.info(`Alert ${alertData.id} saved to database`);
            return data[0];
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
            let query = this.supabase
                .from('alerts')
                .select('*')
                .order('created_at', { ascending: false });

            if (filters.severity) {
                query = query.eq('severity', filters.severity);
            }
            if (filters.type) {
                query = query.eq('type', filters.type);
            }
            if (filters.batchId) {
                query = query.eq('batch_id', filters.batchId);
            }
            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            const { data, error } = await query;
            if (error) throw error;
            
            return data || [];
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
            const updateData = { 
                status,
                updated_at: new Date().toISOString()
            };

            if (status === 'acknowledged') {
                updateData.acknowledged_by = updatedBy;
                updateData.acknowledged_at = new Date().toISOString();
            } else if (status === 'resolved') {
                updateData.resolved_by = updatedBy;
                updateData.resolved_at = new Date().toISOString();
            }

            if (notes) {
                updateData.notes = notes;
            }

            const { data, error } = await this.supabase
                .from('alerts')
                .update(updateData)
                .eq('alert_id', alertId)
                .select();

            if (error) throw error;
            
            logger.info(`Alert ${alertId} status updated to ${status}`);
            return data[0];
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
            const { data, error } = await this.supabase
                .from('stakeholders')
                .insert([{
                    stakeholder_id: stakeholderData.id,
                    name: stakeholderData.name,
                    type: stakeholderData.type,
                    address: stakeholderData.address,
                    contact_info: stakeholderData.contactInfo,
                    certifications: stakeholderData.certifications,
                    status: stakeholderData.status || 'active'
                }])
                .select();

            if (error) throw error;
            
            logger.info(`Stakeholder ${stakeholderData.id} saved to database`);
            return data[0];
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
            const { data, error } = await this.supabase
                .from('stakeholders')
                .select('*')
                .eq('stakeholder_id', stakeholderId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            if (error.code === 'PGRST116') {
                return null; // Not found
            }
            logger.error('Failed to get stakeholder:', error);
            throw error;
        }
    }

    /**
     * Save blockchain block
     */
    async saveBlock(blockData) {
        try {
            const { data, error } = await this.supabase
                .from('blockchain_blocks')
                .insert([{
                    block_index: blockData.index,
                    block_hash: blockData.hash,
                    previous_hash: blockData.previousHash,
                    timestamp: new Date(blockData.timestamp).toISOString(),
                    nonce: blockData.nonce,
                    difficulty: blockData.difficulty,
                    merkle_root: blockData.merkleRoot,
                    transaction_count: blockData.transactions.length,
                    block_data: blockData
                }])
                .select();

            if (error) throw error;
            
            logger.info(`Block ${blockData.index} saved to database`);
            return data[0];
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
            const { data: blocks, error: blocksError } = await this.supabase
                .from('blockchain_blocks')
                .select('block_index, transaction_count, timestamp')
                .order('block_index', { ascending: false })
                .limit(1);

            const { data: batches, error: batchesError } = await this.supabase
                .from('pharmaceutical_batches')
                .select('status')
                .not('status', 'is', null);

            const { data: alerts, error: alertsError } = await this.supabase
                .from('alerts')
                .select('severity, status')
                .not('status', 'is', null);

            if (blocksError) throw blocksError;
            if (batchesError) throw batchesError;
            if (alertsError) throw alertsError;

            const latestBlock = blocks[0];
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
            const { data, error } = await this.supabase
                .from('pharmaceutical_batches')
                .select('count')
                .limit(1);

            if (error) throw error;
            
            return {
                status: 'healthy',
                database: 'connected',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                database: 'disconnected',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = SupabaseDatabase;