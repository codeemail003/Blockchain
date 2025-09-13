# 🚀 PharbitChain - Production Blockchain Platform

## ✅ **Current Status: FULLY OPERATIONAL**

A complete, production-ready blockchain implementation with cryptographic security, Proof of Work consensus, and a comprehensive web interface for pharmaceutical supply chain management.

**🌐 Web Interface**: http://localhost:3000  
**📡 API Server**: http://localhost:3000/api  
**🔄 Always Running**: Auto-restart with PM2 process manager

## 🎯 **Key Features**

### **🔐 Cryptographic Security**
- ✅ **Elliptic Curve Cryptography** (secp256k1 - same as Bitcoin)
- ✅ **Digital Signatures** for all transactions
- ✅ **SHA256 & Double SHA256** hashing
- ✅ **Address Generation** from public keys
- ✅ **Secure Private Key Management**

### **⛏️ Proof of Work Consensus**
- ✅ **Mining Algorithm** with adjustable difficulty
- ✅ **Block Validation** with cryptographic proofs
- ✅ **Merkle Trees** for transaction verification
- ✅ **Nonce Generation** for mining
- ✅ **Mining Rewards** (50 coins per block)

### **💰 Transaction System**
- ✅ **Signed Transactions** with private keys
- ✅ **Transaction Validation** and verification
- ✅ **Fee System** for miners
- ✅ **Double Spending Protection**
- ✅ **Balance Tracking** for all addresses

### **🗄️ Data Persistence**
- ✅ **LevelDB** for blockchain storage
- ✅ **Wallet Persistence** with secure file storage
- ✅ **Transaction History** tracking
- ✅ **Blockchain Validation** and integrity checks

### **🌐 Complete Web Interface**
- ✅ **Single-Page Dashboard** - All features in one interface
- ✅ **Wallet Management** - Generate, import, export wallets
- ✅ **Transaction System** - Send cryptocurrency between wallets
- ✅ **Mining Interface** - Mine blocks and earn rewards
- ✅ **Pharmaceutical Features** - Complete batch tracking system
- ✅ **Real-time Updates** - Live blockchain statistics
- ✅ **Responsive Design** - Works on desktop and mobile

### **💊 Pharmaceutical Features**
- ✅ **Medicine Batch Creation** with complete lifecycle tracking
- ✅ **Supply Chain Transfers** between stakeholders
- ✅ **IoT Sensor Data** integration (temperature, humidity, GPS)
- ✅ **Batch Verification** and authenticity checking
- ✅ **Alert System** for compliance violations
- ✅ **Temperature Monitoring** for cold chain management

## 🚀 **Quick Start**

### **1. Start the Server**
```bash
# Always-running mode (recommended)
/workspace/start-pharbit-always.sh

# Or use management script
/workspace/manage-pharbit.sh start

# Or start manually
cd /workspace/real-blockchain
npm start
```

### **2. Access Web Interface**
Open your browser and go to: **http://localhost:3000**

### **3. Check Server Status**
```bash
/workspace/manage-pharbit.sh status
```

## 🌐 **Web Interface Guide**

### **Main Dashboard**
The web interface provides complete control over all blockchain and pharmaceutical features in a single, beautiful dashboard.

### **💰 Wallet Management**
- **Generate Wallets**: Create new wallets with cryptographic security
- **Connect MetaMask**: Integrate with external crypto wallets
- **View Balances**: Real-time balance tracking
- **Import/Export**: Manage wallet data

### **💸 Transaction System**
- **Send Cryptocurrency**: Transfer coins between wallets
- **Transaction History**: View all past transactions
- **Pending Transactions**: See unconfirmed transactions
- **Fee Management**: Set transaction fees

### **⛏️ Mining System**
- **Mine Blocks**: Process pending transactions
- **Mining Rewards**: Earn 50 coins per block
- **Mining Status**: Real-time mining information
- **Difficulty Adjustment**: Automatic difficulty scaling

### **💊 Pharmaceutical Management**
- **Create Medicine Batches**: Complete form with medicine info, quantities, locations
- **Verify Batch Authenticity**: Check custody chain and temperature history
- **Supply Chain Transfers**: Transfer custody between stakeholders
- **IoT Sensor Data**: Submit temperature, humidity, GPS readings
- **Alert System**: View and manage compliance alerts

### **📊 Blockchain Explorer**
- **Real-time Statistics**: Live blockchain metrics
- **Block Information**: Detailed block data
- **Transaction Details**: Complete transaction records
- **Address Balances**: Real-time balance tracking

## 🔧 **API Endpoints**

### **Core Blockchain**
- `GET /api/blockchain` - Get complete blockchain
- `GET /api/blockchain/latest` - Get latest block
- `GET /api/blockchain/validate` - Validate blockchain integrity
- `GET /api/blockchain/block/:index` - Get block by index

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

## 📁 **Project Structure**

```
real-blockchain/
├── src/                          # Source code
│   ├── index.js                  # Main server (API + Web)
│   ├── blockchain.js             # Blockchain core
│   ├── wallet.js                 # Wallet management
│   ├── transaction.js            # Transaction system
│   ├── block.js                  # Block implementation
│   ├── crypto.js                 # Cryptographic utilities
│   ├── config.js                 # Configuration
│   ├── logger.js                 # Logging system
│   ├── metrics.js                # Performance metrics
│   ├── p2p.js                    # Peer-to-peer networking
│   ├── database/                 # Database integrations
│   │   ├── supabase.js           # Supabase integration
│   │   └── memory.js             # Memory database fallback
│   ├── storage/                  # Storage integrations
│   ├── wallet/                   # Wallet integrations
│   └── contracts/                # Smart contract engine
├── public/                       # Web interface
│   └── index.html                # Complete web dashboard
├── logs/                         # Server logs
├── blockchain-db/                # LevelDB storage
├── wallet/                       # Wallet storage
├── contract-state/               # Smart contract state
├── package.json                  # Dependencies
├── ecosystem.config.js           # PM2 configuration
├── start-server.sh               # Server startup script
└── README.md                     # This file
```

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Database (Optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# AWS (Optional)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket
```

### **Blockchain Parameters**
- **Genesis Block**: Automatically created on first run
- **Difficulty**: Adjustable (default: 4 leading zeros)
- **Mining Reward**: 50 coins per block
- **Block Size**: Up to 1000 transactions per block
- **Transaction Fees**: Minimum 0.001 coins

## 🔄 **Auto-Restart Features**

### **PM2 Process Manager**
- ✅ **Automatic restart** on crashes
- ✅ **Memory monitoring** and restart if needed
- ✅ **Process persistence** across reboots
- ✅ **Log management** with rotation

### **Health Monitoring**
- ✅ **Health checks** every minute
- ✅ **Automatic recovery** if server becomes unresponsive
- ✅ **Comprehensive logging** of all restart events

### **Management Commands**
```bash
# Check server status
/workspace/manage-pharbit.sh status

# View server logs
/workspace/manage-pharbit.sh logs

# Restart server
/workspace/manage-pharbit.sh restart

# Open web interface
/workspace/manage-pharbit.sh web
```

## 🛡️ **Security Features**

### **Cryptographic Algorithms**
- **secp256k1** elliptic curve (Bitcoin standard)
- **SHA256** and **Double SHA256** hashing
- **RIPEMD160** for address generation
- **DER** signature format

### **Transaction Security**
- **Digital Signatures** for all transactions
- **Public Key Verification** for transaction authenticity
- **Address Validation** with checksum verification
- **Double Spending Protection** with balance checks

### **Wallet Security**
- **Secure Private Key Storage** in encrypted files
- **Wallet Backup** and recovery functionality
- **Private Key Import/Export** capabilities
- **Address Generation** from public keys

## ⛏️ **Mining System**

### **Proof of Work**
- **Adjustable Difficulty** (default: 4 leading zeros)
- **Nonce Generation** for mining attempts
- **Block Hash Calculation** with all block data
- **Mining Reward** system (50 coins per block)

### **Mining Process**
1. **Collect Pending Transactions** (up to 1000 per block)
2. **Add Mining Reward** transaction
3. **Calculate Merkle Root** of transactions
4. **Find Valid Nonce** that produces hash with required difficulty
5. **Add Block** to blockchain
6. **Remove Mined Transactions** from pending pool

## 💰 **Transaction System**

### **Transaction Structure**
```javascript
{
  id: "unique-transaction-id",
  from: "sender-address",
  to: "recipient-address",
  amount: 10.0,
  fee: 0.001,
  timestamp: 1640995200000,
  signature: "digital-signature",
  publicKey: "sender-public-key",
  hash: "transaction-hash"
}
```

### **Transaction Validation**
- **Signature Verification** using public key
- **Address Format Validation** (0x + 40 hex chars)
- **Amount Validation** (positive values)
- **Balance Verification** (sufficient funds)
- **Double Spending Check** (pending transactions)

## 🗄️ **Data Storage**

### **LevelDB Integration**
- **Persistent Storage** of blockchain data
- **Transaction History** preservation
- **Block Integrity** maintenance
- **Fast Read/Write** operations

### **Wallet Storage**
- **Secure File Storage** for wallet data
- **Backup and Recovery** functionality
- **Import/Export** capabilities
- **Private Key Protection**

## 🧪 **Testing**

### **Run Tests**
```bash
npm test
```

### **Manual Testing**
1. **Start the node**: `npm start`
2. **Generate wallet**: Use API or web interface
3. **Create transactions**: Send coins between addresses
4. **Mine blocks**: Process pending transactions
5. **Verify blockchain**: Check integrity and balances

## 📈 **Performance**

### **Optimizations**
- **LevelDB**: Fast key-value storage
- **Merkle Trees**: Efficient transaction verification
- **Caching**: In-memory transaction pool
- **Async Operations**: Non-blocking API calls

### **Scalability**
- **Modular Architecture**: Easy to extend and modify
- **API Design**: RESTful interface for integration
- **Database Optimization**: Efficient storage and retrieval
- **Memory Management**: Optimized for large blockchains

## 🚀 **Advanced Usage**

### **Programmatic Usage**
```javascript
const BlockchainNode = require("./src/index");
const Wallet = require("./src/wallet");

// Create blockchain node
const node = new BlockchainNode(3000);

// Generate wallet
const wallet = new Wallet();
const walletInfo = wallet.generateWallet();

// Create transaction
const transaction = wallet.createTransaction(
  "0x1234567890123456789012345678901234567890",
  10.0,
  0.001
);

// Add to blockchain
node.blockchain.addTransaction(transaction);

// Mine block
const block = node.blockchain.minePendingTransactions(walletInfo.address);
```

### **API Integration**
```javascript
// Generate wallet
const response = await fetch('http://localhost:3000/api/wallet/generate', {
  method: 'POST'
});
const wallet = await response.json();

// Create transaction
const txResponse = await fetch('http://localhost:3000/api/wallet/transaction', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '0x1234567890123456789012345678901234567890',
    amount: 10,
    fee: 0.001
  })
});
```

## 🔍 **Blockchain Explorer**

### **Web Interface Features**
- **Block Details**: Index, hash, timestamp, transactions
- **Transaction History**: Complete transaction records
- **Address Balances**: Real-time balance tracking
- **Mining Statistics**: Difficulty, rewards, timing

### **API Explorer**
All blockchain data is available through RESTful API endpoints for integration with web applications, mobile apps, or other services.

## 🛡️ **Security Considerations**

### **Best Practices**
- **Secure Private Key Storage**: Never expose private keys
- **Regular Backups**: Backup wallet files regularly
- **Network Security**: Use HTTPS in production
- **Input Validation**: Validate all user inputs
- **Rate Limiting**: Implement API rate limiting

### **Production Deployment**
- **HTTPS**: Use SSL/TLS encryption
- **Firewall**: Restrict network access
- **Monitoring**: Implement logging and monitoring
- **Backup Strategy**: Regular blockchain backups
- **Load Balancing**: Scale for high traffic

## 🤝 **Contributing**

1. **Fork** the repository
2. **Create** a feature branch
3. **Implement** your changes
4. **Test** thoroughly
5. **Submit** a pull request

## 📄 **License**

MIT License - see LICENSE file for details.

---

**PharbitChain is fully operational and ready for production use!** 🚀

Access the complete web interface at **http://localhost:3000** to start exploring blockchain technology and pharmaceutical supply chain management.