const mqtt = require("mqtt");
const { EventEmitter } = require("events");
const logger = require("./logger");
const config = require("./config");

class IoTGateway extends EventEmitter {
  constructor() {
    super();
    this.devices = new Map();
    this.mqttClient = null;
    this.alertThresholds = config.IOT_ALERT_THRESHOLDS;
    this.simulationEnabled = false;
    this.initialize();
  }

  initialize() {
    this.connectMQTT();
    this.setupEventHandlers();
    if (config.ENABLE_SIMULATION) {
      this.startSimulation();
    }
  }

  connectMQTT() {
    this.mqttClient = mqtt.connect(config.MQTT_BROKER_URL, {
      username: config.MQTT_USERNAME,
      password: config.MQTT_PASSWORD,
    });

    this.mqttClient.on("connect", () => {
      logger.info("Connected to MQTT broker");
      this.mqttClient.subscribe("pharma/+/sensors/#");
    });

    this.mqttClient.on("message", (topic, message) => {
      this.handleSensorData(topic, JSON.parse(message));
    });
  }

  setupEventHandlers() {
    this.on("temperature_violation", this.handleTemperatureViolation);
    this.on("humidity_violation", this.handleHumidityViolation);
    this.on("device_offline", this.handleDeviceOffline);
  }

  handleSensorData(topic, data) {
    const [, batchId, , sensorType] = topic.split("/");
    const device = this.getOrCreateDevice(batchId);

    device.lastUpdate = Date.now();
    device.readings[sensorType] = {
      value: data.value,
      timestamp: data.timestamp,
      unit: data.unit,
    };

    this.validateReading(batchId, sensorType, data);
    this.emit("sensor_data", { batchId, sensorType, data });
  }

  validateReading(batchId, sensorType, data) {
    const thresholds = this.alertThresholds[sensorType];
    if (!thresholds) return;

    if (data.value < thresholds.min || data.value > thresholds.max) {
      this.emit(`${sensorType}_violation`, {
        batchId,
        value: data.value,
        thresholds,
        timestamp: data.timestamp,
      });
    }
  }

  handleTemperatureViolation(violation) {
    logger.warn(
      `Temperature violation for batch ${violation.batchId}`,
      violation
    );
    // Trigger alerts, notifications, blockchain updates
  }

  handleHumidityViolation(violation) {
    logger.warn(`Humidity violation for batch ${violation.batchId}`, violation);
    // Trigger alerts, notifications, blockchain updates
  }

  handleDeviceOffline(device) {
    logger.error(`Device offline: ${device.batchId}`);
    // Trigger alerts, notifications
  }

  getOrCreateDevice(batchId) {
    if (!this.devices.has(batchId)) {
      this.devices.set(batchId, {
        batchId,
        readings: {},
        lastUpdate: Date.now(),
        status: "active",
      });
    }
    return this.devices.get(batchId);
  }

  startSimulation() {
    this.simulationEnabled = true;
    this.simulationIntervals = new Map();

    // Simulate existing devices
    for (const [batchId] of this.devices) {
      this.startDeviceSimulation(batchId);
    }
  }

  startDeviceSimulation(batchId) {
    if (!this.simulationEnabled) return;

    const intervals = {
      temperature: setInterval(() => {
        this.simulateSensorReading(batchId, "temperature");
      }, 5000),
      humidity: setInterval(() => {
        this.simulateSensorReading(batchId, "humidity");
      }, 7000),
      pressure: setInterval(() => {
        this.simulateSensorReading(batchId, "pressure");
      }, 10000),
    };

    this.simulationIntervals.set(batchId, intervals);
  }

  stopDeviceSimulation(batchId) {
    const intervals = this.simulationIntervals.get(batchId);
    if (intervals) {
      Object.values(intervals).forEach(clearInterval);
      this.simulationIntervals.delete(batchId);
    }
  }

  simulateSensorReading(batchId, sensorType) {
    const baseValues = {
      temperature: 20, // 20°C
      humidity: 45, // 45%
      pressure: 1013, // 1013 hPa
    };

    const variations = {
      temperature: 0.5,
      humidity: 2,
      pressure: 5,
    };

    const value =
      baseValues[sensorType] + (Math.random() * 2 - 1) * variations[sensorType];

    const data = {
      value,
      timestamp: Date.now(),
      unit: this.getSensorUnit(sensorType),
    };

    const topic = `pharma/${batchId}/sensors/${sensorType}`;
    this.mqttClient.publish(topic, JSON.stringify(data));
  }

  getSensorUnit(sensorType) {
    const units = {
      temperature: "°C",
      humidity: "%",
      pressure: "hPa",
    };
    return units[sensorType] || "unknown";
  }

  // Device Management
  registerDevice(batchId, config) {
    this.devices.set(batchId, {
      batchId,
      config,
      readings: {},
      lastUpdate: Date.now(),
      status: "active",
    });

    if (this.simulationEnabled) {
      this.startDeviceSimulation(batchId);
    }
  }

  unregisterDevice(batchId) {
    this.stopDeviceSimulation(batchId);
    this.devices.delete(batchId);
  }

  getDeviceStatus(batchId) {
    const device = this.devices.get(batchId);
    if (!device) return null;

    const now = Date.now();
    const offlineThreshold = 60000; // 1 minute

    if (now - device.lastUpdate > offlineThreshold) {
      device.status = "offline";
      this.emit("device_offline", device);
    }

    return {
      ...device,
      isOnline: device.status === "active",
      lastUpdateAge: now - device.lastUpdate,
    };
  }

  getAllDevices() {
    return Array.from(this.devices.values()).map((device) =>
      this.getDeviceStatus(device.batchId)
    );
  }

  // Simulation Control
  enableSimulation() {
    if (!this.simulationEnabled) {
      this.startSimulation();
    }
  }

  disableSimulation() {
    this.simulationEnabled = false;
    for (const [batchId] of this.simulationIntervals) {
      this.stopDeviceSimulation(batchId);
    }
  }

  // Configuration
  updateAlertThresholds(thresholds) {
    this.alertThresholds = {
      ...this.alertThresholds,
      ...thresholds,
    };
  }

  // Cleanup
  cleanup() {
    this.disableSimulation();
    if (this.mqttClient) {
      this.mqttClient.end();
    }
  }
}

module.exports = IoTGateway;
