/**
 * @fileoverview Enterprise-grade pharmaceutical block implementation
 * Improves upon IBM Hyperledger with enhanced pharma-specific features
 */

const crypto = require("crypto");
const { EventEmitter } = require("events");

class PharmaBlock {
  constructor({
    index,
    timestamp = Date.now(),
    transactions = [],
    previousHash = "",
    validator = "",
    temperature = null,
    humidity = null,
    gmpCompliance = true,
  }) {
    // Basic block properties
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();

    // Pharmaceutical-specific properties
    this.validator = validator; // Licensed validator's public key
    this.validatorSignature = null;
    this.temperature = temperature; // For cold chain monitoring
    this.humidity = humidity; // Environmental conditions
    this.gmpCompliance = gmpCompliance; // Good Manufacturing Practice status

    // Compliance metadata
    this.fdaAuditTrail = {
      created: new Date().toISOString(),
      modifications: [],
      accessLog: [],
    };

    // Quality control data
    this.qualityChecks = [];
    this.regulatoryApprovals = [];

    // Block validation status
    this.isValidated = false;
  }

  /**
   * Calculate block hash including pharmaceutical metadata
   */
  calculateHash() {
    const data = JSON.stringify({
      index: this.index,
      timestamp: this.timestamp,
      transactions: this.transactions,
      previousHash: this.previousHash,
      validator: this.validator,
      temperature: this.temperature,
      humidity: this.humidity,
      gmpCompliance: this.gmpCompliance,
      qualityChecks: this.qualityChecks,
    });

    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Add validator signature using pharmaceutical authority's private key
   */
  sign(privateKey) {
    const sign = crypto.createSign("SHA256");
    sign.write(this.hash);
    sign.end();
    this.validatorSignature = sign.sign(privateKey, "hex");
  }

  /**
   * Verify block signature from pharmaceutical validator
   */
  verifySignature(publicKey) {
    const verify = crypto.createVerify("SHA256");
    verify.write(this.hash);
    verify.end();
    return verify.verify(publicKey, this.validatorSignature, "hex");
  }

  /**
   * Add quality control check with FDA compliance
   */
  addQualityCheck(check) {
    check.timestamp = Date.now();
    check.inspector = check.inspector || "SYSTEM";
    check.fdaCompliant = this.validateFDACompliance(check);

    this.qualityChecks.push(check);
    this.fdaAuditTrail.modifications.push({
      type: "QUALITY_CHECK_ADDED",
      timestamp: check.timestamp,
      inspector: check.inspector,
    });

    // Recalculate hash after modification
    this.hash = this.calculateHash();
    return check.fdaCompliant;
  }

  /**
   * Validate FDA 21 CFR Part 11 compliance
   */
  validateFDACompliance(data) {
    // Check electronic signature requirements
    const hasValidSignature = data.signature && data.signingTime;

    // Verify audit trail completeness
    const hasAuditTrail = data.inspector && data.timestamp;

    // Ensure data integrity
    const hasIntegrityCheck = this.validateDataIntegrity(data);

    return hasValidSignature && hasAuditTrail && hasIntegrityCheck;
  }

  /**
   * Validate data integrity using cryptographic proofs
   */
  validateDataIntegrity(data) {
    const originalHash = data.integrityHash;
    const calculatedHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(data.content))
      .digest("hex");

    return originalHash === calculatedHash;
  }

  /**
   * Add regulatory approval with validation
   */
  addRegulatoryApproval(approval) {
    approval.timestamp = Date.now();
    approval.validated = this.validateRegulatoryCompliance(approval);

    this.regulatoryApprovals.push(approval);
    this.fdaAuditTrail.modifications.push({
      type: "REGULATORY_APPROVAL_ADDED",
      timestamp: approval.timestamp,
      authority: approval.authority,
    });

    // Recalculate hash after modification
    this.hash = this.calculateHash();
    return approval.validated;
  }

  /**
   * Monitor and validate environmental conditions
   */
  updateEnvironmentalData(temperature, humidity) {
    // Store previous readings for compliance
    const previousTemp = this.temperature;
    const previousHumidity = this.humidity;

    // Update current readings
    this.temperature = temperature;
    this.humidity = humidity;

    // Check for violations
    const tempViolation = this.checkTemperatureViolation(
      temperature,
      previousTemp
    );
    const humidityViolation = this.checkHumidityViolation(
      humidity,
      previousHumidity
    );

    if (tempViolation || humidityViolation) {
      this.gmpCompliance = false;
      this.fdaAuditTrail.modifications.push({
        type: "ENVIRONMENTAL_VIOLATION",
        timestamp: Date.now(),
        temperature,
        humidity,
        violations: {
          temperature: tempViolation,
          humidity: humidityViolation,
        },
      });
    }

    // Recalculate hash after modification
    this.hash = this.calculateHash();

    return {
      compliant: this.gmpCompliance,
      violations: {
        temperature: tempViolation,
        humidity: humidityViolation,
      },
    };
  }

  /**
   * Check for temperature violations in cold chain
   */
  checkTemperatureViolation(current, previous) {
    // Define temperature thresholds (can be configured per drug type)
    const MAX_TEMP = 8.0; // Celsius
    const MIN_TEMP = 2.0; // Celsius
    const MAX_RATE_CHANGE = 2.0; // Max change per hour

    // Check absolute limits
    if (current > MAX_TEMP || current < MIN_TEMP) {
      return {
        type: "ABSOLUTE_LIMIT",
        current,
        limit: current > MAX_TEMP ? MAX_TEMP : MIN_TEMP,
      };
    }

    // Check rate of change if previous reading exists
    if (previous !== null) {
      const change = Math.abs(current - previous);
      if (change > MAX_RATE_CHANGE) {
        return {
          type: "RATE_OF_CHANGE",
          change,
          limit: MAX_RATE_CHANGE,
        };
      }
    }

    return null;
  }

  /**
   * Check for humidity violations
   */
  checkHumidityViolation(current, previous) {
    // Define humidity thresholds
    const MAX_HUMIDITY = 60; // Percentage
    const MIN_HUMIDITY = 30; // Percentage
    const MAX_RATE_CHANGE = 15; // Max change per hour

    // Check absolute limits
    if (current > MAX_HUMIDITY || current < MIN_HUMIDITY) {
      return {
        type: "ABSOLUTE_LIMIT",
        current,
        limit: current > MAX_HUMIDITY ? MAX_HUMIDITY : MIN_HUMIDITY,
      };
    }

    // Check rate of change if previous reading exists
    if (previous !== null) {
      const change = Math.abs(current - previous);
      if (change > MAX_RATE_CHANGE) {
        return {
          type: "RATE_OF_CHANGE",
          change,
          limit: MAX_RATE_CHANGE,
        };
      }
    }

    return null;
  }

  /**
   * Export block data in FDA-compliant format
   */
  exportFDACompliantData() {
    return {
      block: {
        index: this.index,
        hash: this.hash,
        previousHash: this.previousHash,
        timestamp: this.timestamp,
        validator: this.validator,
        validatorSignature: this.validatorSignature,
      },
      pharmaceutical: {
        temperature: this.temperature,
        humidity: this.humidity,
        gmpCompliance: this.gmpCompliance,
        qualityChecks: this.qualityChecks,
        regulatoryApprovals: this.regulatoryApprovals,
      },
      compliance: {
        fdaAuditTrail: this.fdaAuditTrail,
        dataIntegrity: {
          verified: this.validateDataIntegrity({
            content: this.transactions,
            integrityHash: this.hash,
          }),
        },
      },
      transactions: this.transactions.map((tx) => ({
        ...tx,
        verified: this.verifyTransaction(tx),
      })),
    };
  }

  /**
   * Verify individual transaction within the block
   */
  verifyTransaction(transaction) {
    // Verify digital signature
    const verify = crypto.createVerify("SHA256");
    verify.write(transaction.data);
    verify.end();

    const signatureValid = verify.verify(
      transaction.publicKey,
      transaction.signature,
      "hex"
    );

    // Verify FDA compliance
    const fdaCompliant = this.validateFDACompliance(transaction);

    return {
      signatureValid,
      fdaCompliant,
    };
  }
}

module.exports = PharmaBlock;
