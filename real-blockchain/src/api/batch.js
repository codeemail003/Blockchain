/**
 * @fileoverview Batch management API endpoints
 */

const express = require('express');
const router = express.Router();
const { validateBatchData } = require('../validation/batch-validation');
const SecurityManager = require('../security/security-manager');
const PharmaceuticalFeatures = require('../pharma/PharmaceuticalFeatures');
const IoTGateway = require('../iot-gateway');

// Initialize components
const security = new SecurityManager();
const pharmaFeatures = new PharmaceuticalFeatures();
const iotGateway = new IoTGateway();

/**
 * Create a new pharmaceutical batch
 * POST /api/batch/create
 */
router.post('/create', async (req, res) => {
    try {
        // Validate authorization
        const token = req.headers.authorization?.split(' ')[1];
        if (!security.authorize(token, 'createBatch')) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'AUTH002',
                    message: 'Unauthorized to create batches'
                }
            });
        }

        // Validate batch data
        const batchData = req.body;
        const validationResult = validateBatchData(batchData);
        if (!validationResult.valid) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'BATCH001',
                    message: 'Invalid batch data',
                    details: validationResult.errors
                }
            });
        }

        // Create batch in pharmaceutical system
        const batch = await pharmaFeatures.createBatch({
            ...batchData,
            createdBy: security.getUserFromToken(token),
            createdAt: new Date().toISOString()
        });

        // Set up IoT monitoring if temperature monitoring is required
        if (batchData.storageConditions?.temperature) {
            await iotGateway.registerDevice(batch.id, {
                type: 'temperature',
                thresholds: batchData.storageConditions.temperature,
                location: batchData.location
            });
        }

        // Return success response
        res.status(201).json({
            success: true,
            data: {
                batchId: batch.id,
                status: batch.status,
                created: batch.createdAt,
                monitoring: {
                    temperature: !!batch.temperatureMonitoring,
                    humidity: !!batch.humidityMonitoring
                }
            }
        });

    } catch (error) {
        console.error('Batch creation error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'BATCH002',
                message: 'Failed to create batch',
                details: error.message
            }
        });
    }
});

/**
 * Get batch details
 * GET /api/batch/:batchId
 */
router.get('/:batchId', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!security.authorize(token, 'viewBatch')) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'AUTH002',
                    message: 'Unauthorized to view batch details'
                }
            });
        }

        const batchId = req.params.batchId;
        const batch = await pharmaFeatures.getBatch(batchId);
        
        if (!batch) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'BATCH003',
                    message: 'Batch not found'
                }
            });
        }

        // Get latest monitoring data
        const temperatureData = await iotGateway.getCurrentReading(batchId);

        res.json({
            success: true,
            data: {
                ...batch,
                currentConditions: temperatureData
            }
        });

    } catch (error) {
        console.error('Batch retrieval error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'BATCH004',
                message: 'Failed to retrieve batch details',
                details: error.message
            }
        });
    }
});

/**
 * Update batch details
 * PUT /api/batch/:batchId
 */
router.put('/:batchId', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!security.authorize(token, 'updateBatch')) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'AUTH002',
                    message: 'Unauthorized to update batch'
                }
            });
        }

        const batchId = req.params.batchId;
        const updateData = req.body;

        // Validate update data
        const validationResult = validateBatchData(updateData, true);
        if (!validationResult.valid) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'BATCH005',
                    message: 'Invalid update data',
                    details: validationResult.errors
                }
            });
        }

        // Update batch
        const updatedBatch = await pharmaFeatures.updateBatch(batchId, {
            ...updateData,
            updatedBy: security.getUserFromToken(token),
            updatedAt: new Date().toISOString()
        });

        res.json({
            success: true,
            data: updatedBatch
        });

    } catch (error) {
        console.error('Batch update error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'BATCH006',
                message: 'Failed to update batch',
                details: error.message
            }
        });
    }
});

/**
 * Add quality control data
 * POST /api/batch/:batchId/quality
 */
router.post('/:batchId/quality', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!security.authorize(token, 'addQualityData')) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'AUTH002',
                    message: 'Unauthorized to add quality data'
                }
            });
        }

        const batchId = req.params.batchId;
        const qualityData = req.body;

        const result = await pharmaFeatures.addQualityCheck(batchId, {
            ...qualityData,
            performedBy: security.getUserFromToken(token),
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Quality data error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'BATCH007',
                message: 'Failed to add quality data',
                details: error.message
            }
        });
    }
});

module.exports = router;