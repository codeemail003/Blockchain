const os = require('os');
const responseTime = require('response-time');

const metrics = {
    apiResponseTimes: [], // recent ms samples
    txProcessed: 0,
    miningSamples: [], // {timeMs, timestamp}
    getSystemStats() {
        const mem = process.memoryUsage();
        return {
            uptimeSec: process.uptime(),
            rss: mem.rss,
            heapUsed: mem.heapUsed,
            heapTotal: mem.heapTotal,
            external: mem.external,
            cpuLoadAvg: os.loadavg(),
            totalMem: os.totalmem(),
            freeMem: os.freemem()
        };
    },
    recordApi(ms) {
        this.apiResponseTimes.push({ ms, ts: Date.now() });
        if (this.apiResponseTimes.length > 500) this.apiResponseTimes.shift();
    },
    recordTxProcessed() { this.txProcessed += 1; },
    recordMining(timeMs) {
        this.miningSamples.push({ timeMs, ts: Date.now() });
        if (this.miningSamples.length > 100) this.miningSamples.shift();
    },
    summarize() {
        const avgApi = this.apiResponseTimes.length ? (this.apiResponseTimes.reduce((a, b) => a + b.ms, 0) / this.apiResponseTimes.length) : 0;
        const avgMining = this.miningSamples.length ? (this.miningSamples.reduce((a, b) => a + b.timeMs, 0) / this.miningSamples.length) : 0;
        return {
            txProcessed: this.txProcessed,
            avgApiMs: Math.round(avgApi),
            avgMiningMs: Math.round(avgMining),
            recentApiSamples: this.apiResponseTimes.slice(-10)
        };
    }
};

function attachResponseTime(app) {
    app.use(responseTime((req, res, time) => {
        metrics.recordApi(time);
    }));
}

module.exports = { metrics, attachResponseTime };

