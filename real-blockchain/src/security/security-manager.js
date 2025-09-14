const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { NodeRSA } = require("node-rsa");
const config = require("./config");
const logger = require("./logger");

class SecurityManager {
  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.hsm = null;
    this.initialize();
  }

  async initialize() {
    await this.initializeHSM();
    this.setupRoles();
    this.setupPermissions();
  }

  async initializeHSM() {
    try {
      // Simulated HSM initialization
      this.hsm = {
        sign: async (data) => {
          return crypto
            .createSign("SHA256")
            .update(data)
            .sign(config.HSM_PRIVATE_KEY, "base64");
        },
        verify: async (data, signature) => {
          return crypto
            .createVerify("SHA256")
            .update(data)
            .verify(config.HSM_PUBLIC_KEY, signature, "base64");
        },
      };
      logger.info("HSM initialized successfully");
    } catch (error) {
      logger.error("HSM initialization failed:", error);
      throw error;
    }
  }

  setupRoles() {
    this.roles = {
      ADMIN: "administrator",
      MANUFACTURER: "manufacturer",
      QUALITY_CONTROL: "qualityControl",
      DISTRIBUTOR: "distributor",
      REGULATOR: "regulator",
      AUDITOR: "auditor",
    };
  }

  setupPermissions() {
    this.permissions = {
      [this.roles.ADMIN]: ["*"],
      [this.roles.MANUFACTURER]: [
        "createBatch",
        "updateBatch",
        "viewBatch",
        "addQualityData",
      ],
      [this.roles.QUALITY_CONTROL]: [
        "viewBatch",
        "approveBatch",
        "rejectBatch",
        "addQualityData",
      ],
      [this.roles.DISTRIBUTOR]: [
        "viewBatch",
        "updateShipping",
        "viewTemperature",
      ],
      [this.roles.REGULATOR]: ["viewBatch", "viewAudit", "viewCompliance"],
      [this.roles.AUDITOR]: ["viewBatch", "viewAudit", "exportReports"],
    };
  }

  // User Management
  async createUser(username, password, role) {
    if (this.users.has(username)) {
      throw new Error("User already exists");
    }

    if (!Object.values(this.roles).includes(role)) {
      throw new Error("Invalid role");
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = await this.hashPassword(password, salt);

    const user = {
      username,
      passwordHash,
      salt,
      role,
      multiFactorEnabled: false,
      publicKey: null,
      created: Date.now(),
      lastLogin: null,
      status: "active",
    };

    this.users.set(username, user);
    logger.info(`User created: ${username} with role ${role}`);
    return { username, role };
  }

  // Authentication
  async authenticate(username, password, mfaToken = null) {
    const user = this.users.get(username);
    if (!user || user.status !== "active") {
      throw new Error("Authentication failed");
    }

    const passwordHash = await this.hashPassword(password, user.salt);
    if (passwordHash !== user.passwordHash) {
      throw new Error("Authentication failed");
    }

    if (user.multiFactorEnabled) {
      if (!mfaToken || !this.verifyMFAToken(user, mfaToken)) {
        throw new Error("MFA verification required");
      }
    }

    const sessionId = this.createSession(user);
    user.lastLogin = Date.now();

    return {
      sessionId,
      username: user.username,
      role: user.role,
      permissions: this.permissions[user.role],
    };
  }

  // Authorization
  authorize(sessionId, permission) {
    const session = this.sessions.get(sessionId);
    if (!session || Date.now() > session.expires) {
      throw new Error("Invalid or expired session");
    }

    const userPermissions = this.permissions[session.role];
    return (
      userPermissions.includes("*") || userPermissions.includes(permission)
    );
  }

  // Multi-signature Transaction Management
  async createMultiSigTransaction(transaction, requiredSignatures) {
    const txId = crypto.randomBytes(16).toString("hex");
    const multiSigTx = {
      id: txId,
      transaction,
      requiredSignatures,
      signatures: new Map(),
      status: "pending",
      created: Date.now(),
    };

    // Sign with HSM
    const hsmSignature = await this.hsm.sign(JSON.stringify(transaction));
    multiSigTx.signatures.set("HSM", hsmSignature);

    return multiSigTx;
  }

  async addSignature(txId, username, signature) {
    const user = this.users.get(username);
    if (!user || !user.publicKey) {
      throw new Error("Invalid user or missing public key");
    }

    // Verify signature
    const isValid = await this.verifySignature(signature, user.publicKey);

    if (!isValid) {
      throw new Error("Invalid signature");
    }

    // Add signature to transaction
    // Implementation details...
  }

  // Encryption and Key Management
  async generateKeyPair() {
    const key = new NodeRSA({ b: 2048 });
    return {
      publicKey: key.exportKey("public"),
      privateKey: key.exportKey("private"),
    };
  }

  async encryptField(data, publicKey) {
    const key = new NodeRSA(publicKey);
    return key.encrypt(data, "base64");
  }

  async decryptField(encryptedData, privateKey) {
    const key = new NodeRSA(privateKey);
    return key.decrypt(encryptedData, "utf8");
  }

  // Session Management
  createSession(user) {
    const sessionId = crypto.randomBytes(32).toString("hex");
    const session = {
      id: sessionId,
      username: user.username,
      role: user.role,
      created: Date.now(),
      expires: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
      mfaVerified: !user.multiFactorEnabled,
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  // Multi-Factor Authentication
  async enableMFA(username) {
    const user = this.users.get(username);
    if (!user) throw new Error("User not found");

    const secret = crypto.randomBytes(20).toString("hex");
    user.mfaSecret = secret;
    user.multiFactorEnabled = true;

    return this.generateMFAQRCode(username, secret);
  }

  verifyMFAToken(user, token) {
    // Implementation would use actual TOTP verification
    return true; // Placeholder
  }

  // Audit Logging
  logSecurityEvent(event) {
    logger.info("Security event:", {
      ...event,
      timestamp: new Date().toISOString(),
    });
  }

  // Helper Methods
  async hashPassword(password, salt) {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey.toString("hex"));
      });
    });
  }

  generateMFAQRCode(username, secret) {
    // Implementation would generate actual QR code
    return `otpauth://totp/PharmaChain:${username}?secret=${secret}`;
  }

  async verifySignature(signature, publicKey) {
    // Implementation would verify actual signatures
    return true; // Placeholder
  }

  // Cleanup
  cleanup() {
    // Cleanup tasks when shutting down
    this.sessions.clear();
  }
}

module.exports = SecurityManager;
