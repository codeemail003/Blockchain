/**
 * MetaMask Integration Utilities
 * Provides helper functions for MetaMask wallet integration
 */

class MetaMaskUtils {
    constructor() {
        this.isMetaMaskInstalled = false;
        this.isConnected = false;
        this.accounts = [];
        this.chainId = null;
        this.provider = null;
    }

    /**
     * Check if MetaMask is installed
     * @returns {boolean} True if MetaMask is installed
     */
    checkMetaMaskInstalled() {
        if (typeof window !== 'undefined' && window.ethereum) {
            this.isMetaMaskInstalled = true;
            this.provider = window.ethereum;
            return true;
        }
        return false;
    }

    /**
     * Request account access
     * @returns {Promise<Object>} Connection result
     */
    async requestAccounts() {
        try {
            if (!this.checkMetaMaskInstalled()) {
                throw new Error('MetaMask not installed');
            }

            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            this.accounts = accounts;
            this.isConnected = accounts.length > 0;

            return {
                success: true,
                accounts: accounts,
                isConnected: this.isConnected
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get current accounts
     * @returns {Promise<Object>} Accounts result
     */
    async getAccounts() {
        try {
            if (!this.checkMetaMaskInstalled()) {
                throw new Error('MetaMask not installed');
            }

            const accounts = await window.ethereum.request({
                method: 'eth_accounts'
            });

            this.accounts = accounts;
            this.isConnected = accounts.length > 0;

            return {
                success: true,
                accounts: accounts,
                isConnected: this.isConnected
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get current chain ID
     * @returns {Promise<Object>} Chain ID result
     */
    async getChainId() {
        try {
            if (!this.checkMetaMaskInstalled()) {
                throw new Error('MetaMask not installed');
            }

            const chainId = await window.ethereum.request({
                method: 'eth_chainId'
            });

            this.chainId = parseInt(chainId, 16);

            return {
                success: true,
                chainId: this.chainId
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Switch to a specific network
     * @param {number} chainId - Target chain ID
     * @returns {Promise<Object>} Switch result
     */
    async switchNetwork(chainId) {
        try {
            if (!this.checkMetaMaskInstalled()) {
                throw new Error('MetaMask not installed');
            }

            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chainId.toString(16)}` }]
            });

            this.chainId = chainId;

            return {
                success: true,
                chainId: chainId
            };
        } catch (error) {
            // If the chain doesn't exist, try to add it
            if (error.code === 4902) {
                return await this.addNetwork(chainId);
            }
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Add a new network
     * @param {number} chainId - Chain ID
     * @returns {Promise<Object>} Add network result
     */
    async addNetwork(chainId) {
        try {
            const networkConfig = this.getNetworkConfig(chainId);
            
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [networkConfig]
            });

            this.chainId = chainId;

            return {
                success: true,
                chainId: chainId
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get network configuration
     * @param {number} chainId - Chain ID
     * @returns {Object} Network configuration
     */
    getNetworkConfig(chainId) {
        const networks = {
            1: {
                chainId: '0x1',
                chainName: 'Ethereum Mainnet',
                rpcUrls: ['https://mainnet.infura.io/v3/YOUR_INFURA_KEY'],
                blockExplorerUrls: ['https://etherscan.io'],
                nativeCurrency: {
                    name: 'Ether',
                    symbol: 'ETH',
                    decimals: 18
                }
            },
            11155111: {
                chainId: '0xaa36a7',
                chainName: 'Sepolia Testnet',
                rpcUrls: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
                nativeCurrency: {
                    name: 'Sepolia Ether',
                    symbol: 'ETH',
                    decimals: 18
                }
            },
            1337: {
                chainId: '0x539',
                chainName: 'Localhost',
                rpcUrls: ['http://localhost:8545'],
                blockExplorerUrls: [],
                nativeCurrency: {
                    name: 'Ether',
                    symbol: 'ETH',
                    decimals: 18
                }
            }
        };

        return networks[chainId] || networks[1337];
    }

    /**
     * Sign a message
     * @param {string} message - Message to sign
     * @returns {Promise<Object>} Sign result
     */
    async signMessage(message) {
        try {
            if (!this.checkMetaMaskInstalled()) {
                throw new Error('MetaMask not installed');
            }

            if (!this.isConnected) {
                throw new Error('Not connected to MetaMask');
            }

            const signature = await window.ethereum.request({
                method: 'personal_sign',
                params: [message, this.accounts[0]]
            });

            return {
                success: true,
                signature: signature
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send a transaction
     * @param {Object} transaction - Transaction object
     * @returns {Promise<Object>} Transaction result
     */
    async sendTransaction(transaction) {
        try {
            if (!this.checkMetaMaskInstalled()) {
                throw new Error('MetaMask not installed');
            }

            if (!this.isConnected) {
                throw new Error('Not connected to MetaMask');
            }

            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [transaction]
            });

            return {
                success: true,
                txHash: txHash
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get transaction receipt
     * @param {string} txHash - Transaction hash
     * @returns {Promise<Object>} Receipt result
     */
    async getTransactionReceipt(txHash) {
        try {
            if (!this.checkMetaMaskInstalled()) {
                throw new Error('MetaMask not installed');
            }

            const receipt = await window.ethereum.request({
                method: 'eth_getTransactionReceipt',
                params: [txHash]
            });

            return {
                success: true,
                receipt: receipt
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Listen for account changes
     * @param {Function} callback - Callback function
     */
    onAccountsChanged(callback) {
        if (this.checkMetaMaskInstalled()) {
            window.ethereum.on('accountsChanged', (accounts) => {
                this.accounts = accounts;
                this.isConnected = accounts.length > 0;
                callback(accounts);
            });
        }
    }

    /**
     * Listen for chain changes
     * @param {Function} callback - Callback function
     */
    onChainChanged(callback) {
        if (this.checkMetaMaskInstalled()) {
            window.ethereum.on('chainChanged', (chainId) => {
                this.chainId = parseInt(chainId, 16);
                callback(this.chainId);
            });
        }
    }

    /**
     * Remove all listeners
     */
    removeAllListeners() {
        if (this.checkMetaMaskInstalled()) {
            window.ethereum.removeAllListeners('accountsChanged');
            window.ethereum.removeAllListeners('chainChanged');
        }
    }

    /**
     * Get current connection status
     * @returns {Object} Connection status
     */
    getConnectionStatus() {
        return {
            isMetaMaskInstalled: this.isMetaMaskInstalled,
            isConnected: this.isConnected,
            accounts: this.accounts,
            chainId: this.chainId
        };
    }

    /**
     * Format address for display
     * @param {string} address - Ethereum address
     * @param {number} length - Length to show
     * @returns {string} Formatted address
     */
    formatAddress(address, length = 6) {
        if (!address) return '';
        return `${address.slice(0, length)}...${address.slice(-length)}`;
    }

    /**
     * Validate Ethereum address
     * @param {string} address - Address to validate
     * @returns {boolean} True if valid
     */
    isValidAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    /**
     * Get network name from chain ID
     * @param {number} chainId - Chain ID
     * @returns {string} Network name
     */
    getNetworkName(chainId) {
        const networks = {
            1: 'Ethereum Mainnet',
            11155111: 'Sepolia Testnet',
            1337: 'Localhost',
            31337: 'Hardhat'
        };
        return networks[chainId] || 'Unknown Network';
    }
}

// Create singleton instance
const metaMaskUtils = new MetaMaskUtils();

module.exports = metaMaskUtils;