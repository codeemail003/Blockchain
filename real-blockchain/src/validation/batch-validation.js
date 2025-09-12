/**
 * @fileoverview Batch data validation functions
 */

const validateBatchData = (data, isUpdate = false) => {
    const errors = [];

    // Skip required fields check for updates
    if (!isUpdate) {
        // Required fields
        const requiredFields = ['productId', 'quantity', 'manufacturingDate'];
        requiredFields.forEach(field => {
            if (!data[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        });
    }

    // Validate dates if present
    if (data.manufacturingDate && !isValidDate(data.manufacturingDate)) {
        errors.push('Invalid manufacturing date format');
    }
    if (data.expiryDate && !isValidDate(data.expiryDate)) {
        errors.push('Invalid expiry date format');
    }

    // Validate quantity if present
    if (data.quantity !== undefined) {
        if (typeof data.quantity !== 'number' || data.quantity <= 0) {
            errors.push('Quantity must be a positive number');
        }
    }

    // Validate storage conditions if present
    if (data.storageConditions) {
        if (data.storageConditions.temperature) {
            const temp = data.storageConditions.temperature;
            if (!temp.min || !temp.max || temp.min >= temp.max) {
                errors.push('Invalid temperature range');
            }
        }
        if (data.storageConditions.humidity) {
            const humidity = data.storageConditions.humidity;
            if (!humidity.min || !humidity.max || humidity.min >= humidity.max) {
                errors.push('Invalid humidity range');
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
};

module.exports = {
    validateBatchData
};