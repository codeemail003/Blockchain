/**
 * @fileoverview Blockchain Controller for PharbitChain
 * Handles blockchain operations and transaction management
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/blockchain/status:
 *   get:
 *     summary: Get blockchain status and statistics
 *     tags: [Blockchain]
 *     responses:
 *       200:
 *         description: Blockchain status retrieved successfully
 */
router.get('/status', async (req, res) => {
    try {
        const stats = req.blockchain.getStats();
        
        res.json({
            success: true,
            blockchain: {
                ...stats,
                isHealthy: req.blockchain.validateChain(),
                lastBlockTime: req.blockchain.getLatestBlock()?.timestamp,
                pendingTransactions: req.blockchain.pendingTransactions.length
            }
        });

    } catch (error) {
        logger.error('Failed to get blockchain status:', error);
        res.status(500).json({
            error: 'Failed to get blockchain status',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/blockchain/transaction:
 *   post:
 *     summary: Add a new transaction to the blockchain
 *     tags: [Blockchain]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - from
 *               - to
 *               - amount
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [BATCH_CREATE, BATCH_UPDATE, BATCH_TRANSFER, DOCUMENT_UPLOAD, DOCUMENT_UPDATE, COMPLIANCE_CHECK]
 *               from:
 *                 type: string
 *               to:
 *                 type: string
 *               amount:
 *                 type: number
 *               data:
 *                 type: object
 *               signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction added successfully
 *       400:
 *         description: Invalid transaction data
 */
router.post('/transaction', [
    req.authService.authenticate,
    body('type').isIn(['BATCH_CREATE', 'BATCH_UPDATE', 'BATCH_TRANSFER', 'DOCUMENT_UPLOAD', 'DOCUMENT_UPDATE', 'COMPLIANCE_CHECK']),
    body('from').notEmpty(),
    body('to').notEmpty(),
    body('amount').isNumeric(),
    body('data').optional().isObject()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const transactionData = {
            ...req.body,
            timestamp: new Date().toISOString(),
            uploaderId: req.user.id
        };

        // Calculate transaction hash
        const transactionHash = req.blockchain.calculateTransactionHash(transactionData);
        transactionData.hash = transactionHash;

        // Add transaction to blockchain
        const success = req.blockchain.addTransaction(transactionData);
        
        if (!success) {
            return res.status(400).json({
                error: 'Transaction validation failed',
                message: 'Invalid transaction data or duplicate transaction'
            });
        }

        logger.transaction(transactionData, {
            userId: req.user.id,
            userRole: req.user.role
        });

        res.json({
            success: true,
            transaction: {
                hash: transactionHash,
                type: transactionData.type,
                from: transactionData.from,
                to: transactionData.to,
                amount: transactionData.amount,
                timestamp: transactionData.timestamp,
                status: 'pending'
            },
            message: 'Transaction added to pending pool'
        });

    } catch (error) {
        logger.error('Transaction creation failed:', error);
        res.status(400).json({
            error: 'Transaction creation failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/blockchain/mine:
 *   post:
 *     summary: Mine a new block
 *     tags: [Blockchain]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Block mined successfully
 *       400:
 *         description: Mining failed
 */
router.post('/mine', req.authService.authenticate, async (req, res) => {
    try {
        const miningRewardAddress = req.body.miningAddress || req.user.id;
        const block = await req.blockchain.mineBlock(miningRewardAddress);
        
        logger.logBlockMining(block, {
            miner: req.user.id,
            rewardAddress: miningRewardAddress
        });

        res.json({
            success: true,
            block: {
                index: block.index,
                hash: block.hash,
                previousHash: block.previousHash,
                timestamp: block.timestamp,
                transactionCount: block.transactions.length,
                difficulty: block.difficulty,
                nonce: block.nonce,
                blockTime: block.blockTime
            },
            message: 'Block mined successfully'
        });

    } catch (error) {
        logger.error('Block mining failed:', error);
        res.status(400).json({
            error: 'Block mining failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/blockchain/start-mining:
 *   post:
 *     summary: Start automatic mining
 *     tags: [Blockchain]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               miningAddress:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mining started successfully
 */
router.post('/start-mining', req.authService.authenticate, async (req, res) => {
    try {
        const miningAddress = req.body.miningAddress || req.user.id;
        req.blockchain.startMining(miningAddress);
        
        logger.blockchain('Mining started', {
            miner: req.user.id,
            miningAddress
        });

        res.json({
            success: true,
            message: 'Automatic mining started',
            miningAddress
        });

    } catch (error) {
        logger.error('Failed to start mining:', error);
        res.status(400).json({
            error: 'Failed to start mining',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/blockchain/stop-mining:
 *   post:
 *     summary: Stop automatic mining
 *     tags: [Blockchain]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mining stopped successfully
 */
router.post('/stop-mining', req.authService.authenticate, async (req, res) => {
    try {
        req.blockchain.stopMining();
        
        logger.blockchain('Mining stopped', {
            stoppedBy: req.user.id
        });

        res.json({
            success: true,
            message: 'Automatic mining stopped'
        });

    } catch (error) {
        logger.error('Failed to stop mining:', error);
        res.status(400).json({
            error: 'Failed to stop mining',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/blockchain/block/{index}:
 *   get:
 *     summary: Get block by index
 *     tags: [Blockchain]
 *     parameters:
 *       - in: path
 *         name: index
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Block retrieved successfully
 *       404:
 *         description: Block not found
 */
router.get('/block/:index', async (req, res) => {
    try {
        const blockIndex = parseInt(req.params.index);
        const block = req.blockchain.getBlock(blockIndex);
        
        if (!block) {
            return res.status(404).json({
                error: 'Block not found',
                message: `Block at index ${blockIndex} does not exist`
            });
        }

        res.json({
            success: true,
            block
        });

    } catch (error) {
        logger.error('Failed to get block:', error);
        res.status(400).json({
            error: 'Failed to get block',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/blockchain/block/hash/{hash}:
 *   get:
 *     summary: Get block by hash
 *     tags: [Blockchain]
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Block retrieved successfully
 *       404:
 *         description: Block not found
 */
router.get('/block/hash/:hash', async (req, res) => {
    try {
        const blockHash = req.params.hash;
        const block = req.blockchain.getBlockByHash(blockHash);
        
        if (!block) {
            return res.status(404).json({
                error: 'Block not found',
                message: `Block with hash ${blockHash} does not exist`
            });
        }

        res.json({
            success: true,
            block
        });

    } catch (error) {
        logger.error('Failed to get block by hash:', error);
        res.status(400).json({
            error: 'Failed to get block by hash',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/blockchain/transaction/{hash}:
 *   get:
 *     summary: Get transaction by hash
 *     tags: [Blockchain]
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 *       404:
 *         description: Transaction not found
 */
router.get('/transaction/:hash', async (req, res) => {
    try {
        const transactionHash = req.params.hash;
        const transaction = req.blockchain.getTransaction(transactionHash);
        
        if (!transaction) {
            return res.status(404).json({
                error: 'Transaction not found',
                message: `Transaction with hash ${transactionHash} does not exist`
            });
        }

        res.json({
            success: true,
            transaction
        });

    } catch (error) {
        logger.error('Failed to get transaction:', error);
        res.status(400).json({
            error: 'Failed to get transaction',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/blockchain/address/{address}/transactions:
 *   get:
 *     summary: Get transactions by address
 *     tags: [Blockchain]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 */
router.get('/address/:address/transactions', async (req, res) => {
    try {
        const address = req.params.address;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        const transactions = req.blockchain.getTransactionsByAddress(address);
        
        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedTransactions = transactions.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            transactions: paginatedTransactions,
            pagination: {
                page,
                limit,
                total: transactions.length,
                pages: Math.ceil(transactions.length / limit)
            }
        });

    } catch (error) {
        logger.error('Failed to get transactions by address:', error);
        res.status(400).json({
            error: 'Failed to get transactions by address',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/blockchain/batch/{batchId}/history:
 *   get:
 *     summary: Get batch transaction history
 *     tags: [Blockchain]
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Batch history retrieved successfully
 */
router.get('/batch/:batchId/history', async (req, res) => {
    try {
        const batchId = req.params.batchId;
        const transactions = req.blockchain.getBatchHistory(batchId);
        
        res.json({
            success: true,
            batchId,
            transactions,
            count: transactions.length
        });

    } catch (error) {
        logger.error('Failed to get batch history:', error);
        res.status(400).json({
            error: 'Failed to get batch history',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/blockchain/validate:
 *   get:
 *     summary: Validate entire blockchain
 *     tags: [Blockchain]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Blockchain validation result
 */
router.get('/validate', req.authService.authenticate, async (req, res) => {
    try {
        const isValid = req.blockchain.validateChain();
        
        logger.blockchain('Blockchain validation', {
            isValid,
            validatedBy: req.user.id
        });

        res.json({
            success: true,
            isValid,
            message: isValid ? 'Blockchain is valid' : 'Blockchain validation failed'
        });

    } catch (error) {
        logger.error('Blockchain validation failed:', error);
        res.status(500).json({
            error: 'Blockchain validation failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/blockchain/pending:
 *   get:
 *     summary: Get pending transactions
 *     tags: [Blockchain]
 *     responses:
 *       200:
 *         description: Pending transactions retrieved successfully
 */
router.get('/pending', async (req, res) => {
    try {
        const pendingTransactions = req.blockchain.pendingTransactions;
        
        res.json({
            success: true,
            pendingTransactions,
            count: pendingTransactions.length
        });

    } catch (error) {
        logger.error('Failed to get pending transactions:', error);
        res.status(400).json({
            error: 'Failed to get pending transactions',
            message: error.message
        });
    }
});

module.exports = router;