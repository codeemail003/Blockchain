/**
 * @fileoverview Enterprise peer discovery system for pharmaceutical blockchain
 * @version 1.0.0
 * @requires crypto
 * @requires dgram
 * @requires ws
 */

const crypto = require("crypto");
const dgram = require("dgram");
const WebSocket = require("ws");
const EventEmitter = require("events");

/**
 * Kademlia-based DHT implementation for decentralized peer discovery
 * Supports 1000+ nodes with geographical distribution awareness
 */
class PeerDiscovery extends EventEmitter {
  constructor(options = {}) {
    super();

    // Node identification
    this.nodeId = options.nodeId || this.generateNodeId();
    this.port = options.port || 8333;
    this.host = options.host || "0.0.0.0";

    // Bootstrap nodes for initial network connection
    this.bootstrapNodes = options.bootstrapNodes || [
      "pharbit-node-1.blockchain.pharma:8333",
      "pharbit-node-2.blockchain.pharma:8333",
      "pharbit-node-3.blockchain.pharma:8333",
    ];

    // Peer management
    this.peers = new Map();
    this.buckets = new Array(160).fill(null).map(() => []);
    this.maxPeersPerBucket = 20;
    this.maxConnections = 100;

    // Pharmaceutical network configuration
    this.networkType = options.networkType || "PHARMACEUTICAL_MAINNET";
    this.geographicalRegion = options.region || "GLOBAL";
    this.complianceLevel = options.complianceLevel || "FDA_21_CFR_PART_11";

    // Performance and health monitoring
    this.peerReputation = new Map();
    this.connectionStats = {
      established: 0,
      failed: 0,
      dropped: 0,
      totalDataSent: 0,
      totalDataReceived: 0,
    };

    // Network discovery protocol
    this.discoveryInterval = 30000; // 30 seconds
    this.healthCheckInterval = 60000; // 60 seconds
    this.peerTimeouts = new Map();

    // Initialize server
    this.server = null;
    this.isRunning = false;

    console.log(
      `Peer Discovery initialized for node ${this.nodeId} on ${this.networkType}`
    );
  }

  /**
   * Generate unique node identifier for pharmaceutical network
   */
  generateNodeId() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(16).toString("hex");
    const nodeId = crypto
      .createHash("sha256")
      .update(`${timestamp}-${random}-${this.networkType}`)
      .digest("hex")
      .substring(0, 40); // 160 bits for Kademlia

    return nodeId;
  }

  /**
   * Start peer discovery service
   */
  async start() {
    try {
      this.isRunning = true;

      // Start WebSocket server for peer connections
      await this.startServer();

      // Connect to bootstrap nodes
      await this.connectToBootstrapNodes();

      // Start discovery and health check intervals
      this.startDiscoveryLoop();
      this.startHealthCheckLoop();

      this.emit("discoveryStarted", {
        nodeId: this.nodeId,
        port: this.port,
        networkType: this.networkType,
      });

      console.log(`Peer discovery started on port ${this.port}`);
    } catch (error) {
      this.emit("discoveryError", error);
      throw error;
    }
  }

  /**
   * Stop peer discovery service
   */
  async stop() {
    this.isRunning = false;

    // Close all peer connections
    for (const [peerId, peer] of this.peers) {
      await this.disconnectPeer(peerId);
    }

    // Close server
    if (this.server) {
      this.server.close();
    }

    console.log("Peer discovery stopped");
  }

  /**
   * Start WebSocket server for incoming peer connections
   */
  async startServer() {
    return new Promise((resolve, reject) => {
      this.server = new WebSocket.Server({
        port: this.port,
        host: this.host,
      });

      this.server.on("connection", (ws, request) => {
        this.handleIncomingConnection(ws, request);
      });

      this.server.on("listening", () => {
        resolve();
      });

      this.server.on("error", (error) => {
        reject(error);
      });
    });
  }

  /**
   * Handle incoming peer connections
   */
  async handleIncomingConnection(ws, request) {
    const clientIP = request.socket.remoteAddress;

    try {
      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        ws.close(1000, "Connection timeout");
      }, 10000);

      ws.on("message", async (data) => {
        clearTimeout(connectionTimeout);
        await this.handlePeerMessage(ws, data, clientIP);
      });

      ws.on("close", (code, reason) => {
        this.handlePeerDisconnection(ws, code, reason);
      });

      ws.on("error", (error) => {
        console.error("Peer connection error:", error);
        this.connectionStats.failed++;
      });
    } catch (error) {
      console.error("Error handling incoming connection:", error);
      ws.close(1011, "Server error");
    }
  }

  /**
   * Connect to bootstrap nodes for initial network discovery
   */
  async connectToBootstrapNodes() {
    const connectionPromises = this.bootstrapNodes.map(async (nodeAddress) => {
      try {
        const [host, port] = nodeAddress.split(":");
        await this.connectToPeer(host, parseInt(port));
        console.log(`Connected to bootstrap node: ${nodeAddress}`);
      } catch (error) {
        console.warn(
          `Failed to connect to bootstrap node ${nodeAddress}:`,
          error.message
        );
      }
    });

    // Wait for at least one successful connection
    const results = await Promise.allSettled(connectionPromises);
    const successful = results.filter((r) => r.status === "fulfilled").length;

    if (successful === 0) {
      throw new Error("Failed to connect to any bootstrap nodes");
    }

    console.log(`Connected to ${successful} bootstrap nodes`);
  }

  /**
   * Connect to a specific peer
   */
  async connectToPeer(host, port, nodeId = null) {
    const address = `${host}:${port}`;

    // Check if already connected
    if (this.findPeerByAddress(address)) {
      return;
    }

    // Check connection limits
    if (this.peers.size >= this.maxConnections) {
      throw new Error("Maximum connections reached");
    }

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://${host}:${port}`);

      ws.on("open", () => {
        // Send handshake message
        const handshake = {
          type: "HANDSHAKE",
          nodeId: this.nodeId,
          networkType: this.networkType,
          complianceLevel: this.complianceLevel,
          geographicalRegion: this.geographicalRegion,
          timestamp: Date.now(),
        };

        ws.send(JSON.stringify(handshake));
      });

      ws.on("message", async (data) => {
        try {
          const message = JSON.parse(data);

          if (message.type === "HANDSHAKE_RESPONSE") {
            // Validate peer compatibility
            if (await this.validatePeerCompatibility(message)) {
              const peer = this.createPeer(ws, message, address);
              this.addPeer(peer);
              this.connectionStats.established++;
              resolve(peer);
            } else {
              ws.close(1000, "Incompatible peer");
              reject(new Error("Peer compatibility validation failed"));
            }
          } else {
            await this.handlePeerMessage(ws, data);
          }
        } catch (error) {
          console.error("Error processing peer message:", error);
        }
      });

      ws.on("error", (error) => {
        this.connectionStats.failed++;
        reject(error);
      });

      ws.on("close", () => {
        this.connectionStats.dropped++;
      });

      // Connection timeout
      setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
          reject(new Error("Connection timeout"));
        }
      }, 10000);
    });
  }

  /**
   * Validate peer compatibility for pharmaceutical network
   */
  async validatePeerCompatibility(peerInfo) {
    // Check network type compatibility
    if (peerInfo.networkType !== this.networkType) {
      console.warn("Network type mismatch:", peerInfo.networkType);
      return false;
    }

    // Validate compliance level
    const acceptableCompliance = [
      "FDA_21_CFR_PART_11",
      "GDPR_COMPLIANT",
      "GXP_VALIDATED",
    ];

    if (!acceptableCompliance.includes(peerInfo.complianceLevel)) {
      console.warn(
        "Compliance level not acceptable:",
        peerInfo.complianceLevel
      );
      return false;
    }

    // Check geographical restrictions if applicable
    if (
      this.geographicalRegion !== "GLOBAL" &&
      peerInfo.geographicalRegion !== this.geographicalRegion &&
      peerInfo.geographicalRegion !== "GLOBAL"
    ) {
      console.warn(
        "Geographical region restriction:",
        peerInfo.geographicalRegion
      );
      return false;
    }

    return true;
  }

  /**
   * Create peer object
   */
  createPeer(ws, peerInfo, address) {
    return {
      id: peerInfo.nodeId,
      socket: ws,
      address: address,
      networkType: peerInfo.networkType,
      complianceLevel: peerInfo.complianceLevel,
      geographicalRegion: peerInfo.geographicalRegion,
      connectedAt: Date.now(),
      lastSeen: Date.now(),
      reputation: 100, // Initial reputation score
      messageCount: 0,
      dataTransferred: 0,
    };
  }

  /**
   * Add peer to routing table using Kademlia algorithm
   */
  addPeer(peer) {
    // Calculate XOR distance for Kademlia
    const distance = this.calculateDistance(this.nodeId, peer.id);
    const bucketIndex = this.getBucketIndex(distance);

    // Add to appropriate k-bucket
    const bucket = this.buckets[bucketIndex];

    // Remove if already exists
    const existingIndex = bucket.findIndex((p) => p.id === peer.id);
    if (existingIndex !== -1) {
      bucket.splice(existingIndex, 1);
    }

    // Add to end of bucket (most recently seen)
    bucket.push(peer);

    // Maintain bucket size
    if (bucket.length > this.maxPeersPerBucket) {
      // Remove least recently seen peer
      const removedPeer = bucket.shift();
      if (this.peers.has(removedPeer.id)) {
        this.disconnectPeer(removedPeer.id);
      }
    }

    // Add to peers map
    this.peers.set(peer.id, peer);

    // Initialize reputation
    this.peerReputation.set(peer.id, {
      score: 100,
      successfulTransactions: 0,
      failedTransactions: 0,
      lastUpdate: Date.now(),
    });

    this.emit("peerConnected", peer);
    console.log(`Peer connected: ${peer.id} (${peer.address})`);
  }

  /**
   * Calculate XOR distance between two node IDs
   */
  calculateDistance(nodeId1, nodeId2) {
    const buffer1 = Buffer.from(nodeId1, "hex");
    const buffer2 = Buffer.from(nodeId2, "hex");
    const result = Buffer.alloc(buffer1.length);

    for (let i = 0; i < buffer1.length; i++) {
      result[i] = buffer1[i] ^ buffer2[i];
    }

    return result.toString("hex");
  }

  /**
   * Get bucket index for Kademlia routing
   */
  getBucketIndex(distance) {
    const buffer = Buffer.from(distance, "hex");

    for (let i = 0; i < buffer.length; i++) {
      if (buffer[i] !== 0) {
        return i * 8 + (7 - Math.floor(Math.log2(buffer[i])));
      }
    }

    return 159; // Maximum distance
  }

  /**
   * Find closest peers to a given node ID
   */
  findClosestPeers(targetId, count = 20) {
    const allPeers = Array.from(this.peers.values());

    return allPeers
      .map((peer) => ({
        peer,
        distance: this.calculateDistance(targetId, peer.id),
      }))
      .sort((a, b) => a.distance.localeCompare(b.distance))
      .slice(0, count)
      .map((item) => item.peer);
  }

  /**
   * Start discovery loop for finding new peers
   */
  startDiscoveryLoop() {
    const discoveryLoop = async () => {
      if (!this.isRunning) return;

      try {
        // Request peer lists from connected peers
        await this.requestPeerLists();

        // Maintain optimal bucket population
        await this.maintainBuckets();
      } catch (error) {
        console.error("Discovery loop error:", error);
      }

      setTimeout(discoveryLoop, this.discoveryInterval);
    };

    setTimeout(discoveryLoop, this.discoveryInterval);
  }

  /**
   * Start health check loop for peer monitoring
   */
  startHealthCheckLoop() {
    const healthLoop = async () => {
      if (!this.isRunning) return;

      try {
        await this.performHealthChecks();
        this.updatePeerReputations();
        this.cleanupStaleConnections();
      } catch (error) {
        console.error("Health check error:", error);
      }

      setTimeout(healthLoop, this.healthCheckInterval);
    };

    setTimeout(healthLoop, this.healthCheckInterval);
  }

  /**
   * Request peer lists from connected peers
   */
  async requestPeerLists() {
    const requests = Array.from(this.peers.values()).map(async (peer) => {
      try {
        const request = {
          type: "PEER_REQUEST",
          nodeId: this.nodeId,
          timestamp: Date.now(),
        };

        peer.socket.send(JSON.stringify(request));
      } catch (error) {
        console.warn("Failed to request peers from:", peer.id);
      }
    });

    await Promise.allSettled(requests);
  }

  /**
   * Handle peer messages
   */
  async handlePeerMessage(ws, data, clientIP = null) {
    try {
      const message = JSON.parse(data);
      this.connectionStats.totalDataReceived += data.length;

      switch (message.type) {
        case "HANDSHAKE":
          await this.handleHandshake(ws, message, clientIP);
          break;

        case "PEER_REQUEST":
          await this.handlePeerRequest(ws, message);
          break;

        case "PEER_RESPONSE":
          await this.handlePeerResponse(message);
          break;

        case "PING":
          await this.handlePing(ws, message);
          break;

        case "PONG":
          await this.handlePong(message);
          break;

        default:
          // Forward to blockchain layer
          this.emit("peerMessage", {
            message,
            peer: this.findPeerBySocket(ws),
          });
      }
    } catch (error) {
      console.error("Error handling peer message:", error);
    }
  }

  /**
   * Handle handshake from incoming connection
   */
  async handleHandshake(ws, message, clientIP) {
    if (await this.validatePeerCompatibility(message)) {
      const response = {
        type: "HANDSHAKE_RESPONSE",
        nodeId: this.nodeId,
        networkType: this.networkType,
        complianceLevel: this.complianceLevel,
        geographicalRegion: this.geographicalRegion,
        timestamp: Date.now(),
        success: true,
      };

      ws.send(JSON.stringify(response));

      // Create and add peer
      const address = clientIP + ":unknown";
      const peer = this.createPeer(ws, message, address);
      this.addPeer(peer);
    } else {
      const response = {
        type: "HANDSHAKE_RESPONSE",
        success: false,
        reason: "Compatibility validation failed",
      };

      ws.send(JSON.stringify(response));
      ws.close(1000, "Incompatible peer");
    }
  }

  /**
   * Get network statistics
   */
  getNetworkStats() {
    return {
      nodeId: this.nodeId,
      connectedPeers: this.peers.size,
      networkType: this.networkType,
      complianceLevel: this.complianceLevel,
      connectionStats: this.connectionStats,
      bucketDistribution: this.buckets.map((bucket) => bucket.length),
      averageReputation: this.calculateAverageReputation(),
      uptime: Date.now() - (this.startTime || Date.now()),
    };
  }

  /**
   * Calculate average peer reputation
   */
  calculateAverageReputation() {
    const reputations = Array.from(this.peerReputation.values());
    if (reputations.length === 0) return 0;

    const total = reputations.reduce((sum, rep) => sum + rep.score, 0);
    return total / reputations.length;
  }

  /**
   * Find peer by socket connection
   */
  findPeerBySocket(socket) {
    for (const peer of this.peers.values()) {
      if (peer.socket === socket) {
        return peer;
      }
    }
    return null;
  }

  /**
   * Find peer by address
   */
  findPeerByAddress(address) {
    for (const peer of this.peers.values()) {
      if (peer.address === address) {
        return peer;
      }
    }
    return null;
  }

  /**
   * Disconnect peer
   */
  async disconnectPeer(peerId) {
    const peer = this.peers.get(peerId);
    if (peer) {
      try {
        peer.socket.close();
      } catch (error) {
        // Ignore close errors
      }

      this.peers.delete(peerId);
      this.peerReputation.delete(peerId);

      // Remove from buckets
      for (const bucket of this.buckets) {
        const index = bucket.findIndex((p) => p.id === peerId);
        if (index !== -1) {
          bucket.splice(index, 1);
          break;
        }
      }

      this.emit("peerDisconnected", peer);
      console.log(`Peer disconnected: ${peerId}`);
    }
  }
}

module.exports = PeerDiscovery;
