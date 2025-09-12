/**
 * @fileoverview MetaMask integration for PharbitChain
 * Handles wallet management and transaction signing using MetaMask
 */

const Web3 = require('web3');
const { EventEmitter } = require('events');

class MetaMaskIntegration extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.web3 = null;
        this.accounts = [];
        this.networkId = null;
        this.initialized = false;
    }

    /**
     * Initialize MetaMask integration
     */
    async initialize() {
        try {
            // Check if MetaMask is installed
            if (typeof window.ethereum === 'undefined') {
                throw new Error('MetaMask is not installed');
            }

            // Create Web3 instance
            this.web3 = new Web3(window.ethereum);

            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });

            // Get connected accounts
            this.accounts = await this.web3.eth.getAccounts();

            // Get network ID
            this.networkId = await this.web3.eth.net.getId();

            // Setup event listeners
            this.setupEventListeners();

            this.initialized = true;
            this.emit('initialized', {
                accounts: this.accounts,
                networkId: this.networkId
            });

        } catch (error) {
            console.error('MetaMask initialization failed:', error);
            throw error;
        }
    }

    /**
     * Setup MetaMask event listeners
     */
    setupEventListeners() {
        // Account changes
        window.ethereum.on('accountsChanged', (accounts) => {
            this.accounts = accounts;
            this.emit('accountsChanged', accounts);
        });

        // Network changes
        window.ethereum.on('networkChanged', (networkId) => {
            this.networkId = networkId;
            this.emit('networkChanged', networkId);
        });

        // Connection status
        window.ethereum.on('connect', (connectInfo) => {
            this.emit('connect', connectInfo);
        });

        // Disconnection
        window.ethereum.on('disconnect', (error) => {
            this.emit('disconnect', error);
        });
    }

    /**
     * Get current account
     */
    getCurrentAccount() {
        return this.accounts[0];
    }

    /**
     * Sign transaction using MetaMask
     */
    async signTransaction(transaction) {
        try {
            if (!this.initialized) {
                throw new Error('MetaMask not initialized');
            }

            const account = this.getCurrentAccount();
            if (!account) {
                throw new Error('No account selected in MetaMask');
            }

            // Prepare transaction for signing
            const tx = {
                from: account,
                to: transaction.to,
                value: this.web3.utils.toWei(transaction.amount.toString(), 'ether'),
                gas: transaction.gas || '21000',
                gasPrice: await this.web3.eth.getGasPrice(),
                nonce: await this.web3.eth.getTransactionCount(account),
                data: transaction.data || ''
            };

            // Sign transaction with MetaMask
            const signedTx = await window.ethereum.request({
                method: 'eth_signTransaction',
                params: [tx]
            });

            return signedTx;

        } catch (error) {
            console.error('Transaction signing failed:', error);
            throw error;
        }
    }

    /**
     * Send transaction using MetaMask
     */
    async sendTransaction(transaction) {
        try {
            if (!this.initialized) {
                throw new Error('MetaMask not initialized');
            }

            const account = this.getCurrentAccount();
            if (!account) {
                throw new Error('No account selected in MetaMask');
            }

            // Prepare transaction
            const tx = {
                from: account,
                to: transaction.to,
                value: this.web3.utils.toWei(transaction.amount.toString(), 'ether'),
                gas: transaction.gas || '21000',
                data: transaction.data || ''
            };

            // Send transaction with MetaMask
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [tx]
            });

            return txHash;

        } catch (error) {
            console.error('Transaction send failed:', error);
            throw error;
        }
    }

    /**
     * Sign message using MetaMask
     */
    async signMessage(message) {
        try {
            if (!this.initialized) {
                throw new Error('MetaMask not initialized');
            }

            const account = this.getCurrentAccount();
            if (!account) {
                throw new Error('No account selected in MetaMask');
            }

            // Sign message
            const signature = await window.ethereum.request({
                method: 'personal_sign',
                params: [message, account]
            });

            return signature;

        } catch (error) {
            console.error('Message signing failed:', error);
            throw error;
        }
    }

    /**
     * Get account balance
     */
    async getBalance(address = null) {
        try {
            const account = address || this.getCurrentAccount();
            if (!account) {
                throw new Error('No account specified');
            }

            const balance = await this.web3.eth.getBalance(account);
            return this.web3.utils.fromWei(balance, 'ether');

        } catch (error) {
            console.error('Balance check failed:', error);
            throw error;
        }
    }

    /**
     * Add custom token to MetaMask
     */
    async addToken(token) {
        try {
            const wasAdded = await window.ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20',
                    options: {
                        address: token.address,
                        symbol: token.symbol,
                        decimals: token.decimals,
                        image: token.image
                    }
                }
            });

            return wasAdded;

        } catch (error) {
            console.error('Token addition failed:', error);
            throw error;
        }
    }

    /**
     * Switch Ethereum network
     */
    async switchNetwork(networkId) {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${networkId.toString(16)}` }]
            });

        } catch (error) {
            console.error('Network switch failed:', error);
            throw error;
        }
    }
}

module.exports = MetaMaskIntegration;