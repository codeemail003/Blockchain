# 🚀 Pharbit Blockchain - Fullstack

This repository now focuses on the production-ready real blockchain and the pharma contracts backend. Use the unified launcher to run the fullstack locally:

Quick start (from repo root):
```bash
./fullstack-launch.sh start-all
# PharbitChain API:   http://localhost:3000
# Pharma Backend API:    http://localhost:4000
```

Other commands:
```bash
./fullstack-launch.sh status
./fullstack-launch.sh stop
./fullstack-launch.sh logs
```

---

Legacy documentation below refers to the previous simple blockchain, which has been removed during cleanup. Prefer the commands above.

## 🎯 Components

### **🔐 PharbitChain** (`real-blockchain/`)
**Production-ready with cryptographic security**
- ✅ **Cryptographic Security** - secp256k1 (same as Bitcoin)
- ✅ **Proof of Work Consensus** - Mining with adjustable difficulty
- ✅ **Digital Signatures** - Secure transaction verification
- ✅ **RESTful API Server** - 15+ endpoints for integration
- ✅ **Modern Web Interface** - PharbitChain Explorer
- ✅ **Wallet Management** - Generate and manage cryptographic wallets
- ✅ **LevelDB Persistence** - Secure data storage
- ✅ **Merkle Trees** - Efficient transaction verification

## 🚀 Quick Start Guide

### **Run PharbitChain Manually (alternative)**
```bash
cd real-blockchain
npm install
npm start
# Health: curl http://localhost:3000/api/health
```

## 📁 Project Structure

```
📦 Pharbit Blockchain
├── 🔐 real-blockchain/            # Production blockchain
│   ├── src/                       # Source code
│   │   ├── crypto.js              # Cryptographic utilities
│   │   ├── transaction.js         # Transaction class
│   │   ├── block.js               # Block class with mining
│   │   ├── blockchain.js          # Main blockchain
│   │   ├── wallet.js              # Wallet management
│   │   └── index.js               # API server
│   ├── public/                    # Web interface
│   ├── test-blockchain.js         # Test suite
│   └── README.md                  # Documentation
├── 🧪 pharbit-contracts/           # Smart contracts + backend API
│   ├── contracts/                 # Solidity contracts
│   ├── backend/                   # Express API (demo or on-chain)
│   ├── scripts/                   # Deployment scripts
│   ├── deployments/               # Deployed addresses (optional)
│   └── README.md
├── fullstack-launch.sh            # Unified start/stop/status
├── aws/                           # Deployment artifacts
├── pharbit-contracts/aws/         # Deployment artifacts (contracts)
├── awscliv2.zip                   # AWS CLI installer
└── README.md                      # This file
```

## 🎯 Use Cases

### **🔐 PharbitChain - Perfect For:**
- **Production applications**
- **Cryptocurrency development**
- **Smart contract platforms**
- **Decentralized applications (DApps)**
- **Enterprise blockchain solutions**

## 🚀 Getting Started

### **PharbitChain (Developers)**

```bash
# Navigate to PharbitChain
cd real-blockchain

# Launch the application
./launch.sh

# Choose from options:
# 1. Start PharbitChain Server
# 2. Run Tests
# 3. Open Web Interface
# 4. Show API Documentation
# 5. Show Features
```

**Features:**
- 🔐 **Cryptographic Security**: Same as Bitcoin
- ⛏️ **Proof of Work Mining**: PharbitChain consensus
- 💰 **Wallet Management**: Generate and manage wallets
- 🌐 **RESTful API**: 15+ endpoints for integration
- 📊 **PharbitChain Explorer**: Complete web interface

## 🔧 API Reference (PharbitChain)

### **Blockchain Operations**
- `GET /api/blockchain` - Get complete blockchain
- `GET /api/blockchain/latest` - Get latest block
- `GET /api/blockchain/validate` - Validate blockchain integrity

### **Transaction Operations**
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/pending` - Get pending transactions
- `GET /api/transactions/:address` - Get transaction history

### **Wallet Operations**
- `POST /api/wallet/generate` - Generate new wallet
- `POST /api/wallet/transaction` - Create transaction from wallet
- `GET /api/balance/:address` - Get address balance

### **Mining Operations**
- `POST /api/mine` - Mine pending transactions
- `GET /api/mining/status` - Get mining status

## 🧪 Testing

### **Test PharbitChain:**
```bash
cd real-blockchain
node test-blockchain.js
```

## 📊 Performance Comparison

| Feature | Simple Blockchain | PharbitChain |
|---------|------------------|-----------------|
| **Setup Complexity** | ⭐ Very Easy | ⭐⭐ Easy |
| **Cryptographic Security** | ❌ No | ✅ Yes (secp256k1) |
| **Proof of Work** | ❌ No | ✅ Yes |
| **Digital Signatures** | ❌ No | ✅ Yes |
| **API Server** | ❌ No | ✅ Yes (15+ endpoints) |
| **Web Interface** | ✅ Yes | ✅ Yes (Advanced) |
| **Data Persistence** | ✅ File-based | ✅ LevelDB |
| **Production Ready** | ❌ No | ✅ Yes |
| **Learning Curve** | ⭐ Very Easy | ⭐⭐ Easy |

## 🎯 Your Transaction Details

**Default Test Transaction:**
- **Sender:** `0x89f97Cb35236a1d0190FB25B31C5C0fF4107Ec1b`
- **Receiver:** `6M3uvRFJSR3hcJab22fSAQGUgXxiMKgdg225k3Pq9qpR`
- **Amount:** `10`

## 🚀 Advanced Usage

### **PharbitChain API Examples:**

```bash
# Generate a wallet
curl -X POST http://localhost:3000/api/wallet/generate

# Create a transaction
curl -X POST http://localhost:3000/api/wallet/transaction \
  -H "Content-Type: application/json" \
  -d '{"to": "0x1234...", "amount": 10, "fee": 0.001}'

# Mine a block
curl -X POST http://localhost:3000/api/mine \
  -H "Content-Type: application/json" \
  -d '{"minerAddress": "YOUR_WALLET_ADDRESS"}'
```

## 🔍 Monitoring & Debugging
### **PharbitChain:**
- Access web interface at `http://localhost:3000`
- Use API endpoints for programmatic access
- Check console logs for detailed information
- Use `/api/health` endpoint for system status

## 🛡️ Security Features

### **PharbitChain Security:**
- **Elliptic Curve Cryptography** (secp256k1)
- **Digital Signatures** for transaction verification
- **SHA256 & Double SHA256** hashing
- **Proof of Work** consensus mechanism
- **Double Spending Protection**
- **Address Validation** with checksums

## 📈 Scalability

### **Simple Blockchain:**
- **File-based storage** - Good for small to medium scale
- **In-memory processing** - Fast for learning and testing
- **No network overhead** - Perfect for local development

### **PharbitChain:**
- **LevelDB storage** - Scalable for large datasets
- **RESTful API** - Easy integration with other systems
- **Modular architecture** - Easy to extend and modify
- **Production-ready** - Can handle real-world loads

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Implement** your changes
4. **Test** thoroughly
5. **Submit** a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🎉 Success Indicators

### **Real Blockchain:**
✅ **Wallet Generated** - Cryptographic key pair created  
✅ **Transaction Signed** - Digital signature verified  
✅ **Block Mined** - Proof of Work consensus achieved  
✅ **Blockchain Valid** - Integrity checks passed  
✅ **API Responding** - All endpoints functional  

---

## 🚀 Ready to Use!

Use the unified launcher to start services quickly.

PharbitChain and the pharma backend are complete, tested, and ready to use! 🎉