/**
 * @fileoverview Supply Chain Integration Layer for PharbitChain
 * Handles integration with ERP, IoT, LIMS, and regulatory systems
 */

const EventEmitter = require('events');
const axios = require('axios');
const mqtt = require('mqtt');
const { v4: uuidv4 } = require('uuid');

class SupplyChainIntegration extends EventEmitter {
    constructor(blockchain, config = {}) {
        super();
        
        this.blockchain = blockchain;
        this.config = {
            erp: config.erp || {},
            iot: config.iot || {},
            lims: config.lims || {},
            regulatory: config.regulatory || {}
        };
        
        // Integration clients
        this.erpClients = new Map();
        this.iotClients = new Map();
        this.limsConnections = new Map();
        this.regulatoryClients = new Map();
        
        // Data processing queues
        this.iotDataQueue = [];
        this.erpUpdateQueue = [];
        this.limsResultQueue = [];
        
        // Initialize integrations
        this.initialize();
    }

    /**
     * Initialize all integration components
     */
    async initialize() {
        await Promise.all([
            this.initializeERPConnections(),
            this.initializeIoTGateway(),
            this.initializeLIMSConnections(),
            this.initializeRegulatoryReporting()
        ]);
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('Supply Chain Integration Layer initialized');
    }

    /**
     * Initialize ERP system connections
     */
    async initializeERPConnections() {
        for (const [system, config] of Object.entries(this.config.erp)) {
            try {
                const client = await this.createERPClient(system, config);
                this.erpClients.set(system, client);
                
                console.log(`ERP connection established: ${system}`);
            } catch (error) {
                console.error(`Failed to connect to ERP system ${system}:`, error);
            }
        }
    }

    /**
     * Create ERP client with authentication
     */
    async createERPClient(system, config) {
        const client = axios.create({
            baseURL: config.baseUrl,
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        // Test connection
        await client.get('/api/health');
        
        return {
            client,
            config,
            status: 'connected',
            lastSync: null
        };
    }

    /**
     * Initialize IoT gateway for cold chain monitoring
     */
    async initializeIoTGateway() {
        const { broker, username, password, topics } = this.config.iot;
        
        // Connect to MQTT broker
        const client = mqtt.connect(broker, {
            username,
            password,
            clientId: `pharbit-iot-${uuidv4()}`
        });
        
        client.on('connect', () => {
            console.log('Connected to IoT MQTT broker');
            
            // Subscribe to sensor topics
            for (const topic of topics) {
                client.subscribe(topic, (err) => {
                    if (!err) {
                        console.log(`Subscribed to IoT topic: ${topic}`);
                    }
                });
            }
        });
        
        client.on('message', (topic, message) => {
            this.processIoTData(topic, JSON.parse(message));
        });
        
        this.iotClients.set('main', client);
    }

    /**
     * Initialize LIMS connections
     */
    async initializeLIMSConnections() {
        for (const [lab, config] of Object.entries(this.config.lims)) {
            try {
                const connection = await this.createLIMSConnection(lab, config);
                this.limsConnections.set(lab, connection);
                
                console.log(`LIMS connection established: ${lab}`);
            } catch (error) {
                console.error(`Failed to connect to LIMS ${lab}:`, error);
            }
        }
    }

    /**
     * Create LIMS connection with authentication
     */
    async createLIMSConnection(lab, config) {
        const client = axios.create({
            baseURL: config.baseUrl,
            headers: {
                'API-Key': config.apiKey,
                'Lab-ID': config.labId,
                'Content-Type': 'application/json'
            }
        });
        
        // Test connection
        await client.get('/api/status');
        
        return {
            client,
            config,
            status: 'connected',
            lastSync: null
        };
    }

    /**
     * Initialize regulatory reporting system
     */
    async initializeRegulatoryReporting() {
        for (const [authority, config] of Object.entries(this.config.regulatory)) {
            try {
                const client = await this.createRegulatoryClient(authority, config);
                this.regulatoryClients.set(authority, client);
                
                console.log(`Regulatory reporting initialized: ${authority}`);
            } catch (error) {
                console.error(`Failed to initialize regulatory reporting for ${authority}:`, error);
            }
        }
    }

    /**
     * Create regulatory reporting client
     */
    async createRegulatoryClient(authority, config) {
        const client = axios.create({
            baseURL: config.baseUrl,
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Authority-ID': config.authorityId,
                'Content-Type': 'application/json'
            }
        });
        
        // Test connection
        await client.get('/api/compliance/status');
        
        return {
            client,
            config,
            status: 'connected',
            lastReport: null
        };
    }

    /**
     * Process IoT sensor data
     */
    async processIoTData(topic, data) {
        try {
            // Validate sensor data
            if (!this.validateSensorData(data)) {
                throw new Error('Invalid sensor data format');
            }
            
            // Add to processing queue
            this.iotDataQueue.push({
                topic,
                data,
                timestamp: Date.now()
            });
            
            // Process immediately if critical
            if (this.isCriticalMeasurement(data)) {
                await this.processCriticalIoTData(data);
            }
            
            // Update blockchain
            await this.updateBlockchainWithIoTData(data);
            
            // Emit event
            this.emit('iotDataProcessed', { topic, data });
            
        } catch (error) {
            console.error('Error processing IoT data:', error);
            this.emit('iotDataError', { topic, data, error });
        }
    }

    /**
     * Validate IoT sensor data format
     */
    validateSensorData(data) {
        const required = ['sensorId', 'type', 'value', 'unit', 'timestamp'];
        return required.every(field => data.hasOwnProperty(field));
    }

    /**
     * Check if measurement requires immediate attention
     */
    isCriticalMeasurement(data) {
        const { type, value } = data;
        
        switch (type) {
            case 'temperature':
                return value < 2 || value > 8; // Celsius
                
            case 'humidity':
                return value < 30 || value > 60; // Percentage
                
            default:
                return false;
        }
    }

    /**
     * Process critical IoT measurements
     */
    async processCriticalIoTData(data) {
        // Create alert
        const alert = {
            id: uuidv4(),
            type: 'CRITICAL_MEASUREMENT',
            sensorData: data,
            timestamp: Date.now()
        };
        
        // Update blockchain
        await this.blockchain.createTransaction(
            'IOT_ALERT',
            alert,
            this.config.systemKey
        );
        
        // Notify ERP systems
        await this.notifyERPSystems(alert);
        
        // Emit event
        this.emit('criticalMeasurement', alert);
    }

    /**
     * Update blockchain with IoT data
     */
    async updateBlockchainWithIoTData(data) {
        const transaction = await this.blockchain.createTransaction(
            'IOT_DATA',
            data,
            this.config.systemKey
        );
        
        return transaction;
    }

    /**
     * Sync with ERP system
     */
    async syncWithERP(system) {
        const client = this.erpClients.get(system);
        if (!client) throw new Error(`ERP system not found: ${system}`);
        
        try {
            // Get updates since last sync
            const lastSync = client.lastSync || new Date(0);
            const response = await client.client.get('/api/updates', {
                params: { since: lastSync.toISOString() }
            });
            
            // Process updates
            for (const update of response.data.updates) {
                await this.processERPUpdate(system, update);
            }
            
            // Update sync timestamp
            client.lastSync = new Date();
            
            console.log(`ERP sync completed: ${system}`);
            
        } catch (error) {
            console.error(`ERP sync failed for ${system}:`, error);
            throw error;
        }
    }

    /**
     * Process ERP system update
     */
    async processERPUpdate(system, update) {
        // Add to processing queue
        this.erpUpdateQueue.push({
            system,
            update,
            timestamp: Date.now()
        });
        
        // Create blockchain transaction
        const transaction = await this.blockchain.createTransaction(
            'ERP_UPDATE',
            {
                system,
                updateId: update.id,
                type: update.type,
                data: update.data,
                timestamp: update.timestamp
            },
            this.config.systemKey
        );
        
        // Emit event
        this.emit('erpUpdateProcessed', { system, update, transaction });
        
        return transaction;
    }

    /**
     * Submit test results to LIMS
     */
    async submitToLIMS(lab, testResults) {
        const connection = this.limsConnections.get(lab);
        if (!connection) throw new Error(`LIMS not found: ${lab}`);
        
        try {
            // Submit results
            const response = await connection.client.post('/api/results', testResults);
            
            // Create blockchain transaction
            const transaction = await this.blockchain.createTransaction(
                'LIMS_RESULTS',
                {
                    lab,
                    resultId: response.data.id,
                    testResults,
                    timestamp: Date.now()
                },
                this.config.systemKey
            );
            
            // Emit event
            this.emit('limsResultsSubmitted', {
                lab,
                results: testResults,
                response: response.data,
                transaction
            });
            
            return response.data;
            
        } catch (error) {
            console.error(`LIMS submission failed for ${lab}:`, error);
            throw error;
        }
    }

    /**
     * Submit regulatory report
     */
    async submitRegulatoryReport(authority, report) {
        const client = this.regulatoryClients.get(authority);
        if (!client) throw new Error(`Regulatory client not found: ${authority}`);
        
        try {
            // Submit report
            const response = await client.client.post('/api/reports', report);
            
            // Create blockchain transaction
            const transaction = await this.blockchain.createTransaction(
                'REGULATORY_REPORT',
                {
                    authority,
                    reportId: response.data.id,
                    report,
                    timestamp: Date.now()
                },
                this.config.systemKey
            );
            
            // Update last report timestamp
            client.lastReport = new Date();
            
            // Emit event
            this.emit('regulatoryReportSubmitted', {
                authority,
                report,
                response: response.data,
                transaction
            });
            
            return response.data;
            
        } catch (error) {
            console.error(`Regulatory report submission failed for ${authority}:`, error);
            throw error;
        }
    }

    /**
     * Set up blockchain event listeners
     */
    setupEventListeners() {
        this.blockchain.on('blockAdded', this.handleNewBlock.bind(this));
        this.blockchain.on('complianceViolation', this.handleComplianceViolation.bind(this));
        this.blockchain.on('recallInitiated', this.handleRecallAlert.bind(this));
    }

    /**
     * Handle new block for integrations
     */
    async handleNewBlock(block) {
        // Update ERP systems
        for (const [system, client] of this.erpClients) {
            try {
                await client.client.post('/api/blockchain/update', {
                    blockHash: block.hash,
                    transactions: block.transactions
                });
            } catch (error) {
                console.error(`Failed to update ERP system ${system}:`, error);
            }
        }
        
        // Process relevant transactions
        for (const tx of block.transactions) {
            switch (tx.type) {
                case 'QUALITY_CHECK':
                    await this.handleQualityCheckTransaction(tx);
                    break;
                    
                case 'ENVIRONMENTAL_UPDATE':
                    await this.handleEnvironmentalUpdate(tx);
                    break;
                    
                case 'REGULATORY_SUBMISSION':
                    await this.handleRegulatorySubmission(tx);
                    break;
            }
        }
    }

    /**
     * Handle compliance violation
     */
    async handleComplianceViolation(violation) {
        // Notify ERP systems
        await this.notifyERPSystems({
            type: 'COMPLIANCE_VIOLATION',
            data: violation,
            timestamp: Date.now()
        });
        
        // Create regulatory report
        for (const [authority, client] of this.regulatoryClients) {
            try {
                await this.submitRegulatoryReport(authority, {
                    type: 'VIOLATION_REPORT',
                    violation,
                    timestamp: Date.now()
                });
            } catch (error) {
                console.error(`Failed to submit violation report to ${authority}:`, error);
            }
        }
    }

    /**
     * Handle recall alert
     */
    async handleRecallAlert(recall) {
        // Notify ERP systems
        await this.notifyERPSystems({
            type: 'RECALL_ALERT',
            data: recall,
            timestamp: Date.now()
        });
        
        // Create regulatory report
        for (const [authority, client] of this.regulatoryClients) {
            try {
                await this.submitRegulatoryReport(authority, {
                    type: 'RECALL_REPORT',
                    recall,
                    timestamp: Date.now()
                });
            } catch (error) {
                console.error(`Failed to submit recall report to ${authority}:`, error);
            }
        }
    }

    /**
     * Notify all connected ERP systems
     */
    async notifyERPSystems(notification) {
        const promises = Array.from(this.erpClients.entries()).map(
            async ([system, client]) => {
                try {
                    await client.client.post('/api/notifications', notification);
                } catch (error) {
                    console.error(`Failed to notify ERP system ${system}:`, error);
                }
            }
        );
        
        await Promise.allSettled(promises);
    }
}

module.exports = SupplyChainIntegration;