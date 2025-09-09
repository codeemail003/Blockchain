# 📁 Pharbit Blockchain - Project Structure

## 🎯 Overview
This repository contains a **dual blockchain architecture**:
1. **Real Blockchain** - Production-grade PoW blockchain with cryptographic security
2. **Pharma Contracts** - Smart contracts + backend with optional Hyperledger Fabric integration

## 📂 Root Structure
```
📦 Pharbit Blockchain
├── 🔐 real-blockchain/           # Production PoW blockchain
├── 🧪 pharbit-contracts/         # Smart contracts + backend
├── 🚀 fullstack-launch.sh        # Unified launcher (start/stop/status)
├── 🔧 setup-fabric-assets.sh     # Fabric integration helper
├── 📚 FABRIC_README.md           # Hyperledger Fabric adoption guide
├── 📖 README.md                  # Main project documentation
├── 📋 USAGE_GUIDE.md             # Detailed usage instructions
├── 🏗️ PROJECT_STRUCTURE.md       # This file
├── ☁️ aws/                       # AWS deployment artifacts
└── 📦 awscliv2.zip              # AWS CLI installer
```

## 🔐 Real Blockchain (`real-blockchain/`)
**Production-grade blockchain with PoW consensus**

```
real-blockchain/
├── src/                          # Core blockchain implementation
│   ├── index.js                  # Express API server (port 3000)
│   ├── blockchain.js             # Main blockchain class with LevelDB
│   ├── block.js                  # Block class with PoW mining
│   ├── transaction.js            # Transaction model & validation
│   ├── wallet.js                 # Wallet management (secp256k1)
│   ├── crypto.js                 # Cryptographic utilities
│   ├── supply-chain.js           # Pharma supply chain logic
│   ├── iot-integration.js        # IoT sensor data handling
│   └── alerts.js                 # Alert system
├── public/                       # Web interface (blockchain explorer)
├── blockchain-db/                # LevelDB persistence
├── wallet/                       # Wallet storage
├── package.json                  # Dependencies (elliptic, level, express)
├── launch.sh                     # Interactive launcher
├── start-server.sh               # Server startup script
├── test-blockchain.js            # Test suite
├── test-pharma-endpoints.js      # Pharma API tests
├── test-wallet.js                # Wallet tests
├── README.md                     # Real blockchain documentation
└── REAL_BLOCKCHAIN_GUIDE.md      # Architecture & usage guide
```

**Key Features:**
- ✅ secp256k1 cryptography (same as Bitcoin)
- ✅ Proof of Work mining with adjustable difficulty
- ✅ LevelDB persistence
- ✅ RESTful API (15+ endpoints)
- ✅ Wallet management
- ✅ Fee-priority transaction selection
- ✅ Pharmaceutical supply chain tracking

## 🧪 Pharma Contracts (`pharbit-contracts/`)
**Smart contracts + backend with Fabric integration**

```
pharbit-contracts/
├── contracts/                    # Solidity smart contracts
│   ├── SupplyChainContract.sol   # Main supply chain contract
│   ├── GovernanceContract.sol    # Governance & permissions
│   ├── StakeholderContract.sol   # Stakeholder management
│   ├── SensorDataContract.sol    # IoT sensor validation
│   └── BatchContract.sol         # Pharmaceutical batch tracking
├── backend/                      # Express.js API server
│   ├── api/
│   │   ├── blockchain-api.js     # Ethereum/Hardhat integration
│   │   └── fabric-api.js         # Hyperledger Fabric integration
│   ├── fabric/                   # Fabric connection assets
│   │   ├── connection-org1.json  # Connection profile
│   │   └── wallet/               # User certificates
│   │       ├── appUser-cert.pem  # X.509 certificate
│   │       └── appUser-key.pem   # Private key
│   ├── contracts/                # Compiled contract ABIs
│   ├── fabric-client.js          # Fabric Gateway SDK client
│   ├── server.js                 # Express server (port 4000)
│   ├── package.json              # Dependencies (Fabric SDK, ethers)
│   └── .env                      # Configuration (Fabric enabled/disabled)
├── scripts/                      # Deployment scripts
│   ├── deploy.js                 # Hardhat deployment
│   ├── deploy-localhost.js       # Local deployment
│   └── export-addresses.js       # ABI export
├── deployments/                  # Deployed contract addresses
├── test/                         # Smart contract tests
├── hardhat.config.cjs            # Hardhat configuration
├── package.json                  # Hardhat dependencies
├── deploy.sh                     # One-command deployment
└── README.md                     # Smart contracts documentation
```

**Key Features:**
- ✅ Solidity smart contracts for pharma supply chain
- ✅ Hardhat development framework
- ✅ Express.js backend API
- ✅ Optional Hyperledger Fabric integration
- ✅ Comprehensive test suite (27+ tests)
- ✅ Deployment automation

## 🚀 Launchers & Scripts

### `fullstack-launch.sh` - Unified Launcher
```bash
./fullstack-launch.sh start-all    # Start both services
./fullstack-launch.sh start-real   # Start only real blockchain
./fullstack-launch.sh start-pharma # Start only pharma backend
./fullstack-launch.sh status       # Check service health
./fullstack-launch.sh stop         # Stop all services
./fullstack-launch.sh logs         # Show log locations
```

### `setup-fabric-assets.sh` - Fabric Integration
```bash
./setup-fabric-assets.sh /path/to/fabric-samples/test-network
# Copies connection profile and certificates from Fabric test-network
```

## 🌐 Service Endpoints

### Real Blockchain (Port 3000)
- **API Base:** `http://localhost:3000/api`
- **Health:** `GET /api/health`
- **Wallet:** `POST /api/wallet/generate`
- **Transactions:** `POST /api/wallet/transaction`
- **Mining:** `POST /api/mine`
- **Blockchain:** `GET /api/blockchain`

### Pharma Backend (Port 4000)
- **API Base:** `http://localhost:4000/api`
- **Health:** `GET /api/health`
- **Drugs:** `GET /api/drugs`, `POST /api/drugs/register`
- **Fabric API:** `GET /fabric/health` (when enabled)
- **Fabric Query:** `POST /fabric/query`
- **Fabric Invoke:** `POST /fabric/invoke`

## 🔧 Configuration

### Environment Variables
```bash
# Real Blockchain
PORT=3000

# Pharma Backend
PORT=4000
FABRIC_CONNECTION_PROFILE=./fabric/connection-org1.json  # Enable Fabric
FABRIC_CHANNEL=mychannel
FABRIC_CHAINCODE=basic
FABRIC_CERT=./fabric/wallet/appUser-cert.pem
FABRIC_KEY=./fabric/wallet/appUser-key.pem
```

## 📊 Current Status

### ✅ Completed
- Real blockchain with PoW consensus
- Smart contracts with comprehensive tests
- Unified launcher for both services
- Hyperledger Fabric integration scaffold
- Fee-priority transaction selection
- LevelDB persistence
- RESTful APIs for both systems

### 🔄 In Progress
- Hyperledger Fabric asset setup (requires external test-network)
- Documentation updates

### 📋 Next Steps
1. Set up Fabric test-network
2. Run `setup-fabric-assets.sh` to enable Fabric integration
3. Test both blockchain systems together
4. Deploy to production (AWS artifacts available)

## 🎯 Use Cases

### Real Blockchain
- Production cryptocurrency applications
- Educational blockchain development
- Proof of concept implementations
- Supply chain tracking with PoW security

### Pharma Contracts
- Pharmaceutical supply chain management
- Smart contract-based drug tracking
- Enterprise blockchain solutions
- Integration with existing systems

## 🚀 Quick Start
```bash
# Start everything
./fullstack-launch.sh start-all

# Check status
./fullstack-launch.sh status

# Test APIs
curl http://localhost:3000/api/health
curl http://localhost:4000/api/health
```

---
*Last updated: $(date)*