/**
 * @fileoverview Real Blockchain Client for Pharmaceutical Supply Chain
 * Integrates with MetaMask, Supabase, S3, and smart contracts
 */

class RealBlockchainClient {
    constructor() {
        this.apiBaseUrl = window.location.origin + '/api';
        this.metaMask = null;
        this.contract = null;
        this.isConnected = false;
        this.currentAccount = null;
        this.networkInfo = null;
    }

    /**
     * Initialize the real blockchain client
     */
    async initialize() {
        try {
            console.log('🚀 Initializing Real Blockchain Client...');
            
            // Check if MetaMask is available
            if (typeof window.ethereum !== 'undefined') {
                this.metaMask = window.ethereum;
                console.log('✅ MetaMask detected');
            } else {
                console.warn('⚠️ MetaMask not detected');
            }

            // Load contract ABI and address
            await this.loadContractInfo();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('✅ Real Blockchain Client initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Real Blockchain Client:', error);
            throw error;
        }
    }

    /**
     * Load contract information
     */
    async loadContractInfo() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/real-blockchain/stats`);
            const stats = await response.json();
            
            if (stats.contracts && stats.contracts.PharmaceuticalSupplyChain) {
                this.contractAddress = stats.contracts.PharmaceuticalSupplyChain;
                console.log('✅ Contract address loaded:', this.contractAddress);
            }
        } catch (error) {
            console.warn('⚠️ Could not load contract info:', error.message);
        }
    }

    /**
     * Connect to MetaMask
     */
    async connectMetaMask() {
        try {
            if (!this.metaMask) {
                throw new Error('MetaMask not detected. Please install MetaMask.');
            }

            // Request account access
            const accounts = await this.metaMask.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error('No accounts found. Please connect to MetaMask.');
            }

            this.currentAccount = accounts[0];
            this.isConnected = true;

            // Get network info
            const chainId = await this.metaMask.request({ method: 'eth_chainId' });
            this.networkInfo = {
                chainId: chainId,
                name: this.getNetworkName(chainId)
            };

            console.log('✅ MetaMask connected:', this.currentAccount);
            return {
                address: this.currentAccount,
                chainId: chainId,
                networkName: this.networkInfo.name
            };
        } catch (error) {
            console.error('❌ MetaMask connection failed:', error);
            throw error;
        }
    }

    /**
     * Get network name from chain ID
     */
    getNetworkName(chainId) {
        const networks = {
            '0x1': 'Ethereum Mainnet',
            '0x89': 'Polygon',
            '0x38': 'BSC',
            '0xa': 'Optimism',
            '0xa4b1': 'Arbitrum',
            '0xaa36a7': 'Sepolia Testnet',
            '0x13881': 'Polygon Mumbai',
            '0x61': 'BSC Testnet'
        };
        return networks[chainId] || `Chain ID: ${chainId}`;
    }

    /**
     * Switch to pharmaceutical network
     */
    async switchToPharmaNetwork() {
        try {
            const pharmaNetwork = {
                chainId: '0x1', // Ethereum mainnet
                chainName: 'Ethereum Mainnet',
                rpcUrls: ['https://mainnet.infura.io/v3/YOUR_PROJECT_ID'],
                blockExplorerUrls: ['https://etherscan.io']
            };

            await this.metaMask.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: pharmaNetwork.chainId }]
            }).catch(async (error) => {
                if (error.code === 4902) {
                    // Chain not added, add it
                    await this.metaMask.request({
                        method: 'wallet_addEthereumChain',
                        params: [pharmaNetwork]
                    });
                } else {
                    throw error;
                }
            });

            console.log('✅ Switched to pharmaceutical network');
            return true;
        } catch (error) {
            console.error('❌ Failed to switch network:', error);
            throw error;
        }
    }

    /**
     * Sign a message with MetaMask
     */
    async signMessage(message) {
        try {
            if (!this.isConnected) {
                throw new Error('MetaMask not connected');
            }

            const signature = await this.metaMask.request({
                method: 'personal_sign',
                params: [message, this.currentAccount]
            });

            console.log('✅ Message signed');
            return signature;
        } catch (error) {
            console.error('❌ Failed to sign message:', error);
            throw error;
        }
    }

    /**
     * Create a pharmaceutical batch
     */
    async createBatch(batchData) {
        try {
            if (!this.isConnected) {
                throw new Error('MetaMask not connected');
            }

            // Sign the batch creation message
            const message = JSON.stringify({
                type: 'CREATE_BATCH',
                batchInfo: batchData
            });

            const signature = await this.signMessage(message);

            // Send to backend
            const response = await fetch(`${this.apiBaseUrl}/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    batchInfo: batchData,
                    address: this.currentAccount,
                    signature: signature
                })
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to create batch');
            }

            console.log('✅ Batch created:', result.batchId);
            return result;
        } catch (error) {
            console.error('❌ Failed to create batch:', error);
            throw error;
        }
    }

    /**
     * Transfer batch custody
     */
    async transferCustody(transferData) {
        try {
            if (!this.isConnected) {
                throw new Error('MetaMask not connected');
            }

            // Sign the transfer message
            const message = JSON.stringify({
                type: 'TRANSFER_CUSTODY',
                batchId: transferData.batchId,
                fromStakeholder: transferData.fromStakeholder,
                toStakeholder: transferData.toStakeholder,
                transferInfo: transferData.transferInfo
            });

            const signature = await this.signMessage(message);

            // Send to backend
            const response = await fetch(`${this.apiBaseUrl}/supply-chain/transfer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...transferData,
                    address: this.currentAccount,
                    signature: signature
                })
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to transfer custody');
            }

            console.log('✅ Custody transferred');
            return result;
        } catch (error) {
            console.error('❌ Failed to transfer custody:', error);
            throw error;
        }
    }

    /**
     * Get batch information
     */
    async getBatch(batchId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/batch/${batchId}`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to get batch');
            }

            return result;
        } catch (error) {
            console.error('❌ Failed to get batch:', error);
            throw error;
        }
    }

    /**
     * Get all batches
     */
    async getAllBatches() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/supply-chain/stats`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to get batches');
            }

            return result.stats;
        } catch (error) {
            console.error('❌ Failed to get batches:', error);
            throw error;
        }
    }

    /**
     * Add temperature data
     */
    async addTemperatureData(temperatureData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/sensor-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(temperatureData)
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to add temperature data');
            }

            console.log('✅ Temperature data added');
            return result;
        } catch (error) {
            console.error('❌ Failed to add temperature data:', error);
            throw error;
        }
    }

    /**
     * Get temperature history
     */
    async getTemperatureHistory(batchId, hours = 24) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/temperature/${batchId}?hours=${hours}`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to get temperature history');
            }

            return result;
        } catch (error) {
            console.error('❌ Failed to get temperature history:', error);
            throw error;
        }
    }

    /**
     * Get alerts
     */
    async getAlerts(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters);
            const response = await fetch(`${this.apiBaseUrl}/alerts?${queryParams}`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to get alerts');
            }

            return result;
        } catch (error) {
            console.error('❌ Failed to get alerts:', error);
            throw error;
        }
    }

    /**
     * Acknowledge alert
     */
    async acknowledgeAlert(alertId, acknowledgedBy, notes = '') {
        try {
            const response = await fetch(`${this.apiBaseUrl}/alerts/${alertId}/acknowledge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    acknowledgedBy: acknowledgedBy,
                    notes: notes
                })
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to acknowledge alert');
            }

            console.log('✅ Alert acknowledged');
            return result;
        } catch (error) {
            console.error('❌ Failed to acknowledge alert:', error);
            throw error;
        }
    }

    /**
     * Resolve alert
     */
    async resolveAlert(alertId, resolvedBy, resolution = '') {
        try {
            const response = await fetch(`${this.apiBaseUrl}/alerts/${alertId}/resolve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    resolvedBy: resolvedBy,
                    resolution: resolution
                })
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to resolve alert');
            }

            console.log('✅ Alert resolved');
            return result;
        } catch (error) {
            console.error('❌ Failed to resolve alert:', error);
            throw error;
        }
    }

    /**
     * Backup blockchain data
     */
    async backupBlockchain() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/backup/blockchain`, {
                method: 'POST'
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to backup blockchain');
            }

            console.log('✅ Blockchain backed up');
            return result;
        } catch (error) {
            console.error('❌ Failed to backup blockchain:', error);
            throw error;
        }
    }

    /**
     * Export temperature data
     */
    async exportTemperatureData(batchId, hours = 24) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/export/temperature/${batchId}?hours=${hours}`, {
                method: 'POST'
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to export temperature data');
            }

            console.log('✅ Temperature data exported');
            return result;
        } catch (error) {
            console.error('❌ Failed to export temperature data:', error);
            throw error;
        }
    }

    /**
     * Generate compliance report
     */
    async generateComplianceReport(reportData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/reports/compliance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reportData)
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to generate compliance report');
            }

            console.log('✅ Compliance report generated');
            return result;
        } catch (error) {
            console.error('❌ Failed to generate compliance report:', error);
            throw error;
        }
    }

    /**
     * Get system health
     */
    async getSystemHealth() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/health`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to get system health');
            }

            return result;
        } catch (error) {
            console.error('❌ Failed to get system health:', error);
            throw error;
        }
    }

    /**
     * Get real blockchain statistics
     */
    async getRealBlockchainStats() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/real-blockchain/stats`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to get real blockchain stats');
            }

            return result;
        } catch (error) {
            console.error('❌ Failed to get real blockchain stats:', error);
            throw error;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (this.metaMask) {
            // Listen for account changes
            this.metaMask.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.isConnected = false;
                    this.currentAccount = null;
                    console.log('🔌 MetaMask account disconnected');
                } else if (accounts[0] !== this.currentAccount) {
                    this.currentAccount = accounts[0];
                    console.log('🔌 MetaMask account changed:', this.currentAccount);
                }
            });

            // Listen for chain changes
            this.metaMask.on('chainChanged', (chainId) => {
                this.networkInfo = {
                    chainId: chainId,
                    name: this.getNetworkName(chainId)
                };
                console.log('🔌 MetaMask chain changed:', this.networkInfo.name);
            });

            // Listen for disconnection
            this.metaMask.on('disconnect', () => {
                this.isConnected = false;
                this.currentAccount = null;
                console.log('🔌 MetaMask disconnected');
            });
        }
    }

    /**
     * Disconnect from MetaMask
     */
    disconnect() {
        this.isConnected = false;
        this.currentAccount = null;
        this.networkInfo = null;
        console.log('🔌 Disconnected from MetaMask');
    }

    /**
     * Get current connection status
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            account: this.currentAccount,
            network: this.networkInfo,
            contractAddress: this.contractAddress
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealBlockchainClient;
} else {
    window.RealBlockchainClient = RealBlockchainClient;
}