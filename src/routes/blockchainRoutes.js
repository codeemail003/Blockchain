const express = require('express');
const { body, param, query } = require('express-validator');
const blockchainController = require('../controllers/blockchainController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// ============ CONNECTION ROUTES ============

/**
 * @route POST /api/blockchain/connect
 * @desc Connect to MetaMask
 * @access Public
 */
router.post('/connect', blockchainController.connectMetaMask);

/**
 * @route GET /api/blockchain/network
 * @desc Get network information
 * @access Public
 */
router.get('/network', blockchainController.getNetworkInfo);

/**
 * @route POST /api/blockchain/switch-network
 * @desc Switch network
 * @access Public
 */
router.post('/switch-network', [
    body('chainId').isNumeric().withMessage('Chain ID must be a number')
], blockchainController.switchNetwork);

// ============ DEPLOYMENT ROUTES ============

/**
 * @route POST /api/blockchain/deploy/pharbit-core
 * @desc Deploy PharbitCore contract
 * @access Private
 */
router.post('/deploy/pharbit-core', authMiddleware, blockchainController.deployPharbitCore);

/**
 * @route POST /api/blockchain/deploy/compliance-manager
 * @desc Deploy ComplianceManager contract
 * @access Private
 */
router.post('/deploy/compliance-manager', authMiddleware, blockchainController.deployComplianceManager);

/**
 * @route POST /api/blockchain/deploy/batch-nft
 * @desc Deploy BatchNFT contract
 * @access Private
 */
router.post('/deploy/batch-nft', [
    authMiddleware,
    body('name').notEmpty().withMessage('NFT name is required'),
    body('symbol').notEmpty().withMessage('NFT symbol is required'),
    body('baseTokenURI').isURL().withMessage('Base token URI must be a valid URL'),
    body('contractURI').isURL().withMessage('Contract URI must be a valid URL')
], blockchainController.deployBatchNFT);

/**
 * @route POST /api/blockchain/deploy/pharbit-deployer
 * @desc Deploy PharbitDeployer contract
 * @access Private
 */
router.post('/deploy/pharbit-deployer', authMiddleware, blockchainController.deployPharbitDeployer);

/**
 * @route POST /api/blockchain/deploy/all
 * @desc Deploy all contracts
 * @access Private
 */
router.post('/deploy/all', [
    authMiddleware,
    body('nftName').optional().isString().withMessage('NFT name must be a string'),
    body('nftSymbol').optional().isString().withMessage('NFT symbol must be a string'),
    body('baseTokenURI').optional().isURL().withMessage('Base token URI must be a valid URL'),
    body('contractURI').optional().isURL().withMessage('Contract URI must be a valid URL')
], blockchainController.deployAllContracts);

/**
 * @route POST /api/blockchain/load-contract
 * @desc Load contract from address
 * @access Private
 */
router.post('/load-contract', [
    authMiddleware,
    body('address').isEthereumAddress().withMessage('Invalid Ethereum address'),
    body('type').isIn(['pharbitCore', 'complianceManager', 'batchNFT', 'pharbitDeployer']).withMessage('Invalid contract type')
], blockchainController.loadContract);

// ============ BATCH MANAGEMENT ROUTES ============

/**
 * @route POST /api/blockchain/batch/create
 * @desc Create a new batch
 * @access Private
 */
router.post('/batch/create', [
    authMiddleware,
    body('drugName').notEmpty().withMessage('Drug name is required'),
    body('drugCode').notEmpty().withMessage('Drug code is required'),
    body('manufacturer').notEmpty().withMessage('Manufacturer is required'),
    body('quantity').isNumeric().withMessage('Quantity must be a number'),
    body('productionDate').isNumeric().withMessage('Production date must be a timestamp'),
    body('expiryDate').isNumeric().withMessage('Expiry date must be a timestamp'),
    body('batchNumber').notEmpty().withMessage('Batch number is required'),
    body('serialNumbers').notEmpty().withMessage('Serial numbers are required'),
    body('metadataKeys').optional().isArray().withMessage('Metadata keys must be an array'),
    body('metadataValues').optional().isArray().withMessage('Metadata values must be an array')
], blockchainController.createBatch);

/**
 * @route POST /api/blockchain/batch/transfer
 * @desc Transfer batch
 * @access Private
 */
router.post('/batch/transfer', [
    authMiddleware,
    body('batchId').isNumeric().withMessage('Batch ID must be a number'),
    body('to').isEthereumAddress().withMessage('Invalid recipient address'),
    body('reason').notEmpty().withMessage('Transfer reason is required'),
    body('location').notEmpty().withMessage('Location is required')
], blockchainController.transferBatch);

/**
 * @route GET /api/blockchain/batch/:batchId
 * @desc Get batch information
 * @access Public
 */
router.get('/batch/:batchId', [
    param('batchId').isNumeric().withMessage('Batch ID must be a number')
], blockchainController.getBatch);

/**
 * @route GET /api/blockchain/batch/user/:address
 * @desc Get user batches
 * @access Public
 */
router.get('/batch/user/:address', [
    param('address').isEthereumAddress().withMessage('Invalid Ethereum address')
], blockchainController.getUserBatches);

// ============ CONTRACT ROUTES ============

/**
 * @route GET /api/blockchain/contract/abi/:type
 * @desc Get contract ABI
 * @access Public
 */
router.get('/contract/abi/:type', [
    param('type').isIn(['pharbitCore', 'complianceManager', 'batchNFT', 'pharbitDeployer']).withMessage('Invalid contract type')
], blockchainController.getContractABI);

/**
 * @route GET /api/blockchain/deployment/status
 * @desc Get deployment status
 * @access Public
 */
router.get('/deployment/status', blockchainController.getDeploymentStatus);

// ============ UTILITY ROUTES ============

/**
 * @route POST /api/blockchain/gas-estimate
 * @desc Get gas estimate for transaction
 * @access Public
 */
router.post('/gas-estimate', [
    body('method').notEmpty().withMessage('Method is required'),
    body('params').isArray().withMessage('Params must be an array')
], blockchainController.getGasEstimate);

module.exports = router;