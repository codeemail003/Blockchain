# 🚀 PharbitChain - Production Blockchain Platform

A complete, production-ready blockchain implementation with cryptographic security, Proof of Work consensus, and a comprehensive web interface for pharmaceutical supply chain management.

## ✅ **Current Status: FULLY OPERATIONAL**

- **🌐 Web Interface**: http://localhost:3000
- **📡 API Server**: http://localhost:3000/api
- **🔄 Always Running**: Auto-restart with PM2 process manager
- **💊 Pharmaceutical Features**: Complete batch tracking and supply chain management

## 🚀 **Quick Start**

### **1. Start the Server (Always Running)**
```bash
# Start with auto-restart
/workspace/start-pharbit-always.sh

# Or use management script
/workspace/manage-pharbit.sh start
```

### **2. Access the Web Interface**
Open your browser and go to: **http://localhost:3000**

### **3. Check Server Status**
```bash
/workspace/manage-pharbit.sh status
```

## 🎯 **Key Features**

### **🔐 Blockchain Core**
- ✅ **Cryptographic Security** (secp256k1 - same as Bitcoin)
- ✅ **Proof of Work Mining** with adjustable difficulty
- ✅ **Digital Signatures** for all transactions
- ✅ **LevelDB Persistence** for data storage
- ✅ **Wallet Management** with secure key storage

### **💊 Pharmaceutical Features**
- ✅ **Medicine Batch Creation** with complete lifecycle tracking
- ✅ **Supply Chain Transfers** between stakeholders
- ✅ **IoT Sensor Data** integration (temperature, humidity, GPS)
- ✅ **Batch Verification** and authenticity checking
- ✅ **Alert System** for compliance violations
- ✅ **Temperature Monitoring** for cold chain management

### **🌐 Web Interface**
- ✅ **Complete Dashboard** - All features in one page
- ✅ **Wallet Management** - Generate, import, export wallets
- ✅ **Transaction System** - Send cryptocurrency between wallets
- ✅ **Mining Interface** - Mine blocks and earn rewards
- ✅ **Batch Management** - Create and track medicine batches
- ✅ **Real-time Updates** - Live blockchain statistics
- ✅ **Responsive Design** - Works on desktop and mobile

### **🔧 Management & Monitoring**
- ✅ **Always Running** - Auto-restart on crashes
- ✅ **Health Monitoring** - Continuous health checks
- ✅ **Log Management** - Comprehensive logging system
- ✅ **Easy Management** - Simple commands for all operations

## 📊 **Web Interface Features**

### **💰 Wallet Management**
- Generate new wallets with cryptographic security
- Connect MetaMask for external wallet integration
- View wallet addresses, balances, and transaction history
- Import/export wallets with private key management

### **💸 Transaction System**
- Send cryptocurrency between wallets
- Set transaction fees and amounts
- View pending and completed transactions
- Real-time balance updates

### **⛏️ Mining System**
- Mine new blocks to process transactions
- Earn mining rewards (50 coins per block)
- Adjustable mining difficulty
- Real-time mining status and statistics

### **💊 Pharmaceutical Management**
- **Create Medicine Batches** - Complete form with medicine info, quantities, locations
- **Verify Batch Authenticity** - Check custody chain and temperature history
- **Supply Chain Transfers** - Transfer custody between stakeholders
- **IoT Sensor Data** - Submit temperature, humidity, GPS readings
- **Alert System** - View and manage compliance alerts

### **📈 Blockchain Explorer**
- Real-time blockchain statistics
- Block information and transaction details
- Live updates and monitoring
- Complete blockchain validation

## 🔧 **Management Commands**

### **Server Management**
```bash
# Check status
/workspace/manage-pharbit.sh status

# Start server
/workspace/manage-pharbit.sh start

# Stop server
/workspace/manage-pharbit.sh stop

# Restart server
/workspace/manage-pharbit.sh restart

# View logs
/workspace/manage-pharbit.sh logs

# Real-time monitoring
/workspace/manage-pharbit.sh monitor

# Open web interface
/workspace/manage-pharbit.sh web
```

### **PM2 Commands (Advanced)**
```bash
# View all processes
pm2 status

# View logs
pm2 logs pharbit-blockchain

# Restart
pm2 restart pharbit-blockchain

# Monitor dashboard
pm2 monit
```

## 📡 **API Endpoints**

### **Core Blockchain**
- `GET /api/blockchain` - Get complete blockchain
- `GET /api/blockchain/latest` - Get latest block
- `GET /api/blockchain/validate` - Validate blockchain integrity

### **Transactions**
- `GET /api/transactions/pending` - Get pending transactions
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/:address` - Get transaction history

### **Wallets**
- `GET /api/wallet` - Get wallet information
- `POST /api/wallet/generate` - Generate new wallet
- `POST /api/wallet/import` - Import wallet from private key
- `POST /api/wallet/transaction` - Create transaction from wallet

### **Mining**
- `POST /api/mine` - Mine pending transactions
- `GET /api/mining/status` - Get mining status

### **Pharmaceutical**
- `POST /api/batch` - Create medicine batch
- `GET /api/batch/:batchId` - Get batch information
- `POST /api/supply-chain/transfer` - Transfer batch custody
- `POST /api/sensor-data` - Submit IoT sensor data
- `GET /api/alerts` - Get system alerts

### **System**
- `GET /api/health` - Health check
- `GET /api/balance/:address` - Get address balance

## 🏗️ **Project Structure**

```
📦 PharbitChain
├── 🔐 real-blockchain/           # Main blockchain implementation
│   ├── src/                      # Source code
│   │   ├── index.js              # Main server (API + Web)
│   │   ├── blockchain.js         # Blockchain core
│   │   ├── wallet.js             # Wallet management
│   │   ├── transaction.js        # Transaction system
│   │   ├── block.js              # Block implementation
│   │   ├── crypto.js             # Cryptographic utilities
│   │   └── database/             # Database integrations
│   ├── public/                   # Web interface
│   │   └── index.html            # Complete web dashboard
│   ├── logs/                     # Server logs
│   ├── blockchain-db/            # LevelDB storage
│   ├── wallet/                   # Wallet storage
│   └── package.json              # Dependencies
├── 🚀 Management Scripts
│   ├── manage-pharbit.sh         # Main management script
│   ├── start-pharbit-always.sh   # Always-running startup
│   └── stop-pharbit.sh           # Stop script
└── 📚 Documentation
    ├── README.md                 # This file
    ├── PROJECT_STRUCTURE.md      # Detailed structure
    └── USAGE_GUIDE.md            # Complete usage guide
```

## 🛡️ **Security & Compliance**

### **Cryptographic Security**
- **secp256k1** elliptic curve (Bitcoin standard)
- **SHA256** and **Double SHA256** hashing
- **Digital Signatures** for all transactions
- **Secure Private Key Storage**

### **Pharmaceutical Compliance**
- **FDA 21 CFR Part 11** compliance ready
- **GDPR** data protection
- **Immutable Audit Trails** for all operations
- **Temperature Monitoring** for cold chain compliance
- **Batch Serialization** and tracking

## 🔄 **Auto-Restart Features**

### **PM2 Process Manager**
- ✅ **Automatic restart** on crashes
- ✅ **Memory monitoring** and restart if needed
- ✅ **Process persistence** across reboots
- ✅ **Log management** with rotation

### **Health Monitoring**
- ✅ **Health checks** every minute
- ✅ **Automatic recovery** if server becomes unresponsive
- ✅ **Comprehensive logging** of all events

## 📈 **Performance**

- **Sub-second API responses** for most operations
- **Efficient LevelDB storage** for blockchain data
- **Real-time web interface** with live updates
- **Scalable architecture** for high transaction volumes

## 🎯 **Use Cases**

### **Educational**
- Learn blockchain concepts with hands-on experience
- Understand cryptographic security and digital signatures
- Explore Proof of Work consensus mechanisms

### **Development**
- Build blockchain applications and DApps
- Integrate with existing systems via RESTful API
- Develop pharmaceutical supply chain solutions

### **Production**
- Pharmaceutical batch tracking and compliance
- Supply chain transparency and traceability
- IoT sensor data integration and monitoring
- Regulatory compliance and audit trails

## 🚀 **Getting Started**

1. **Start the server**: `/workspace/start-pharbit-always.sh`
2. **Open web interface**: http://localhost:3000
3. **Generate wallets** using the wallet management section
4. **Create transactions** and mine blocks
5. **Create medicine batches** for pharmaceutical tracking
6. **Monitor everything** through the web dashboard

## 📞 **Support**

### **Quick Help**
```bash
# Check if server is running
curl http://localhost:3000/api/health

# View server logs
/workspace/manage-pharbit.sh logs

# Restart if needed
/workspace/manage-pharbit.sh restart
```

### **Documentation**
- **Complete Usage Guide**: `/workspace/USAGE_GUIDE.md`
- **Project Structure**: `/workspace/PROJECT_STRUCTURE.md`
- **API Reference**: Available in web interface

## 🎉 **Ready to Use!**

Your PharbitChain blockchain platform is **fully operational** and ready for production use! The web interface provides complete control over all blockchain and pharmaceutical features in a single, beautiful dashboard.

**Start exploring blockchain technology and pharmaceutical supply chain management today!** 🚀