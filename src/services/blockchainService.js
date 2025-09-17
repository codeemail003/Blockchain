const { ethers } = require('ethers');
const Web3 = require('web3');
const logger = require('../utils/logger');

/**
 * Blockchain Service for EVM-compatible pharmaceutical blockchain
 * Handles smart contract interactions, MetaMask integration, and Web3 operations
 */
class BlockchainService {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.web3 = null;
        this.contracts = {};
        this.networkId = null;
        this.isConnected = false;
    }

    /**
     * Initialize blockchain service
     * @param {Object} config - Configuration object
     */
    async initialize(config = {}) {
        try {
            logger.info('🔗 Initializing Blockchain Service...');

            // Initialize Web3
            if (typeof window !== 'undefined' && window.ethereum) {
                this.web3 = new Web3(window.ethereum);
                this.provider = new ethers.BrowserProvider(window.ethereum);
            } else {
                // Fallback to local provider
                const rpcUrl = config.rpcUrl || 'http://localhost:8545';
                this.web3 = new Web3(rpcUrl);
                this.provider = new ethers.JsonRpcProvider(rpcUrl);
            }

            // Get network information
            this.networkId = await this.web3.eth.getChainId();
            logger.info(`🌐 Connected to network: ${this.networkId}`);

            this.isConnected = true;
            logger.info('✅ Blockchain Service initialized');
        } catch (error) {
            logger.error('❌ Blockchain Service initialization failed:', error);
            throw error;
        }
    }

    /**
     * Connect to MetaMask
     * @returns {Promise<Object>} Connection result
     */
    async connectMetaMask() {
        try {
            if (typeof window === 'undefined' || !window.ethereum) {
                throw new Error('MetaMask not detected');
            }

            logger.info('🦊 Connecting to MetaMask...');

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error('No accounts found');
            }

            // Get signer
            this.signer = await this.provider.getSigner();
            const address = await this.signer.getAddress();

            logger.info(`✅ Connected to MetaMask: ${address}`);
            return {
                success: true,
                address: address,
                networkId: this.networkId
            };
        } catch (error) {
            logger.error('❌ MetaMask connection failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Switch network
     * @param {number} chainId - Target chain ID
     * @returns {Promise<Object>} Switch result
     */
    async switchNetwork(chainId) {
        try {
            if (typeof window === 'undefined' || !window.ethereum) {
                throw new Error('MetaMask not available');
            }

            logger.info(`🔄 Switching to network: ${chainId}`);

            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chainId.toString(16)}` }]
            });

            this.networkId = chainId;
            logger.info(`✅ Switched to network: ${chainId}`);
            return { success: true };
        } catch (error) {
            logger.error('❌ Network switch failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Deploy PharbitCore contract
     * @param {Object} params - Deployment parameters
     * @returns {Promise<Object>} Deployment result
     */
    async deployPharbitCore(params = {}) {
        try {
            if (!this.signer) {
                throw new Error('No signer available');
            }

            logger.info('📦 Deploying PharbitCore contract...');

            // Contract ABI and bytecode would be loaded from artifacts
            const contractFactory = new ethers.ContractFactory(
                this.getPharbitCoreABI(),
                this.getPharbitCoreBytecode(),
                this.signer
            );

            const contract = await contractFactory.deploy();
            await contract.waitForDeployment();

            const address = await contract.getAddress();
            this.contracts.pharbitCore = contract;

            logger.info(`✅ PharbitCore deployed at: ${address}`);
            return {
                success: true,
                address: address,
                contract: contract
            };
        } catch (error) {
            logger.error('❌ PharbitCore deployment failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Deploy ComplianceManager contract
     * @param {Object} params - Deployment parameters
     * @returns {Promise<Object>} Deployment result
     */
    async deployComplianceManager(params = {}) {
        try {
            if (!this.signer) {
                throw new Error('No signer available');
            }

            logger.info('📦 Deploying ComplianceManager contract...');

            const contractFactory = new ethers.ContractFactory(
                this.getComplianceManagerABI(),
                this.getComplianceManagerBytecode(),
                this.signer
            );

            const contract = await contractFactory.deploy();
            await contract.waitForDeployment();

            const address = await contract.getAddress();
            this.contracts.complianceManager = contract;

            logger.info(`✅ ComplianceManager deployed at: ${address}`);
            return {
                success: true,
                address: address,
                contract: contract
            };
        } catch (error) {
            logger.error('❌ ComplianceManager deployment failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Deploy BatchNFT contract
     * @param {Object} params - Deployment parameters
     * @returns {Promise<Object>} Deployment result
     */
    async deployBatchNFT(params = {}) {
        try {
            if (!this.signer) {
                throw new Error('No signer available');
            }

            const { name, symbol, baseTokenURI, contractURI } = params;

            logger.info('📦 Deploying BatchNFT contract...');

            const contractFactory = new ethers.ContractFactory(
                this.getBatchNFTABI(),
                this.getBatchNFTBytecode(),
                this.signer
            );

            const contract = await contractFactory.deploy(
                name || "PharbitBatch",
                symbol || "PBT",
                baseTokenURI || "https://api.pharbit.com/metadata/",
                contractURI || "https://api.pharbit.com/contract"
            );

            await contract.waitForDeployment();

            const address = await contract.getAddress();
            this.contracts.batchNFT = contract;

            logger.info(`✅ BatchNFT deployed at: ${address}`);
            return {
                success: true,
                address: address,
                contract: contract
            };
        } catch (error) {
            logger.error('❌ BatchNFT deployment failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Deploy PharbitDeployer contract
     * @param {Object} params - Deployment parameters
     * @returns {Promise<Object>} Deployment result
     */
    async deployPharbitDeployer(params = {}) {
        try {
            if (!this.signer) {
                throw new Error('No signer available');
            }

            logger.info('📦 Deploying PharbitDeployer contract...');

            const contractFactory = new ethers.ContractFactory(
                this.getPharbitDeployerABI(),
                this.getPharbitDeployerBytecode(),
                this.signer
            );

            const contract = await contractFactory.deploy();
            await contract.waitForDeployment();

            const address = await contract.getAddress();
            this.contracts.pharbitDeployer = contract;

            logger.info(`✅ PharbitDeployer deployed at: ${address}`);
            return {
                success: true,
                address: address,
                contract: contract
            };
        } catch (error) {
            logger.error('❌ PharbitDeployer deployment failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Deploy all contracts using PharbitDeployer
     * @param {Object} params - Deployment parameters
     * @returns {Promise<Object>} Deployment result
     */
    async deployAllContracts(params = {}) {
        try {
            if (!this.contracts.pharbitDeployer) {
                throw new Error('PharbitDeployer not deployed');
            }

            const {
                nftName = "PharbitBatch",
                nftSymbol = "PBT",
                baseTokenURI = "https://api.pharbit.com/metadata/",
                contractURI = "https://api.pharbit.com/contract"
            } = params;

            logger.info('🚀 Deploying all contracts via PharbitDeployer...');

            const tx = await this.contracts.pharbitDeployer.deployContracts(
                nftName,
                nftSymbol,
                baseTokenURI,
                contractURI
            );

            const receipt = await tx.wait();
            const event = receipt.logs.find(log => {
                try {
                    const parsed = this.contracts.pharbitDeployer.interface.parseLog(log);
                    return parsed.name === 'ContractsDeployed';
                } catch (e) {
                    return false;
                }
            });

            if (event) {
                const parsed = this.contracts.pharbitDeployer.interface.parseLog(event);
                const [deployer, pharbitCore, complianceManager, batchNFT, version] = parsed.args;

                logger.info('✅ All contracts deployed successfully');
                return {
                    success: true,
                    contracts: {
                        pharbitCore: pharbitCore,
                        complianceManager: complianceManager,
                        batchNFT: batchNFT
                    },
                    deployer: deployer,
                    version: version
                };
            } else {
                throw new Error('Deployment event not found');
            }
        } catch (error) {
            logger.error('❌ All contracts deployment failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Load contract from address
     * @param {string} address - Contract address
     * @param {string} type - Contract type
     * @returns {Promise<Object>} Contract instance
     */
    async loadContract(address, type) {
        try {
            if (!this.provider) {
                throw new Error('Provider not initialized');
            }

            const abi = this.getContractABI(type);
            const contract = new ethers.Contract(address, abi, this.signer || this.provider);

            this.contracts[type] = contract;
            logger.info(`✅ ${type} contract loaded at: ${address}`);

            return contract;
        } catch (error) {
            logger.error(`❌ Failed to load ${type} contract:`, error);
            throw error;
        }
    }

    /**
     * Create a new batch
     * @param {Object} batchData - Batch data
     * @returns {Promise<Object>} Transaction result
     */
    async createBatch(batchData) {
        try {
            if (!this.contracts.pharbitCore) {
                throw new Error('PharbitCore contract not loaded');
            }

            const {
                drugName,
                drugCode,
                manufacturer,
                quantity,
                productionDate,
                expiryDate,
                batchNumber,
                serialNumbers,
                metadataKeys = [],
                metadataValues = []
            } = batchData;

            logger.info(`📦 Creating batch: ${batchNumber}`);

            const tx = await this.contracts.pharbitCore.createBatch(
                drugName,
                drugCode,
                manufacturer,
                quantity,
                productionDate,
                expiryDate,
                batchNumber,
                serialNumbers,
                metadataKeys,
                metadataValues
            );

            const receipt = await tx.wait();
            logger.info(`✅ Batch created: ${batchNumber}`);

            return {
                success: true,
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            };
        } catch (error) {
            logger.error('❌ Batch creation failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Transfer batch
     * @param {number} batchId - Batch ID
     * @param {string} to - Recipient address
     * @param {string} reason - Transfer reason
     * @param {string} location - Current location
     * @returns {Promise<Object>} Transaction result
     */
    async transferBatch(batchId, to, reason, location) {
        try {
            if (!this.contracts.pharbitCore) {
                throw new Error('PharbitCore contract not loaded');
            }

            logger.info(`🔄 Transferring batch ${batchId} to ${to}`);

            const tx = await this.contracts.pharbitCore.transferBatch(
                batchId,
                to,
                reason,
                location
            );

            const receipt = await tx.wait();
            logger.info(`✅ Batch ${batchId} transferred`);

            return {
                success: true,
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            };
        } catch (error) {
            logger.error('❌ Batch transfer failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get batch information
     * @param {number} batchId - Batch ID
     * @returns {Promise<Object>} Batch information
     */
    async getBatch(batchId) {
        try {
            if (!this.contracts.pharbitCore) {
                throw new Error('PharbitCore contract not loaded');
            }

            const batch = await this.contracts.pharbitCore.getBatch(batchId);
            return {
                success: true,
                batch: batch
            };
        } catch (error) {
            logger.error('❌ Failed to get batch:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get user batches
     * @param {string} address - User address
     * @returns {Promise<Object>} User batches
     */
    async getUserBatches(address) {
        try {
            if (!this.contracts.pharbitCore) {
                throw new Error('PharbitCore contract not loaded');
            }

            const batches = await this.contracts.pharbitCore.getUserBatches(address);
            return {
                success: true,
                batches: batches
            };
        } catch (error) {
            logger.error('❌ Failed to get user batches:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get network information
     * @returns {Promise<Object>} Network info
     */
    async getNetworkInfo() {
        try {
            const network = await this.provider.getNetwork();
            const blockNumber = await this.provider.getBlockNumber();
            const gasPrice = await this.provider.getGasPrice();

            return {
                success: true,
                network: {
                    chainId: Number(network.chainId),
                    name: network.name,
                    blockNumber: blockNumber,
                    gasPrice: gasPrice.toString()
                }
            };
        } catch (error) {
            logger.error('❌ Failed to get network info:', error);
            return { success: false, error: error.message };
        }
    }

    // ============ CONTRACT ABIs ============
    
    getPharbitCoreABI() {
        // This would be loaded from artifacts in a real implementation
        return require('../../artifacts/contracts/PharbitCore.sol/PharbitCore.json').abi;
    }

    getComplianceManagerABI() {
        return require('../../artifacts/contracts/ComplianceManager.sol/ComplianceManager.json').abi;
    }

    getBatchNFTABI() {
        return require('../../artifacts/contracts/BatchNFT.sol/BatchNFT.json').abi;
    }

    getPharbitDeployerABI() {
        return require('../../artifacts/contracts/PharbitDeployer.sol/PharbitDeployer.json').abi;
    }

    getContractABI(type) {
        switch (type) {
            case 'pharbitCore':
                return this.getPharbitCoreABI();
            case 'complianceManager':
                return this.getComplianceManagerABI();
            case 'batchNFT':
                return this.getBatchNFTABI();
            case 'pharbitDeployer':
                return this.getPharbitDeployerABI();
            default:
                throw new Error(`Unknown contract type: ${type}`);
        }
    }

    // ============ CONTRACT BYTECODES ============
    
    getPharbitCoreBytecode() {
        return require('../../artifacts/contracts/PharbitCore.sol/PharbitCore.json').bytecode;
    }

    getComplianceManagerBytecode() {
        return require('../../artifacts/contracts/ComplianceManager.sol/ComplianceManager.json').bytecode;
    }

    getBatchNFTBytecode() {
        return require('../../artifacts/contracts/BatchNFT.sol/BatchNFT.json').bytecode;
    }

    getPharbitDeployerBytecode() {
        return require('../../artifacts/contracts/PharbitDeployer.sol/PharbitDeployer.json').bytecode;
    }
}

module.exports = BlockchainService;