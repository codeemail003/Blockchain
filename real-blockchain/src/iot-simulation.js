class IoTSimulator {
    constructor() {
        this.sensors = new Map();
        this.alertHandlers = new Set();
    }

    // Add a new sensor for a batch
    addSensor(batchId, config) {
        const sensor = {
            batchId,
            config,
            readings: [],
            interval: null,
            status: 'active'
        };
        this.sensors.set(batchId, sensor);
        this.startMonitoring(batchId);
    }

    // Start monitoring for a specific batch
    startMonitoring(batchId) {
        const sensor = this.sensors.get(batchId);
        if (!sensor) return;

        sensor.interval = setInterval(() => {
            const reading = this.generateReading(sensor.config);
            sensor.readings.push(reading);
            this.checkCompliance(batchId, reading);
        }, 5000); // Generate reading every 5 seconds
    }

    // Generate a simulated sensor reading
    generateReading(config) {
        const { baseTemp, variation, baseHumidity, humidityVariation } = config;
        const reading = {
            timestamp: new Date().toISOString(),
            temperature: baseTemp + (Math.random() * 2 - 1) * variation,
            humidity: baseHumidity + (Math.random() * 2 - 1) * humidityVariation,
            gps: this.generateGPSData()
        };
        return reading;
    }

    // Generate simulated GPS data
    generateGPSData() {
        // Simulate movement within a specific region
        return {
            latitude: 37.7749 + (Math.random() * 0.01 - 0.005),
            longitude: -122.4194 + (Math.random() * 0.01 - 0.005)
        };
    }

    // Check if reading complies with requirements
    checkCompliance(batchId, reading) {
        const sensor = this.sensors.get(batchId);
        const { minTemp, maxTemp, minHumidity, maxHumidity } = sensor.config;

        if (reading.temperature < minTemp || reading.temperature > maxTemp) {
            this.triggerAlert({
                type: 'TEMPERATURE_VIOLATION',
                batchId,
                reading,
                limits: { minTemp, maxTemp }
            });
        }

        if (reading.humidity < minHumidity || reading.humidity > maxHumidity) {
            this.triggerAlert({
                type: 'HUMIDITY_VIOLATION',
                batchId,
                reading,
                limits: { minHumidity, maxHumidity }
            });
        }
    }

    // Add alert handler
    onAlert(handler) {
        this.alertHandlers.add(handler);
    }

    // Trigger alert
    triggerAlert(alert) {
        for (const handler of this.alertHandlers) {
            handler(alert);
        }
    }

    // Stop monitoring a specific batch
    stopMonitoring(batchId) {
        const sensor = this.sensors.get(batchId);
        if (sensor && sensor.interval) {
            clearInterval(sensor.interval);
            sensor.status = 'inactive';
        }
    }

    // Get sensor data history
    getSensorHistory(batchId) {
        const sensor = this.sensors.get(batchId);
        return sensor ? sensor.readings : [];
    }

    // Get real-time sensor data
    getCurrentReading(batchId) {
        const sensor = this.sensors.get(batchId);
        return sensor ? sensor.readings[sensor.readings.length - 1] : null;
    }

    // Simulate RFID/Barcode scan
    simulateScan(batchId) {
        return {
            timestamp: new Date().toISOString(),
            batchId,
            location: this.generateGPSData(),
            scanType: Math.random() > 0.5 ? 'RFID' : 'BARCODE',
            status: 'VALID'
        };
    }
}

// Export the IoT simulator
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IoTSimulator;
}