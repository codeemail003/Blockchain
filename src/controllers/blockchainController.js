const BlockchainService = require('../services/blockchainService');
const logger = require('../utils/logger');

/**
 * Blockchain Controller for EVM-compatible pharmaceutical blockchain
 * Handles API endpoints for smart contract interactions
 */
class BlockchainController {
    constructor() {
        this.blockchainService = new BlockchainService();
        this.initialize();
    }

    async initialize() {
        try {
            await this.blockchainService.initialize();
            logger.info('✅ Blockchain Controller initialized');
        } catch (error) {
            logger.error('❌ Blockchain Controller initialization failed:', error);
        }
    }

    /**
     * Connect to MetaMask
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async connectMetaMask(req, res) {
        try {
            const result = await this.blockchainService.connectMetaMask();
            res.json(result);
        } catch (error) {
            logger.error('MetaMask connection error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get network information
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getNetworkInfo(req, res) {
        try {
            const result = await this.blockchainService.getNetworkInfo();
            res.json(result);
        } catch (error) {
            logger.error('Network info error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Switch network
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async switchNetwork(req, res) {
        try {
            const { chainId } = req.body;
            const result = await this.blockchainService.switchNetwork(chainId);
            res.json(result);
        } catch (error) {
            logger.error('Network switch error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Deploy PharbitCore contract
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deployPharbitCore(req, res) {
        try {
            const result = await this.blockchainService.deployPharbitCore(req.body);
            res.json(result);
        } catch (error) {
            logger.error('PharbitCore deployment error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Deploy ComplianceManager contract
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deployComplianceManager(req, res) {
        try {
            const result = await this.blockchainService.deployComplianceManager(req.body);
            res.json(result);
        } catch (error) {
            logger.error('ComplianceManager deployment error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Deploy BatchNFT contract
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deployBatchNFT(req, res) {
        try {
            const result = await this.blockchainService.deployBatchNFT(req.body);
            res.json(result);
        } catch (error) {
            logger.error('BatchNFT deployment error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Deploy PharbitDeployer contract
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deployPharbitDeployer(req, res) {
        try {
            const result = await this.blockchainService.deployPharbitDeployer(req.body);
            res.json(result);
        } catch (error) {
            logger.error('PharbitDeployer deployment error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Deploy all contracts
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deployAllContracts(req, res) {
        try {
            const result = await this.blockchainService.deployAllContracts(req.body);
            res.json(result);
        } catch (error) {
            logger.error('All contracts deployment error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Load contract from address
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async loadContract(req, res) {
        try {
            const { address, type } = req.body;
            const contract = await this.blockchainService.loadContract(address, type);
            res.json({
                success: true,
                contract: contract
            });
        } catch (error) {
            logger.error('Contract loading error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Create a new batch
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async createBatch(req, res) {
        try {
            const result = await this.blockchainService.createBatch(req.body);
            res.json(result);
        } catch (error) {
            logger.error('Batch creation error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Transfer batch
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async transferBatch(req, res) {
        try {
            const { batchId, to, reason, location } = req.body;
            const result = await this.blockchainService.transferBatch(batchId, to, reason, location);
            res.json(result);
        } catch (error) {
            logger.error('Batch transfer error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get batch information
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getBatch(req, res) {
        try {
            const { batchId } = req.params;
            const result = await this.blockchainService.getBatch(parseInt(batchId));
            res.json(result);
        } catch (error) {
            logger.error('Get batch error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get user batches
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getUserBatches(req, res) {
        try {
            const { address } = req.params;
            const result = await this.blockchainService.getUserBatches(address);
            res.json(result);
        } catch (error) {
            logger.error('Get user batches error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get contract ABI
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getContractABI(req, res) {
        try {
            const { type } = req.params;
            const abi = this.blockchainService.getContractABI(type);
            res.json({
                success: true,
                abi: abi
            });
        } catch (error) {
            logger.error('Get contract ABI error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get deployment status
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getDeploymentStatus(req, res) {
        try {
            const contracts = this.blockchainService.contracts;
            const status = {
                pharbitCore: !!contracts.pharbitCore,
                complianceManager: !!contracts.complianceManager,
                batchNFT: !!contracts.batchNFT,
                pharbitDeployer: !!contracts.pharbitDeployer,
                isConnected: this.blockchainService.isConnected,
                networkId: this.blockchainService.networkId
            };

            res.json({
                success: true,
                status: status
            });
        } catch (error) {
            logger.error('Get deployment status error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get gas estimate for transaction
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getGasEstimate(req, res) {
        try {
            const { method, params } = req.body;
            
            if (!this.blockchainService.contracts.pharbitCore) {
                throw new Error('PharbitCore contract not loaded');
            }

            let gasEstimate;
            switch (method) {
                case 'createBatch':
                    gasEstimate = await this.blockchainService.contracts.pharbitCore.createBatch.estimateGas(
                        ...params
                    );
                    break;
                case 'transferBatch':
                    gasEstimate = await this.blockchainService.contracts.pharbitCore.transferBatch.estimateGas(
                        ...params
                    );
                    break;
                default:
                    throw new Error('Unknown method');
            }

            res.json({
                success: true,
                gasEstimate: gasEstimate.toString()
            });
        } catch (error) {
            logger.error('Gas estimate error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new BlockchainController();