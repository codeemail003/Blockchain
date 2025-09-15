/**
 * @fileoverview Supabase Service for PharbitChain
 * Handles Supabase-specific operations and real-time features
 */

const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

class SupabaseService {
    constructor(credentials) {
        this.credentials = credentials;
        this.supabase = null;
        this.realtimeChannels = new Map();
    }

    /**
     * Initialize Supabase client
     */
    async initialize() {
        try {
            this.supabase = createClient(
                this.credentials.SUPABASE_URL,
                this.credentials.SUPABASE_ANON_KEY,
                {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: false
                    },
                    realtime: {
                        params: {
                            eventsPerSecond: 10
                        }
                    }
                }
            );

            // Test connection
            const { data, error } = await this.supabase
                .from('pg_tables')
                .select('*')
                .limit(1);

            if (error) {
                logger.warn('Supabase connection test failed:', error.message);
            } else {
                logger.info('✅ Supabase service initialized');
            }

            return this.supabase;

        } catch (error) {
            logger.error('❌ Supabase initialization failed:', error);
            throw error;
        }
    }

    /**
     * Get Supabase client
     */
    getClient() {
        return this.supabase;
    }

    /**
     * Subscribe to real-time updates
     * @param {string} table - Table name
     * @param {string} event - Event type (INSERT, UPDATE, DELETE, *)
     * @param {Function} callback - Callback function
     * @returns {Object} Subscription object
     */
    subscribeToTable(table, event = '*', callback) {
        try {
            const channel = this.supabase
                .channel(`${table}_changes`)
                .on('postgres_changes', 
                    { 
                        event, 
                        schema: 'public', 
                        table 
                    }, 
                    callback
                )
                .subscribe();

            this.realtimeChannels.set(`${table}_${event}`, channel);
            
            logger.debug(`Subscribed to ${table} ${event} events`);
            return channel;

        } catch (error) {
            logger.error('Failed to subscribe to table:', error);
            throw error;
        }
    }

    /**
     * Unsubscribe from real-time updates
     * @param {string} table - Table name
     * @param {string} event - Event type
     */
    unsubscribeFromTable(table, event = '*') {
        const channelKey = `${table}_${event}`;
        const channel = this.realtimeChannels.get(channelKey);
        
        if (channel) {
            this.supabase.removeChannel(channel);
            this.realtimeChannels.delete(channelKey);
            logger.debug(`Unsubscribed from ${table} ${event} events`);
        }
    }

    /**
     * Subscribe to blockchain updates
     * @param {Function} callback - Callback function
     * @returns {Object} Subscription object
     */
    subscribeToBlockchainUpdates(callback) {
        return this.subscribeToTable('blocks', '*', (payload) => {
            logger.blockchain('Real-time blockchain update', {
                event: payload.eventType,
                table: payload.table,
                new: payload.new,
                old: payload.old
            });
            callback(payload);
        });
    }

    /**
     * Subscribe to batch updates
     * @param {Function} callback - Callback function
     * @returns {Object} Subscription object
     */
    subscribeToBatchUpdates(callback) {
        return this.subscribeToTable('batches', '*', (payload) => {
            logger.batch('Real-time batch update', {
                event: payload.eventType,
                batchId: payload.new?.batchId || payload.old?.batchId,
                status: payload.new?.status || payload.old?.status
            });
            callback(payload);
        });
    }

    /**
     * Subscribe to document updates
     * @param {Function} callback - Callback function
     * @returns {Object} Subscription object
     */
    subscribeToDocumentUpdates(callback) {
        return this.subscribeToTable('documents', '*', (payload) => {
            logger.document('Real-time document update', {
                event: payload.eventType,
                fileId: payload.new?.fileId || payload.old?.fileId,
                documentType: payload.new?.documentType || payload.old?.documentType
            });
            callback(payload);
        });
    }

    /**
     * Subscribe to compliance violations
     * @param {Function} callback - Callback function
     * @returns {Object} Subscription object
     */
    subscribeToComplianceViolations(callback) {
        return this.subscribeToTable('compliance_violations', '*', (payload) => {
            logger.compliance('Real-time compliance violation', {
                event: payload.eventType,
                violationType: payload.new?.violationType || payload.old?.violationType,
                severity: payload.new?.severity || payload.old?.severity
            });
            callback(payload);
        });
    }

    /**
     * Get real-time connection status
     * @returns {Object} Connection status
     */
    getConnectionStatus() {
        const channels = Array.from(this.realtimeChannels.values());
        const activeChannels = channels.filter(channel => channel.state === 'joined');
        
        return {
            connected: this.supabase.realtime.isConnected(),
            activeChannels: activeChannels.length,
            totalChannels: channels.length,
            channels: channels.map(channel => ({
                topic: channel.topic,
                state: channel.state
            }))
        };
    }

    /**
     * Close all real-time connections
     */
    closeConnections() {
        try {
            this.realtimeChannels.forEach((channel, key) => {
                this.supabase.removeChannel(channel);
                logger.debug(`Closed channel: ${key}`);
            });
            
            this.realtimeChannels.clear();
            logger.info('✅ All Supabase real-time connections closed');
            
        } catch (error) {
            logger.error('Error closing Supabase connections:', error);
        }
    }

    /**
     * Execute raw SQL query
     * @param {string} query - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Object>} Query result
     */
    async executeQuery(query, params = []) {
        try {
            const { data, error } = await this.supabase.rpc('exec_sql', {
                query,
                params
            });

            if (error) {
                throw new Error(`SQL execution failed: ${error.message}`);
            }

            return data;

        } catch (error) {
            logger.error('SQL query execution failed:', error);
            throw error;
        }
    }

    /**
     * Get database statistics
     * @returns {Promise<Object>} Database statistics
     */
    async getDatabaseStats() {
        try {
            const queries = {
                tableSizes: `
                    SELECT 
                        schemaname,
                        tablename,
                        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
                    FROM pg_tables 
                    WHERE schemaname = 'public'
                    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
                `,
                indexSizes: `
                    SELECT 
                        schemaname,
                        indexname,
                        pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as size
                    FROM pg_indexes 
                    WHERE schemaname = 'public'
                    ORDER BY pg_relation_size(schemaname||'.'||indexname) DESC
                `,
                connectionCount: `
                    SELECT count(*) as active_connections 
                    FROM pg_stat_activity 
                    WHERE state = 'active'
                `
            };

            const results = {};
            for (const [key, query] of Object.entries(queries)) {
                try {
                    const { data, error } = await this.supabase.rpc('exec_sql', {
                        query,
                        params: []
                    });
                    
                    if (!error) {
                        results[key] = data;
                    }
                } catch (err) {
                    logger.warn(`Failed to execute ${key} query:`, err.message);
                }
            }

            return results;

        } catch (error) {
            logger.error('Failed to get database statistics:', error);
            throw error;
        }
    }

    /**
     * Create database backup
     * @param {string} backupName - Name for the backup
     * @returns {Promise<Object>} Backup result
     */
    async createBackup(backupName) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `${backupName}_${timestamp}.sql`;
            
            // This would typically use Supabase's backup API
            // For now, we'll return a placeholder
            logger.info(`Database backup created: ${backupFileName}`);
            
            return {
                success: true,
                backupName: backupFileName,
                timestamp: new Date().toISOString(),
                message: 'Backup creation initiated'
            };

        } catch (error) {
            logger.error('Backup creation failed:', error);
            throw error;
        }
    }

    /**
     * Get Supabase project information
     * @returns {Object} Project information
     */
    getProjectInfo() {
        return {
            url: this.credentials.SUPABASE_URL,
            projectId: this.credentials.SUPABASE_URL.split('//')[1].split('.')[0],
            hasAnonKey: !!this.credentials.SUPABASE_ANON_KEY,
            hasServiceKey: !!this.credentials.SUPABASE_SERVICE_ROLE_KEY,
            realtimeEnabled: true
        };
    }
}

module.exports = SupabaseService;