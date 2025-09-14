/**
 * @fileoverview MetaMask integration for pharmaceutical blockchain
 * Handles wallet connection, transaction signing, and user authentication
 */

const { ethers } = require('ethers');
const logger = require('../logger');

class MetaMaskIntegration {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.connectedAddress = null;
        this.chainId = null;
        this.isConnected = false;
        this.networkConfig = {
            chainId: process.env.CHAIN_ID || '0x1', // Ethereum mainnet by default
            chainName: process.env.CHAIN_NAME || 'Ethereum Mainnet',
            rpcUrl: process.env.RPC_URL || 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
            blockExplorerUrl: process.env.BLOCK_EXPLORER_URL || 'https://etherscan.io'
        };
    }

    /**
     * Check if MetaMask is installed
     */
    isMetaMaskInstalled() {
        return typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask;
    }

    /**
     * Request connection to MetaMask
     */
    async connect() {
        try {
            if (!this.isMetaMaskInstalled()) {
                throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
            }

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error('No accounts found. Please connect to MetaMask.');
            }

            this.connectedAddress = accounts[0];
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            this.chainId = await this.getChainId();
            this.isConnected = true;

            logger.info(`MetaMask connected: ${this.connectedAddress}`);
            
            // Set up event listeners
            this.setupEventListeners();

            return {
                address: this.connectedAddress,
                chainId: this.chainId,
                isConnected: true
            };
        } catch (error) {
            logger.error('Failed to connect to MetaMask:', error);
            throw error;
        }
    }

    /**
     * Get current chain ID
     */
    async getChainId() {
        try {
            const chainId = await window.ethereum.request({
                method: 'eth_chainId'
            });
            return chainId;
        } catch (error) {
            logger.error('Failed to get chain ID:', error);
            return null;
        }
    }

    /**
     * Switch to pharmaceutical blockchain network
     */
    async switchToPharmaNetwork() {
        try {
            const networkParams = {
                chainId: this.networkConfig.chainId,
                chainName: this.networkConfig.chainName,
                rpcUrls: [this.networkConfig.rpcUrl],
                blockExplorerUrls: [this.networkConfig.blockExplorerUrl]
            };

            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: this.networkConfig.chainId }]
            }).catch(async (error) => {
                if (error.code === 4902) {
                    // Chain not added, add it
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [networkParams]
                    });
                } else {
                    throw error;
                }
            });

            this.chainId = this.networkConfig.chainId;
            logger.info(`Switched to pharmaceutical network: ${this.networkConfig.chainName}`);
            
            return true;
        } catch (error) {
            logger.error('Failed to switch to pharmaceutical network:', error);
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

            const signature = await this.signer.signMessage(message);
            logger.info('Message signed with MetaMask');
            
            return signature;
        } catch (error) {
            logger.error('Failed to sign message:', error);
            throw error;
        }
    }

    /**
     * Sign a pharmaceutical transaction
     */
    async signPharmaTransaction(transactionData) {
        try {
            if (!this.isConnected) {
                throw new Error('MetaMask not connected');
            }

            // Create the message to sign
            const message = JSON.stringify({
                type: 'PHARMA_TRANSACTION',
                batchId: transactionData.batchId,
                action: transactionData.action,
                stakeholder: transactionData.stakeholder,
                location: transactionData.location,
                sensorData: transactionData.sensorData,
                timestamp: transactionData.timestamp
            });

            const signature = await this.signMessage(message);
            
            return {
                signature,
                message,
                address: this.connectedAddress,
                chainId: this.chainId
            };
        } catch (error) {
            logger.error('Failed to sign pharmaceutical transaction:', error);
            throw error;
        }
    }

    /**
     * Sign a batch creation transaction
     */
    async signBatchCreation(batchData) {
        try {
            if (!this.isConnected) {
                throw new Error('MetaMask not connected');
            }

            const message = JSON.stringify({
                type: 'CREATE_BATCH',
                batchInfo: batchData
            });

            const signature = await this.signMessage(message);
            
            return {
                signature,
                message,
                address: this.connectedAddress,
                chainId: this.chainId
            };
        } catch (error) {
            logger.error('Failed to sign batch creation:', error);
            throw error;
        }
    }

    /**
     * Sign a custody transfer transaction
     */
    async signCustodyTransfer(transferData) {
        try {
            if (!this.isConnected) {
                throw new Error('MetaMask not connected');
            }

            const message = JSON.stringify({
                type: 'TRANSFER_CUSTODY',
                batchId: transferData.batchId,
                fromStakeholder: transferData.fromStakeholder,
                toStakeholder: transferData.toStakeholder,
                transferInfo: transferData.transferInfo
            });

            const signature = await this.signMessage(message);
            
            return {
                signature,
                message,
                address: this.connectedAddress,
                chainId: this.chainId
            };
        } catch (error) {
            logger.error('Failed to sign custody transfer:', error);
            throw error;
        }
    }

    /**
     * Get account balance
     */
    async getBalance() {
        try {
            if (!this.isConnected) {
                throw new Error('MetaMask not connected');
            }

            const balance = await this.provider.getBalance(this.connectedAddress);
            return ethers.formatEther(balance);
        } catch (error) {
            logger.error('Failed to get balance:', error);
            throw error;
        }
    }

    /**
     * Get account information
     */
    async getAccountInfo() {
        try {
            if (!this.isConnected) {
                throw new Error('MetaMask not connected');
            }

            const balance = await this.getBalance();
            const network = await this.provider.getNetwork();
            
            return {
                address: this.connectedAddress,
                balance: balance,
                chainId: this.chainId,
                networkName: network.name,
                isConnected: this.isConnected
            };
        } catch (error) {
            logger.error('Failed to get account info:', error);
            throw error;
        }
    }

    /**
     * Disconnect from MetaMask
     */
    disconnect() {
        this.provider = null;
        this.signer = null;
        this.connectedAddress = null;
        this.chainId = null;
        this.isConnected = false;
        
        logger.info('Disconnected from MetaMask');
    }

    /**
     * Setup event listeners for MetaMask
     */
    setupEventListeners() {
        if (typeof window === 'undefined') return;

        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this.disconnect();
                logger.info('MetaMask account disconnected');
            } else if (accounts[0] !== this.connectedAddress) {
                this.connectedAddress = accounts[0];
                logger.info(`MetaMask account changed to: ${this.connectedAddress}`);
            }
        });

        // Listen for chain changes
        window.ethereum.on('chainChanged', (chainId) => {
            this.chainId = chainId;
            logger.info(`MetaMask chain changed to: ${chainId}`);
        });

        // Listen for disconnection
        window.ethereum.on('disconnect', () => {
            this.disconnect();
            logger.info('MetaMask disconnected');
        });
    }

    /**
     * Verify signature
     */
    async verifySignature(message, signature, expectedAddress) {
        try {
            const recoveredAddress = ethers.verifyMessage(message, signature);
            return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
        } catch (error) {
            logger.error('Failed to verify signature:', error);
            return false;
        }
    }

    /**
     * Get transaction history (if supported by the network)
     */
    async getTransactionHistory(limit = 100) {
        try {
            if (!this.isConnected) {
                throw new Error('MetaMask not connected');
            }

            // This would typically require a block explorer API
            // For now, return empty array
            logger.warn('Transaction history not implemented for this network');
            return [];
        } catch (error) {
            logger.error('Failed to get transaction history:', error);
            throw error;
        }
    }

    /**
     * Check if the current network is supported
     */
    isSupportedNetwork() {
        const supportedChains = [
            '0x1', // Ethereum Mainnet
            '0x89', // Polygon
            '0x38', // BSC
            '0xa', // Optimism
            '0xa4b1' // Arbitrum
        ];
        
        return supportedChains.includes(this.chainId);
    }

    /**
     * Get network information
     */
    getNetworkInfo() {
        return {
            chainId: this.chainId,
            chainName: this.networkConfig.chainName,
            rpcUrl: this.networkConfig.rpcUrl,
            blockExplorerUrl: this.networkConfig.blockExplorerUrl,
            isSupported: this.isSupportedNetwork()
        };
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            if (!this.isConnected) {
                return {
                    status: 'disconnected',
                    message: 'MetaMask not connected',
                    timestamp: new Date().toISOString()
                };
            }

            const accountInfo = await this.getAccountInfo();
            
            return {
                status: 'connected',
                account: accountInfo,
                network: this.getNetworkInfo(),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'error',
                message: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = MetaMaskIntegration;