## 🔐 PharbitChain – Architecture, Structure, and Getting Started

## This document explains how PharbitChain works, its code structure, and how to run it locally.

## 🏭 Production-Ready Roadmap & Enterprise Features

PharbitChain is evolving into an enterprise-grade, pharmaceutical-compliant blockchain platform. Key priorities:

- **Security:** Multi-sig wallets, HSM integration, audit logging, field encryption, role-based access control
- **Compliance:** FDA 21 CFR Part 11, GDPR, immutable audit trails, data retention, regulatory validation
- **Traceability:** End-to-end batch lifecycle, recall management, serialization, cold chain monitoring
- **Performance:** 10,000+ TPS, sub-second confirmation, horizontal scaling, query optimization, caching
- **Integration:** RESTful & GraphQL APIs, webhooks, message queues, ERP/IoT connectors
- **Monitoring:** Health checks, metrics, alerting, log aggregation, performance tracking
- **Testing:** 90%+ code coverage, integration/load/security/compliance/chaos tests
- **Documentation:** Complete API docs, user guides, module READMEs

### New Enterprise Modules (see `src/`)

- `network/` - Peer discovery, P2P messaging, sync, gossip, config
- `consensus/` - Mining pool, dynamic difficulty, fork resolution, validator set
- `security/` - Multi-sig wallet, HSM, key recovery, audit logger, field encryption, access control
- `identity/` - SSO, RBAC, certificate store, DID resolver
- `integration/` - ERP connectors, IoT gateway, legacy adapters, message broker, API gateway
- `storage/` - Database sharding, IPFS, backup validator, archive manager, data encryption
- `monitoring/` - Health checker, metrics collector, alert manager, log aggregator, performance monitor
- `admin/` - Node management, backup manager, upgrade manager, config manager
- `compliance/` - GDPR manager, FDA reporter, audit trail, data retention, regulatory validator
- `pharma/` - Batch lifecycle, recall manager, QA, serialization, temperature chain, expiry manager
- `api/` - GraphQL, webhooks, rate limiting, documentation, versioning

---

### 1) What it is

- **Purpose**: A production-style blockchain with cryptographic security, Proof of Work mining, REST API, wallet management, and LevelDB persistence.
- **Tech**: Node.js, Express, `elliptic` (secp256k1), SHA-256, LevelDB.

### 2) High-level architecture

---

## 🛡️ Compliance & Security

- **FDA 21 CFR Part 11**: Electronic records, audit trails, data integrity
- **GDPR**: Data privacy, right-to-erasure, retention management
- **Zero-Trust Architecture**: End-to-end encryption, multi-factor authentication
- **Enterprise Security**: Multi-sig, HSM, key recovery, role-based access, audit logging
- **Traceability**: Immutable batch tracking, recall, serialization, cold chain, expiry

## 🧑‍💻 Development Workflow & Code Quality

- Use **TypeScript** for new modules (type safety)
- Add **JSDoc** for all functions
- Implement **comprehensive error handling and logging**
- Write **unit tests** for all new modules
- Use **environment variables** for configuration
- Document every module (README + API docs)
- Create **database migrations** for schema changes
- Set up **CI/CD pipelines** early

## ✅ Success Criteria

- Multi-node deployment with automatic peer discovery
- Enterprise-grade authentication and encryption
- Handle pharmaceutical transaction volumes
- Meet FDA, GDPR, and pharma regulations
- Connect with existing pharmaceutical systems
- Comprehensive observability and alerting
- 90%+ code coverage with all test types
- Complete API docs and user guides
- **Wallet (`src/wallet.js`)**

  - Generates/imports wallets using secp256k1 keys
  - Derives address from public key (SHA-256 → RIPEMD-160 → 0x-address)
  - Creates signed transactions

- **Crypto utilities (`src/crypto.js`)**

  - Key generation, signing, verification
  - Address and hash utilities (SHA-256, double SHA-256)

- **Transaction (`src/transaction.js`)**

  - Represents value transfer with signature, fee, and validation
  - Serialized for inclusion in blocks

- **Block (`src/block.js`)**

  - Contains transactions, previous hash, nonce
  - Computes Merkle root and block hash
  - Mined via Proof of Work (difficulty = leading zeros)

- **Blockchain (`src/blockchain.js`)**

  - Manages chain state, pending transactions, mining reward, difficulty
  - Validates chain and prevents double spending
  - Persists state to LevelDB (`./blockchain-db`)

- **API server (`src/index.js`)**

  - Express REST API exposing blockchain, wallet, mining, and pharma endpoints
  - Serves static UI from `public/`

- **Pharma modules**
  - `src/supply-chain.js`, `src/iot-integration.js`, `src/alerts.js`: domain logic for batches, sensors, and alerts

### 3) Directory structure

```
real-blockchain/
├── public/                 # Frontend assets
├── src/
│   ├── alerts.js           # Alert system
│   ├── blockchain.js       # Core blockchain state & LevelDB persistence
│   ├── block.js            # Block definition & PoW mining
│   ├── crypto.js           # Cryptographic utilities (secp256k1, hashes)
│   ├── iot-integration.js  # Sensor ingestion & validation (pharma)
│   ├── index.js            # Express API server
│   ├── supply-chain.js     # Pharma supply chain service
│   └── transaction.js      # Transaction model & validation
├── blockchain-db/          # LevelDB data directory (created at runtime)
├── start-server.sh         # Helper script to start the API server
├── launch.sh               # Interactive launcher
├── package.json
└── README.md
```

### 4) Core data flow

1. Client hits REST API (e.g., create wallet / create transaction)
2. Server validates input; wallet signs transactions
3. Transaction is queued in `pendingTransactions`
4. Miner mines a block including pending transactions
5. Proof of Work finds a nonce meeting `difficulty`; block is appended
6. State is persisted to LevelDB

### 5) Key REST API endpoints

- Blockchain
  - `GET /api/blockchain` – full chain + stats
  - `GET /api/blockchain/latest` – latest block
  - `GET /api/blockchain/validate` – chain validity
- Transactions
  - `GET /api/transactions/pending` – pending transactions
  - `POST /api/transactions` – create transaction (legacy form requiring `privateKey`)
- Wallet
  - `GET /api/wallet` – wallet info
  - `POST /api/wallet/generate` – create new wallet
  - `POST /api/wallet/import` – import wallet by private key
  - `POST /api/wallet/transaction` – create and queue a signed transaction
- Mining
  - `POST /api/mine` – mine pending transactions (requires `minerAddress`)
  - `GET /api/mining/status` – mining status

Pharma endpoints (batches, sensors, alerts) are also available; see `README.md` for the full list.

### 6) How to run

Prerequisites: Node.js 18+, npm

Option A – Interactive launcher

```bash
cd real-blockchain
./launch.sh
# 1) Start Blockchain Server
```

Option B – Direct command

```bash
cd real-blockchain
npm start
# or
node src/index.js
```

Verify server health

```bash
curl http://localhost:3000/api/health
```

### 7) Quick usage examples

Generate wallet

```bash
curl -X POST http://localhost:3000/api/wallet/generate -H "Content-Type: application/json"
```

Create transaction from wallet

```bash
curl -X POST http://localhost:3000/api/wallet/transaction \
  -H "Content-Type: application/json" \
  -d '{"to": "0x1234567890123456789012345678901234567890", "amount": 10, "fee": 0.001}'
```

Mine a block

```bash
curl -X POST http://localhost:3000/api/mine \
  -H "Content-Type: application/json" \
  -d '{"minerAddress": "YOUR_WALLET_ADDRESS"}'
```

Get blockchain

```bash
curl http://localhost:3000/api/blockchain
```

### 8) Persistence & initialization notes

- Data is stored in `./blockchain-db` (LevelDB). On first run, a PharbitChain genesis block is created.
- If LevelDB is locked by another process, the server will fall back to in-memory mode for development. Stop other instances or remove the lock to restore persistence.

### 9) Troubleshooting

- **Port 3000 in use**: set a different port
  ```bash
  PORT=3001 npm start
  ```
- **Database locked / not open**: ensure only one instance is running; if needed, stop all node processes and restart
  ```bash
  pkill -f "node src/index.js"
  ```
- **Cannot find module**: install dependencies
  ```bash
  npm install
  ```

### 10) Key defaults

- Difficulty: 4 leading zeros
- Mining reward: 50
- Block size limit (logical): 1000 transactions

---

PharbitChain is suitable for demos, education, and as a foundation for domain-specific extensions (e.g., pharmaceutical supply chain).
