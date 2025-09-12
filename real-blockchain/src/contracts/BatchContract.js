/**
 * @fileoverview Smart contract for managing pharmaceutical batches
 */

const Contract = require('./base/Contract');
const { validateBatchData } = require('../validation/batch-validation');

class BatchContract extends Contract {
    constructor() {
        super('BatchContract');
        this.batches = new Map();
    }

    async createBatch(data) {
        const validation = validateBatchData(data);
        if (!validation.valid) {
            throw new Error(`Invalid batch data: ${validation.errors.join(', ')}`);
        }

        const batchId = this.generateBatchId(data);
        const batch = {
            id: batchId,
            ...data,
            status: 'created',
            createdAt: new Date().toISOString(),
            transactions: []
        };

        this.batches.set(batchId, batch);
        await this.emit('BatchCreated', { batchId, data: batch });
        
        return batch;
    }

    async getBatch(batchId) {
        const batch = this.batches.get(batchId);
        if (!batch) {
            throw new Error(`Batch not found: ${batchId}`);
        }
        return batch;
    }

    async updateBatch(batchId, data) {
        const batch = await this.getBatch(batchId);
        const validation = validateBatchData(data, true);
        
        if (!validation.valid) {
            throw new Error(`Invalid update data: ${validation.errors.join(', ')}`);
        }

        const updatedBatch = {
            ...batch,
            ...data,
            updatedAt: new Date().toISOString()
        };

        this.batches.set(batchId, updatedBatch);
        await this.emit('BatchUpdated', { batchId, data: updatedBatch });
        
        return updatedBatch;
    }

    async addQualityData(batchId, data) {
        const batch = await this.getBatch(batchId);
        
        if (!Array.isArray(batch.qualityChecks)) {
            batch.qualityChecks = [];
        }

        batch.qualityChecks.push({
            ...data,
            timestamp: new Date().toISOString()
        });

        this.batches.set(batchId, batch);
        await this.emit('QualityDataAdded', { batchId, data });
        
        return batch;
    }

    generateBatchId(data) {
        const timestamp = Date.now().toString(36);
        const productId = data.productId.substring(0, 6);
        const random = Math.random().toString(36).substring(2, 5);
        return `BATCH-${productId}-${timestamp}-${random}`.toUpperCase();
    }
}

module.exports = BatchContract;