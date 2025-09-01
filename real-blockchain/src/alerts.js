const fs = require('fs');
const path = require('path');

class AlertSystem {
    constructor(alertPath = './alerts') {
        this.alertPath = alertPath;
        this.alerts = new Map();
        this.notificationSettings = {
            email: {
                enabled: false,
                recipients: []
            },
            sms: {
                enabled: false,
                recipients: []
            },
            webhook: {
                enabled: false,
                url: null
            }
        };
        
        // Create alerts directory if it doesn't exist
        if (!fs.existsSync(this.alertPath)) {
            fs.mkdirSync(this.alertPath, { recursive: true });
        }
        
        // Load existing alerts
        this.loadAlerts();
    }

    /**
     * Add a new alert
     * @param {Object} alert - Alert object
     */
    addAlert(alert) {
        // Validate alert
        this.validateAlert(alert);
        
        // Add timestamp if not present
        if (!alert.timestamp) {
            alert.timestamp = Date.now();
        }
        
        // Add to memory
        this.alerts.set(alert.id, alert);
        
        // Save to disk
        this.saveAlert(alert);
        
        // Send notifications
        this.sendNotifications(alert);
        
        // Log alert
        console.log(`🚨 ALERT: ${alert.severity.toUpperCase()} - ${alert.message}`);
        
        return alert;
    }

    /**
     * Validate alert structure
     * @param {Object} alert - Alert to validate
     */
    validateAlert(alert) {
        if (!alert.id) {
            throw new Error('Alert ID is required');
        }
        
        if (!alert.batchId) {
            throw new Error('Batch ID is required');
        }
        
        if (!alert.type) {
            throw new Error('Alert type is required');
        }
        
        if (!alert.severity || !['info', 'warning', 'critical'].includes(alert.severity)) {
            throw new Error('Alert severity must be info, warning, or critical');
        }
        
        if (!alert.message) {
            throw new Error('Alert message is required');
        }
    }

    /**
     * Save alert to disk
     * @param {Object} alert - Alert to save
     */
    saveAlert(alert) {
        const filePath = path.join(this.alertPath, `${alert.id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(alert, null, 2));
    }

    /**
     * Load alerts from disk
     */
    loadAlerts() {
        try {
            const files = fs.readdirSync(this.alertPath);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(this.alertPath, file);
                    const alertData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    this.alerts.set(alertData.id, alertData);
                }
            }
            
            console.log(`📋 Loaded ${this.alerts.size} alerts from disk`);
        } catch (error) {
            console.error('Error loading alerts:', error);
        }
    }

    /**
     * Get alert by ID
     * @param {string} alertId - Alert identifier
     * @returns {Object} Alert object
     */
    getAlert(alertId) {
        return this.alerts.get(alertId);
    }

    /**
     * Get all alerts
     * @param {Object} filters - Optional filters
     * @returns {Array} Array of alerts
     */
    getAlerts(filters = {}) {
        let alerts = Array.from(this.alerts.values());
        
        // Apply filters
        if (filters.batchId) {
            alerts = alerts.filter(alert => alert.batchId === filters.batchId);
        }
        
        if (filters.type) {
            alerts = alerts.filter(alert => alert.type === filters.type);
        }
        
        if (filters.severity) {
            alerts = alerts.filter(alert => alert.severity === filters.severity);
        }
        
        if (filters.active !== undefined) {
            alerts = alerts.filter(alert => alert.active === filters.active);
        }
        
        // Sort by timestamp (newest first)
        alerts.sort((a, b) => b.timestamp - a.timestamp);
        
        return alerts;
    }

    /**
     * Get active alerts
     * @returns {Array} Array of active alerts
     */
    getActiveAlerts() {
        return this.getAlerts({ active: true });
    }

    /**
     * Get critical alerts
     * @returns {Array} Array of critical alerts
     */
    getCriticalAlerts() {
        return this.getAlerts({ severity: 'critical', active: true });
    }

    /**
     * Acknowledge an alert
     * @param {string} alertId - Alert identifier
     * @param {string} acknowledgedBy - Who acknowledged the alert
     * @param {string} notes - Optional notes
     */
    acknowledgeAlert(alertId, acknowledgedBy, notes = '') {
        const alert = this.alerts.get(alertId);
        
        if (!alert) {
            throw new Error('Alert not found');
        }
        
        alert.acknowledged = true;
        alert.acknowledgedBy = acknowledgedBy;
        alert.acknowledgedAt = Date.now();
        alert.acknowledgementNotes = notes;
        
        // Save updated alert
        this.saveAlert(alert);
        
        console.log(`✅ Alert ${alertId} acknowledged by ${acknowledgedBy}`);
        
        return alert;
    }

    /**
     * Resolve an alert
     * @param {string} alertId - Alert identifier
     * @param {string} resolvedBy - Who resolved the alert
     * @param {string} resolution - Resolution description
     */
    resolveAlert(alertId, resolvedBy, resolution = '') {
        const alert = this.alerts.get(alertId);
        
        if (!alert) {
            throw new Error('Alert not found');
        }
        
        alert.resolved = true;
        alert.resolvedBy = resolvedBy;
        alert.resolvedAt = Date.now();
        alert.resolution = resolution;
        alert.active = false;
        
        // Save updated alert
        this.saveAlert(alert);
        
        console.log(`✅ Alert ${alertId} resolved by ${resolvedBy}`);
        
        return alert;
    }

    /**
     * Send notifications for an alert
     * @param {Object} alert - Alert to send notifications for
     */
    async sendNotifications(alert) {
        // Only send notifications for warning and critical alerts
        if (alert.severity === 'info') {
            return;
        }
        
        const notificationData = {
            alertId: alert.id,
            batchId: alert.batchId,
            type: alert.type,
            severity: alert.severity,
            message: alert.message,
            timestamp: alert.timestamp,
            location: alert.location
        };
        
        // Send email notifications
        if (this.notificationSettings.email.enabled) {
            await this.sendEmailNotification(notificationData);
        }
        
        // Send SMS notifications
        if (this.notificationSettings.sms.enabled) {
            await this.sendSMSNotification(notificationData);
        }
        
        // Send webhook notifications
        if (this.notificationSettings.webhook.enabled) {
            await this.sendWebhookNotification(notificationData);
        }
    }

    /**
     * Send email notification
     * @param {Object} notificationData - Notification data
     */
    async sendEmailNotification(notificationData) {
        try {
            // This would integrate with an email service like SendGrid or AWS SES
            console.log(`📧 Email notification sent for alert ${notificationData.alertId}`);
            
            // Mock email sending
            const emailContent = `
                PHARMACEUTICAL ALERT
                
                Severity: ${notificationData.severity.toUpperCase()}
                Type: ${notificationData.type}
                Batch ID: ${notificationData.batchId}
                Message: ${notificationData.message}
                Time: ${new Date(notificationData.timestamp).toISOString()}
                
                Please take immediate action if this is a critical alert.
            `;
            
            console.log('Email content:', emailContent);
            
        } catch (error) {
            console.error('Error sending email notification:', error);
        }
    }

    /**
     * Send SMS notification
     * @param {Object} notificationData - Notification data
     */
    async sendSMSNotification(notificationData) {
        try {
            // This would integrate with an SMS service like Twilio
            console.log(`📱 SMS notification sent for alert ${notificationData.alertId}`);
            
            const smsMessage = `ALERT: ${notificationData.severity.toUpperCase()} - ${notificationData.message} (Batch: ${notificationData.batchId})`;
            console.log('SMS message:', smsMessage);
            
        } catch (error) {
            console.error('Error sending SMS notification:', error);
        }
    }

    /**
     * Send webhook notification
     * @param {Object} notificationData - Notification data
     */
    async sendWebhookNotification(notificationData) {
        try {
            // This would send a POST request to the configured webhook URL
            console.log(`🔗 Webhook notification sent for alert ${notificationData.alertId}`);
            
            // Mock webhook call
            const webhookData = {
                event: 'pharmaceutical_alert',
                data: notificationData,
                timestamp: Date.now()
            };
            
            console.log('Webhook data:', webhookData);
            
        } catch (error) {
            console.error('Error sending webhook notification:', error);
        }
    }

    /**
     * Configure notification settings
     * @param {Object} settings - Notification settings
     */
    configureNotifications(settings) {
        this.notificationSettings = { ...this.notificationSettings, ...settings };
        
        // Save settings to disk
        const settingsPath = path.join(this.alertPath, 'notification-settings.json');
        fs.writeFileSync(settingsPath, JSON.stringify(this.notificationSettings, null, 2));
        
        console.log('📧 Notification settings updated');
    }

    /**
     * Get alert statistics
     * @returns {Object} Alert statistics
     */
    getAlertStats() {
        const alerts = Array.from(this.alerts.values());
        
        const stats = {
            total: alerts.length,
            active: alerts.filter(a => a.active).length,
            critical: alerts.filter(a => a.severity === 'critical' && a.active).length,
            warning: alerts.filter(a => a.severity === 'warning' && a.active).length,
            info: alerts.filter(a => a.severity === 'info' && a.active).length,
            byType: {},
            byBatch: {}
        };
        
        // Count by type
        alerts.forEach(alert => {
            stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
        });
        
        // Count by batch
        alerts.forEach(alert => {
            stats.byBatch[alert.batchId] = (stats.byBatch[alert.batchId] || 0) + 1;
        });
        
        return stats;
    }

    /**
     * Get alerts for a specific batch
     * @param {string} batchId - Batch identifier
     * @returns {Array} Array of alerts for the batch
     */
    getBatchAlerts(batchId) {
        return this.getAlerts({ batchId });
    }

    /**
     * Get temperature alerts for a batch
     * @param {string} batchId - Batch identifier
     * @returns {Array} Array of temperature alerts
     */
    getTemperatureAlerts(batchId) {
        const alerts = this.getAlerts({ batchId, type: 'temperature' });
        return alerts.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Get tampering alerts for a batch
     * @param {string} batchId - Batch identifier
     * @returns {Array} Array of tampering alerts
     */
    getTamperingAlerts(batchId) {
        return this.getAlerts({ batchId, type: 'tampering' });
    }

    /**
     * Export alerts to CSV
     * @param {string} filePath - Output file path
     */
    exportAlertsToCSV(filePath) {
        const alerts = Array.from(this.alerts.values());
        
        const csvHeader = 'ID,Batch ID,Type,Severity,Message,Timestamp,Active,Acknowledged,Resolved\n';
        const csvRows = alerts.map(alert => 
            `${alert.id},${alert.batchId},${alert.type},${alert.severity},"${alert.message}",${alert.timestamp},${alert.active || false},${alert.acknowledged || false},${alert.resolved || false}`
        ).join('\n');
        
        const csvContent = csvHeader + csvRows;
        fs.writeFileSync(filePath, csvContent);
        
        console.log(`📊 Alerts exported to ${filePath}`);
    }

    /**
     * Clear old alerts
     * @param {number} daysOld - Number of days old to clear
     */
    clearOldAlerts(daysOld = 30) {
        const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
        const alertsToRemove = [];
        
        for (const [alertId, alert] of this.alerts) {
            if (alert.timestamp < cutoffTime && alert.resolved) {
                alertsToRemove.push(alertId);
            }
        }
        
        alertsToRemove.forEach(alertId => {
            this.alerts.delete(alertId);
            const filePath = path.join(this.alertPath, `${alertId}.json`);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });
        
        console.log(`🗑️  Cleared ${alertsToRemove.length} old alerts`);
    }
}

module.exports = AlertSystem;