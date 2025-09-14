class MonitoringSystem {
  constructor() {
    this.metrics = {
      blockchain: new Map(),
      transactions: new Map(),
      batches: new Map(),
      temperature: new Map(),
      system: new Map(),
    };
    this.alerts = [];
    this.healthStatus = "healthy";
    this.startMonitoring();
  }

  // Start system monitoring
  startMonitoring() {
    // Monitor blockchain metrics
    setInterval(() => this.collectBlockchainMetrics(), 10000);

    // Monitor system health
    setInterval(() => this.checkSystemHealth(), 30000);

    // Monitor temperature data
    setInterval(() => this.analyzeTemperatureData(), 60000);
  }

  // Collect blockchain metrics
  collectBlockchainMetrics() {
    const now = new Date().toISOString();
    this.metrics.blockchain.set(now, {
      blockCount: window.app.blockchain.chain.length,
      pendingTransactions: window.app.blockchain.pendingTransactions.length,
      lastBlockTime: window.app.blockchain.getLatestBlock().timestamp,
    });

    // Keep only last hour of data
    this.pruneMetrics(this.metrics.blockchain, 60 * 60 * 1000);
  }

  // Check system health
  checkSystemHealth() {
    const health = {
      timestamp: new Date().toISOString(),
      memory: this.getMemoryUsage(),
      cpu: this.getCPUUsage(),
      storage: this.getStorageStatus(),
      networkLatency: this.measureNetworkLatency(),
    };

    this.metrics.system.set(health.timestamp, health);
    this.updateHealthStatus(health);
  }

  // Analyze temperature data
  analyzeTemperatureData() {
    const violations = this.getTemperatureViolations();
    if (violations.length > 0) {
      this.triggerAlert("TEMPERATURE_VIOLATION", {
        violations,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Memory usage simulation
  getMemoryUsage() {
    return {
      total: 8000000000, // 8GB total
      used: Math.floor(Math.random() * 4000000000), // Random usage up to 4GB
      free: 4000000000, // Remaining
    };
  }

  // CPU usage simulation
  getCPUUsage() {
    return {
      user: Math.random() * 100,
      system: Math.random() * 20,
      idle: Math.random() * 30,
    };
  }

  // Storage status simulation
  getStorageStatus() {
    return {
      total: 100000000000, // 100GB
      used: Math.floor(Math.random() * 50000000000),
      free: 50000000000,
    };
  }

  // Network latency simulation
  measureNetworkLatency() {
    return Math.random() * 100; // 0-100ms latency
  }

  // Update system health status
  updateHealthStatus(health) {
    if (health.cpu.user > 90 || health.memory.used > 7000000000) {
      this.healthStatus = "critical";
      this.triggerAlert("SYSTEM_OVERLOAD", health);
    } else if (health.cpu.user > 70 || health.memory.used > 6000000000) {
      this.healthStatus = "warning";
      this.triggerAlert("SYSTEM_WARNING", health);
    } else {
      this.healthStatus = "healthy";
    }
  }

  // Temperature violation check
  getTemperatureViolations() {
    const violations = [];
    for (const [batchId, sensor] of window.app.iotSimulator.sensors) {
      const currentReading = sensor.readings[sensor.readings.length - 1];
      if (currentReading) {
        if (
          currentReading.temperature < sensor.config.minTemp ||
          currentReading.temperature > sensor.config.maxTemp
        ) {
          violations.push({
            batchId,
            reading: currentReading,
            limits: {
              min: sensor.config.minTemp,
              max: sensor.config.maxTemp,
            },
          });
        }
      }
    }
    return violations;
  }

  // Alert management
  triggerAlert(type, data) {
    const alert = {
      id: this.generateAlertId(),
      type,
      data,
      timestamp: new Date().toISOString(),
      status: "active",
    };
    this.alerts.push(alert);
    this.notifyAlert(alert);
  }

  // Alert notification
  notifyAlert(alert) {
    // Implementation would connect to a notification system
    console.log("Alert:", alert);
  }

  // Metrics management
  pruneMetrics(metricMap, maxAge) {
    const cutoff = Date.now() - maxAge;
    for (const [timestamp] of metricMap) {
      if (new Date(timestamp).getTime() < cutoff) {
        metricMap.delete(timestamp);
      }
    }
  }

  // Analytics
  generateAnalytics() {
    return {
      blockchain: this.analyzeBlockchainMetrics(),
      temperature: this.analyzeTemperatureMetrics(),
      system: this.analyzeSystemMetrics(),
      compliance: this.analyzeComplianceMetrics(),
    };
  }

  // Blockchain metrics analysis
  analyzeBlockchainMetrics() {
    const metrics = Array.from(this.metrics.blockchain.values());
    return {
      averageBlockTime: this.calculateAverageBlockTime(metrics),
      transactionThroughput: this.calculateTransactionThroughput(metrics),
      chainGrowthRate: this.calculateChainGrowthRate(metrics),
    };
  }

  // Temperature metrics analysis
  analyzeTemperatureMetrics() {
    const violations = this.getTemperatureViolations();
    return {
      activeViolations: violations.length,
      violationRate: this.calculateViolationRate(),
      criticalBatches: this.identifyCriticalBatches(),
    };
  }

  // System metrics analysis
  analyzeSystemMetrics() {
    const metrics = Array.from(this.metrics.system.values());
    return {
      averageCPUUsage: this.calculateAverageCPUUsage(metrics),
      memoryTrend: this.calculateMemoryTrend(metrics),
      networkPerformance: this.analyzeNetworkPerformance(metrics),
    };
  }

  // Compliance metrics analysis
  analyzeComplianceMetrics() {
    return {
      fdaCompliance: this.checkFDACompliance(),
      gdprCompliance: this.checkGDPRCompliance(),
      auditStatus: this.checkAuditStatus(),
    };
  }

  // Helper methods
  generateAlertId() {
    return "alt_" + Math.random().toString(36).substr(2, 9);
  }

  calculateAverageBlockTime(metrics) {
    // Implementation
    return 0;
  }

  calculateTransactionThroughput(metrics) {
    // Implementation
    return 0;
  }

  calculateChainGrowthRate(metrics) {
    // Implementation
    return 0;
  }

  calculateViolationRate() {
    // Implementation
    return 0;
  }

  identifyCriticalBatches() {
    // Implementation
    return [];
  }

  calculateAverageCPUUsage(metrics) {
    // Implementation
    return 0;
  }

  calculateMemoryTrend(metrics) {
    // Implementation
    return [];
  }

  analyzeNetworkPerformance(metrics) {
    // Implementation
    return {};
  }

  checkFDACompliance() {
    // Implementation
    return true;
  }

  checkGDPRCompliance() {
    // Implementation
    return true;
  }

  checkAuditStatus() {
    // Implementation
    return "compliant";
  }
}

// Export the monitoring system
if (typeof module !== "undefined" && module.exports) {
  module.exports = MonitoringSystem;
}
