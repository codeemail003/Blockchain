# 📚 Complete Usage Guide - Pharbit Blockchain

This comprehensive guide will help you understand and use both blockchain implementations effectively.

## 🎯 Table of Contents

1. [Quick Start](#-quick-start)
2. [Simple Blockchain Guide](#-simple-blockchain-guide)
3. [Real Blockchain Guide](#-real-blockchain-guide)
4. [API Reference](#-api-reference)
5. [Troubleshooting](#-troubleshooting)
6. [Advanced Features](#-advanced-features)
7. [Examples & Use Cases](#-examples--use-cases)

## 🚀 Quick Start

### **Prerequisites:**
- Node.js (v14 or higher)
- npm (comes with Node.js)
- Modern web browser

### **Choose Your Path:**

#### **🎓 Beginner - Simple Blockchain**
Perfect for learning blockchain concepts without complexity.

#### **🔐 Advanced - Real Blockchain**
Production-ready with cryptographic security and advanced features.

---

## 🎓 Simple Blockchain Guide

### **What is Simple Blockchain?**
A lightweight blockchain implementation designed for learning and basic transactions. It simulates blockchain behavior without complex cryptographic operations.

### **Key Features:**
- ✅ File-based storage
- ✅ Web interface
- ✅ Command line tools
- ✅ Real-time balance tracking
- ✅ Transaction history

### **Getting Started:**

#### **1. Launch the Application**
```bash
cd simple-blockchain
./launch.sh
```

#### **2. Choose Your Interface**

**Option A: Web Interface (Recommended)**
- Choose option 1 from the launcher
- Opens a beautiful web interface
- Enter sender, receiver, and amount
- Click "Create Transaction Block"

**Option B: Command Line**
```bash
node process-transaction.js "sender" "receiver" "amount"
```

**Option C: Direct Web Access**
- Open `web-interface.html` in your browser
- No server required

#### **3. Understanding the Output**

When you create a transaction, you'll see:
```
✅ Block 3 created with hash: 09f57233020d9860809226b4d70e47e7a3dcc7784a66c558d72776c0fc32b6ad
✅ Transaction completed successfully!
Transaction ID: TX_1756728257723_evtplquus
Sender balance: 980
Receiver balance: 520
```

#### **4. File Structure**
```
simple-blockchain/
├── blocks/                 # Contains all blockchain blocks
├── transactions/           # Individual transaction records
├── accounts/              # Account balance information
├── process-transaction.js  # Main transaction processor
├── web-interface.html     # Web interface
└── launch.sh              # Launcher script
```

#### **5. Monitoring Your Blockchain**

**View Blocks:**
```bash
ls blocks/
cat blocks/block_1.json
```

**View Transactions:**
```bash
ls transactions/
cat transactions/TX_1756728257723_evtplquus.json
```

**Check Balances:**
```bash
cat accounts/accounts.json
```

### **Example Usage:**

#### **Create a Test Transaction:**
```bash
node process-transaction.js "0x89f97Cb35236a1d0190FB25B31C5C0fF4107Ec1b" "6M3uvRFJSR3hcJab22fSAQGUgXxiMKgdg225k3Pq9qpR" "10"
```

#### **View Transaction History:**
```bash
ls -la transactions/
```

#### **Check Account Balances:**
```bash
cat accounts/accounts.json | jq .
```

---

## 🔐 Real Blockchain Guide

### **What is Real Blockchain?**
A production-ready blockchain implementation with cryptographic security, Proof of Work consensus, and a complete API server.

### **Key Features:**
- ✅ Cryptographic security (secp256k1)
- ✅ Proof of Work mining
- ✅ Digital signatures
- ✅ RESTful API server
- ✅ Modern web interface
- ✅ Wallet management
- ✅ LevelDB persistence

### **Getting Started:**

#### **1. Launch the Application**
```bash
cd real-blockchain
./launch.sh
```

#### **2. Choose Your Option**

**Option 1: Start Blockchain Server**
- Starts the API server on port 3000
- Provides RESTful endpoints
- Enables web interface access

**Option 2: Run Tests**
- Executes comprehensive test suite
- Verifies all functionality
- Shows detailed test results

**Option 3: Open Web Interface**
- Opens modern blockchain explorer
- Generate wallets and create transactions
- Monitor blockchain statistics

**Option 4: Show API Documentation**
- Displays all available endpoints
- Shows example usage
- Provides curl commands

**Option 5: Show Features**
- Lists all blockchain features
- Explains capabilities
- Shows security features

#### **3. Using the Web Interface**

**Generate Wallets:**
1. Click "Generate Wallet" for Wallet 1
2. Click "Generate Wallet" for Wallet 2
3. Note the wallet addresses

**Create Transactions:**
1. Select "From Wallet" (Wallet 1)
2. Select "To Wallet" (Wallet 2)
3. Enter amount (e.g., 10)
4. Enter fee (e.g., 0.001)
5. Click "Send Transaction"

**Mine Blocks:**
1. Select a miner wallet
2. Click "Mine Block"
3. Watch the mining process
4. See the new block added

**Monitor Statistics:**
- View total blocks
- See pending transactions
- Check mining difficulty
- Monitor average mining time

#### **4. Using the API**

**Generate a Wallet:**
```bash
curl -X POST http://localhost:3000/api/wallet/generate
```

**Create a Transaction:**
```bash
curl -X POST http://localhost:3000/api/wallet/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "to": "0x1234567890123456789012345678901234567890",
    "amount": 10,
    "fee": 0.001
  }'
```

**Mine a Block:**
```bash
curl -X POST http://localhost:3000/api/mine \
  -H "Content-Type: application/json" \
  -d '{
    "minerAddress": "YOUR_WALLET_ADDRESS"
  }'
```

**Get Blockchain Info:**
```bash
curl http://localhost:3000/api/blockchain
```

**Get Balance:**
```bash
curl http://localhost:3000/api/balance/YOUR_ADDRESS
```

#### **5. Understanding the Output**

**Wallet Generation:**
```json
{
  "message": "Wallet generated successfully",
  "wallet": {
    "address": "0xe7303f0d28847633411ca7e5cc84381efee25ac7",
    "publicKey": "04...",
    "privateKey": "1234..."
  }
}
```

**Transaction Creation:**
```json
{
  "message": "Transaction created and added to pending",
  "transaction": {
    "id": "uuid",
    "from": "sender-address",
    "to": "receiver-address",
    "amount": 10,
    "fee": 0.001,
    "signature": "digital-signature",
    "hash": "transaction-hash"
  }
}
```

**Mining Result:**
```json
{
  "message": "Mining started",
  "minerAddress": "0x...",
  "pendingTransactions": 2
}
```

---

## 🔧 API Reference

### **Real Blockchain API Endpoints**

#### **Blockchain Operations**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blockchain` | Get complete blockchain |
| GET | `/api/blockchain/latest` | Get latest block |
| GET | `/api/blockchain/block/:index` | Get block by index |
| GET | `/api/blockchain/validate` | Validate blockchain integrity |

#### **Transaction Operations**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions/pending` | Get pending transactions |
| POST | `/api/transactions` | Create new transaction |
| GET | `/api/transactions/:address` | Get transaction history |

#### **Wallet Operations**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wallet` | Get wallet information |
| POST | `/api/wallet/generate` | Generate new wallet |
| POST | `/api/wallet/import` | Import wallet from private key |
| POST | `/api/wallet/transaction` | Create transaction from wallet |

#### **Account Operations**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/balance/:address` | Get address balance |

#### **Mining Operations**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/mine` | Mine pending transactions |
| GET | `/api/mining/status` | Get mining status |

#### **System Operations**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

### **Request/Response Examples**

#### **Generate Wallet**
```bash
curl -X POST http://localhost:3000/api/wallet/generate
```

**Response:**
```json
{
  "message": "Wallet generated successfully",
  "wallet": {
    "address": "0xe7303f0d28847633411ca7e5cc84381efee25ac7",
    "publicKey": "04...",
    "privateKey": "1234..."
  }
}
```

#### **Create Transaction**
```bash
curl -X POST http://localhost:3000/api/wallet/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "to": "0x1234567890123456789012345678901234567890",
    "amount": 10,
    "fee": 0.001
  }'
```

**Response:**
```json
{
  "message": "Transaction created and added to pending",
  "transaction": {
    "id": "uuid",
    "from": "sender-address",
    "to": "0x1234567890123456789012345678901234567890",
    "amount": 10,
    "fee": 0.001,
    "signature": "digital-signature",
    "hash": "transaction-hash"
  }
}
```

#### **Mine Block**
```bash
curl -X POST http://localhost:3000/api/mine \
  -H "Content-Type: application/json" \
  -d '{
    "minerAddress": "0xe7303f0d28847633411ca7e5cc84381efee25ac7"
  }'
```

**Response:**
```json
{
  "message": "Mining started",
  "minerAddress": "0xe7303f0d28847633411ca7e5cc84381efee25ac7",
  "pendingTransactions": 2
}
```

---

## 🔧 Troubleshooting

### **Common Issues & Solutions**

#### **Simple Blockchain Issues**

**Problem: "Permission denied" when running launch.sh**
```bash
chmod +x launch.sh
```

**Problem: "Node.js not found"**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Problem: Web interface not working**
- Open `web-interface.html` directly in browser
- Check browser console for errors
- Ensure JavaScript is enabled

#### **Real Blockchain Issues**

**Problem: "Port 3000 already in use"**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm start
```

**Problem: "Database is not open"**
```bash
# Remove existing database
rm -rf blockchain-db/

# Restart the application
npm start
```

**Problem: "Cannot find module"**
```bash
# Install dependencies
npm install
```

**Problem: "Mining failed"**
- Check if there are pending transactions
- Verify miner address is valid
- Check mining difficulty settings

#### **General Issues**

**Problem: "Permission denied"**
```bash
# Make scripts executable
chmod +x */launch.sh
```

**Problem: "Connection refused"**
- Ensure the server is running
- Check if the correct port is being used
- Verify firewall settings

---

## 🚀 Advanced Features

### **Simple Blockchain Advanced Usage**

#### **Custom Transaction Processing**
```javascript
// Create custom transaction
const transaction = {
  sender: "custom-sender",
  receiver: "custom-receiver",
  amount: 100,
  timestamp: Date.now()
};

// Process transaction
require('./process-transaction.js')(transaction);
```

#### **Batch Transaction Processing**
```bash
# Process multiple transactions
for i in {1..10}; do
  node process-transaction.js "sender$i" "receiver$i" "$i"
done
```

### **Real Blockchain Advanced Usage**

#### **Custom Mining Configuration**
```javascript
// Modify mining difficulty
blockchain.difficulty = 5; // 5 leading zeros

// Change mining reward
blockchain.miningReward = 100;

// Adjust block size
blockchain.blockSize = 500;
```

#### **Programmatic API Usage**
```javascript
const fetch = require('node-fetch');

// Generate wallet
const walletResponse = await fetch('http://localhost:3000/api/wallet/generate', {
  method: 'POST'
});
const wallet = await walletResponse.json();

// Create transaction
const transactionResponse = await fetch('http://localhost:3000/api/wallet/transaction', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: wallet.wallet.address,
    amount: 10,
    fee: 0.001
  })
});
```

#### **Custom Blockchain Configuration**
```javascript
// Create blockchain with custom settings
const blockchain = new Blockchain('./custom-db', {
  difficulty: 3,
  miningReward: 25,
  blockSize: 100
});
```

---

## 📝 Examples & Use Cases

### **Educational Use Cases**

#### **1. Blockchain Learning**
```bash
# Simple blockchain for concepts
cd simple-blockchain
./launch.sh
# Use web interface to understand blocks and transactions
```

#### **2. Cryptography Learning**
```bash
# Real blockchain for security concepts
cd real-blockchain
./launch.sh
# Generate wallets and understand digital signatures
```

### **Development Use Cases**

#### **1. API Testing**
```bash
# Test blockchain API
curl http://localhost:3000/api/health
curl http://localhost:3000/api/blockchain
```

#### **2. Integration Testing**
```javascript
// Test blockchain integration
const response = await fetch('http://localhost:3000/api/wallet/generate');
const wallet = await response.json();
console.log('Generated wallet:', wallet.wallet.address);
```

### **Production Use Cases**

#### **1. Cryptocurrency Development**
- Use real blockchain as foundation
- Add custom consensus mechanisms
- Implement smart contracts

#### **2. Supply Chain Tracking**
- Use blockchain for product tracking
- Implement custom transaction types
- Add verification mechanisms

#### **3. Voting Systems**
- Use blockchain for secure voting
- Implement custom validation rules
- Add anonymity features

### **Testing Scenarios**

#### **1. Load Testing**
```bash
# Create many transactions
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/wallet/transaction \
    -H "Content-Type: application/json" \
    -d "{\"to\": \"0x1234...\", \"amount\": $i, \"fee\": 0.001}"
done
```

#### **2. Mining Testing**
```bash
# Mine multiple blocks
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/mine \
    -H "Content-Type: application/json" \
    -d '{"minerAddress": "YOUR_ADDRESS"}'
  sleep 2
done
```

---

## 🎉 Success Checklist

### **Simple Blockchain:**
- [ ] Launcher script works
- [ ] Web interface opens
- [ ] Transactions can be created
- [ ] Blocks are generated
- [ ] Balances are updated
- [ ] Transaction history is maintained

### **Real Blockchain:**
- [ ] Dependencies installed
- [ ] Server starts successfully
- [ ] Wallets can be generated
- [ ] Transactions can be created
- [ ] Blocks can be mined
- [ ] API endpoints respond
- [ ] Web interface works
- [ ] Blockchain validation passes

---

## 📞 Support

If you encounter any issues:

1. **Check the troubleshooting section**
2. **Run the test suites**
3. **Check the console logs**
4. **Verify your environment**

Both blockchain implementations are thoroughly tested and documented. Enjoy exploring the world of blockchain technology! 🚀