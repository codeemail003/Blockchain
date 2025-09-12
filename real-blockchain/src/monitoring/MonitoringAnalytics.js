/**
 * @fileoverview Enterprise monitoring and analytics system for pharmaceutical blockchain
 * Provides real-time metrics, compliance analytics, performance monitoring, alerts, and predictive analytics
 */

const { EventEmitter } = require('events');
const os = require('os');
const { performance } = require('perf_hooks');

class MonitoringAnalytics extends EventEmitter {
    constructor(blockchain, options = {}) {
        super();
        this.blockchain = blockchain;
        this.metrics = {
            transactions: 0,
            blocks: 0,
            complianceViolations: 0,
            alerts: [],
            performance: [],
            predictive: {},
            lastUpdated: Date.now()
        };
        this.complianceAnalytics = [];
        this.alerts = [];
        this.dashboardSubscribers = new Set();
        this.monitoringInterval = options.monitoringInterval || 5000;
        this.startMonitoring();
    }

    /**
     * Start periodic monitoring
     */
    startMonitoring() {
        this.monitoringTimer = setInterval(() => {
            this.collectMetrics();
            this.runComplianceAnalytics();
            this.runPerformanceMonitoring();
            this.runPredictiveAnalytics();
            this.emitDashboardUpdate();
        }, this.monitoringInterval);
    }

    /**
     * Collect real-time blockchain metrics
     */
    collectMetrics() {
        this.metrics.transactions = this.blockchain.getTransactionCount();
        this.metrics.blocks = this.blockchain.getBlockCount();
        this.metrics.complianceViolations = this.blockchain.getComplianceViolationCount();
        this.metrics.lastUpdated = Date.now();
    }

    /**
     * Run compliance analytics
     */
    runComplianceAnalytics() {
        // Analyze audit logs for violations
        const auditLog = this.blockchain.getAuditLog();
        const violations = auditLog.filter(entry => entry.action === 'COMPLIANCE_VIOLATION');
        this.complianceAnalytics = violations.map(v => ({
            id: v.id,
            details: v.details,
            timestamp: v.timestamp
        }));
        this.metrics.complianceViolations = violations.length;
        if (violations.length > 0) {
            this.triggerAlert('Compliance violation detected', violations);
        }
    }

    /**
     * Run performance monitoring
     */
    runPerformanceMonitoring() {
        const cpuLoad = os.loadavg()[0];
        const memUsage = process.memoryUsage().rss / (1024 * 1024); // MB
        const latency = performance.now();
        this.metrics.performance.push({
            timestamp: Date.now(),
            cpuLoad,
            memUsage,
            latency
        });
        if (cpuLoad > 2.0 || memUsage > 1024) {
            this.triggerAlert('Performance threshold exceeded', { cpuLoad, memUsage });
        }
    }

    /**
     * Run predictive analytics for supply chain
     */
    runPredictiveAnalytics() {
        // Example: Predict batch recall risk based on recent data
        const batches = this.blockchain.getRecentBatches();
        let recallRisk = 0;
        for (const batch of batches) {
            if (batch.temperatureAlerts > 0 || batch.qualityIssues > 0) {
                recallRisk += 1;
            }
        }
        this.metrics.predictive.recallRisk = recallRisk / (batches.length || 1);
        if (this.metrics.predictive.recallRisk > 0.5) {
            this.triggerAlert('High batch recall risk', { recallRisk: this.metrics.predictive.recallRisk });
        }
    }

    /**
     * Trigger an alert and notify subscribers
     */
    triggerAlert(message, details) {
        const alert = {
            id: Math.random().toString(36).substr(2, 9),
            message,
            details,
            timestamp: Date.now()
        };
        this.alerts.push(alert);
        this.metrics.alerts.push(alert);
        this.emit('alert', alert);
        this.emitDashboardUpdate();
    }

    /**
     * Subscribe to dashboard updates
     */
    subscribeDashboard(subscriber) {
        this.dashboardSubscribers.add(subscriber);
    }

    /**
     * Unsubscribe from dashboard updates
     */
    unsubscribeDashboard(subscriber) {
        this.dashboardSubscribers.delete(subscriber);
    }

    /**
     * Emit dashboard update to all subscribers
     */
    emitDashboardUpdate() {
        for (const subscriber of this.dashboardSubscribers) {
            subscriber(this.getDashboardData());
        }
    }

    /**
     * Get dashboard data
     */
    getDashboardData() {
        return {
            metrics: this.metrics,
            complianceAnalytics: this.complianceAnalytics,
            alerts: this.alerts.slice(-10), // last 10 alerts
            performance: this.metrics.performance.slice(-10), // last 10 performance samples
            predictive: this.metrics.predictive
        };
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        clearInterval(this.monitoringTimer);
    }
}

module.exports = MonitoringAnalytics;
