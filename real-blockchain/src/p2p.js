const WebSocket = require('ws');
const logger = require('./logger');

class P2P {
    constructor(blockchain, config) {
        this.blockchain = blockchain;
        this.config = config;
        this.server = null;
        this.peers = new Map(); // url -> ws
        this.nodeId = `${require('os').hostname()}-${process.pid}-${Math.random().toString(36).slice(2,8)}`;
    }

    async start() {
        await this.startServer();
        this.connectBootstraps();
        setInterval(() => this.heartbeat(), this.config.HEARTBEAT_INTERVAL_MS);
        logger.info('P2P started', { p2pPort: this.config.P2P_PORT, nodeId: this.nodeId });
    }

    startServer() {
        this.server = new WebSocket.Server({ port: this.config.P2P_PORT });
        this.server.on('connection', (ws, req) => this.onConnection(ws, req));
        this.server.on('listening', () => logger.info('P2P server listening', { port: this.config.P2P_PORT }));
        this.server.on('error', (err) => logger.error('P2P server error', { error: err.message }));
    }

    connectBootstraps() {
        (this.config.BOOTSTRAP_NODES || []).forEach(url => this.connect(url));
    }

    connect(url) {
        if (this.peers.has(url)) return;
        try {
            const ws = new WebSocket(url);
            ws.on('open', () => this.onOpen(ws, url));
            ws.on('message', (data) => this.onMessage(ws, data));
            ws.on('close', () => this.onClose(url));
            ws.on('error', (err) => logger.warn('P2P peer error', { url, error: err.message }));
            this.peers.set(url, ws);
        } catch (e) {
            logger.warn('P2P connect failed', { url, error: e.message });
        }
    }

    onConnection(ws, req) {
        ws.on('message', (data) => this.onMessage(ws, data));
        ws.on('error', (err) => logger.warn('P2P inbound error', { error: err.message }));
        ws.on('close', () => {});
        this.send(ws, { type: 'HELLO', nodeId: this.nodeId, networkId: this.config.NETWORK_ID, protocolVersion: this.config.PROTOCOL_VERSION });
        this.sendChainSummary(ws);
    }

    onOpen(ws, url) {
        logger.info('Connected to peer', { url });
        this.send(ws, { type: 'HELLO', nodeId: this.nodeId, networkId: this.config.NETWORK_ID, protocolVersion: this.config.PROTOCOL_VERSION });
        this.sendChainSummary(ws);
    }

    heartbeat() {
        for (const [url, ws] of this.peers) {
            if (ws.readyState === WebSocket.OPEN) {
                this.send(ws, { type: 'PING', ts: Date.now() });
            }
        }
    }

    onClose(url) {
        this.peers.delete(url);
        setTimeout(() => this.connect(url), this.config.RECONNECT_BACKOFF_MS + Math.floor(Math.random() * 1000));
    }

    send(ws, msg) {
        try {
            ws.send(JSON.stringify(msg));
        } catch (e) {
            logger.warn('Failed to send P2P message', { error: e.message });
        }
    }

    broadcast(msg) {
        for (const [, ws] of this.peers) {
            if (ws.readyState === WebSocket.OPEN) this.send(ws, msg);
        }
    }

    onMessage(ws, data) {
        let msg;
        try {
            msg = JSON.parse(data.toString());
        } catch (e) {
            return this.send(ws, { type: 'ERROR', code: 'BAD_JSON', message: 'Invalid JSON' });
        }

        switch (msg.type) {
            case 'HELLO':
                if (msg.networkId !== this.config.NETWORK_ID) return this.send(ws, { type: 'ERROR', code: 'NETWORK_MISMATCH', message: 'Wrong network' });
                if (msg.protocolVersion !== this.config.PROTOCOL_VERSION) return this.send(ws, { type: 'ERROR', code: 'VERSION_MISMATCH', message: 'Wrong version' });
                this.send(ws, { type: 'PEERS', peers: Array.from(this.peers.keys()).slice(0, 16) });
                break;
            case 'PING':
                this.send(ws, { type: 'PONG', ts: msg.ts });
                break;
            case 'PEERS':
                (msg.peers || []).slice(0, this.config.MAX_PEERS).forEach(url => this.connect(url));
                break;
            case 'CHAIN_SUMMARY':
                if ((msg.height || 0) > this.blockchain.chain.length - 1) {
                    this.requestBlocks(ws, this.blockchain.chain.length);
                }
                break;
            case 'INV':
                if (msg.objType === 'block') {
                    this.requestBlocks(ws, this.blockchain.chain.length);
                }
                break;
            case 'GET_BLOCKS':
                this.sendBlocks(ws, msg.fromHeight || 0, msg.max || 50);
                break;
            case 'BLOCK':
                this.acceptBlock(msg.block);
                break;
            default:
                this.send(ws, { type: 'ERROR', code: 'UNKNOWN', message: 'Unknown message type' });
        }
    }

    sendChainSummary(ws) {
        const tip = this.blockchain.getLatestBlock();
        this.send(ws, { type: 'CHAIN_SUMMARY', height: tip.index, tipHash: tip.hash, recent: [] });
    }

    requestBlocks(ws, fromHeight) {
        this.send(ws, { type: 'GET_BLOCKS', fromHeight, max: 50 });
    }

    sendBlocks(ws, from, max) {
        const end = Math.min(this.blockchain.chain.length, from + max);
        for (let i = from; i < end; i++) {
            this.send(ws, { type: 'BLOCK', block: this.blockchain.chain[i].toJSON() });
        }
    }

    acceptBlock(blockJson) {
        try {
            const Block = require('./block');
            const block = Block.fromJSON(blockJson);
            // Try appending
            const previousBlock = this.blockchain.getLatestBlock();
            if (block.index === previousBlock.index + 1 && block.previousHash === previousBlock.hash && block.isValid()) {
                this.blockchain.addBlock(block);
                logger.info('Accepted block from peer', { index: block.index });
            } else if (block.index > previousBlock.index + 1) {
                // We are behind; request more
                // A connected peer will serve GET_BLOCKS on demand
            }
        } catch (e) {
            logger.warn('Failed to accept peer block', { error: e.message });
        }
    }
}

module.exports = P2P;

