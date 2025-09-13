# 📚 PharbitChain Documentation Index

## 🎯 **Current Status: FULLY OPERATIONAL**

PharbitChain is a **production-ready blockchain platform** with a complete web interface. All documentation has been updated to reflect the current working state.

## 📖 **Main Documentation**

### **🚀 Getting Started**
- **[README.md](./README.md)** - Main project overview and quick start guide
- **[USAGE_GUIDE.md](./USAGE_GUIDE.md)** - Complete usage guide with examples
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Detailed project structure

### **🔧 Technical Documentation**
- **[real-blockchain/README.md](./real-blockchain/README.md)** - Blockchain implementation details
- **[PHARBIT_ALWAYS_RUNNING.md](./PHARBIT_ALWAYS_RUNNING.md)** - Always-running server guide

## 🌐 **Web Interface**

### **Access Points**
- **Main Interface**: http://localhost:3000
- **API Base**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/api/health

### **Features Available**
- 💰 **Wallet Management** - Generate, import, export wallets
- 💸 **Transaction System** - Send cryptocurrency between wallets
- ⛏️ **Mining System** - Mine blocks and earn rewards
- 💊 **Pharmaceutical Features** - Complete batch tracking system
- 📊 **Blockchain Explorer** - Real-time blockchain statistics

## 🔧 **Management Commands**

### **Quick Commands**
```bash
# Check server status
/workspace/manage-pharbit.sh status

# Start server
/workspace/manage-pharbit.sh start

# Stop server
/workspace/manage-pharbit.sh stop

# Restart server
/workspace/manage-pharbit.sh restart

# View logs
/workspace/manage-pharbit.sh logs

# Open web interface
/workspace/manage-pharbit.sh web
```

### **Always-Running Mode**
```bash
# Start with auto-restart
/workspace/start-pharbit-always.sh

# Stop server
/workspace/stop-pharbit.sh
```

## 📡 **API Reference**

### **Core Endpoints**
- `GET /api/health` - Health check
- `GET /api/blockchain` - Get complete blockchain
- `GET /api/transactions/pending` - Get pending transactions
- `POST /api/wallet/generate` - Generate new wallet
- `POST /api/mine` - Mine pending transactions

### **Pharmaceutical Endpoints**
- `POST /api/batch` - Create medicine batch
- `GET /api/batch/:batchId` - Get batch information
- `POST /api/supply-chain/transfer` - Transfer batch custody
- `POST /api/sensor-data` - Submit IoT sensor data
- `GET /api/alerts` - Get system alerts

## 🎯 **Quick Start Guide**

### **1. Start the Server**
```bash
/workspace/start-pharbit-always.sh
```

### **2. Open Web Interface**
Go to: **http://localhost:3000**

### **3. Start Using**
- Generate wallets
- Create transactions
- Mine blocks
- Create medicine batches
- Monitor blockchain

## 🔄 **Auto-Restart Features**

- ✅ **PM2 Process Manager** - Primary restart mechanism
- ✅ **Health Monitoring** - Backup restart system
- ✅ **Log Management** - Comprehensive logging
- ✅ **Always Running** - Server runs 24/7

## 📊 **Current Status**

- **Server**: ✅ Running with PM2
- **Web Interface**: ✅ Accessible at http://localhost:3000
- **API**: ✅ All endpoints responding
- **Database**: ✅ LevelDB + Memory fallback
- **Auto-restart**: ✅ Configured and working

## 🆘 **Troubleshooting**

### **Quick Help**
```bash
# Check if server is running
curl http://localhost:3000/api/health

# View server logs
/workspace/manage-pharbit.sh logs

# Restart if needed
/workspace/manage-pharbit.sh restart
```

### **Common Issues**
- **Port 3000 in use**: Kill process using `lsof -i :3000`
- **Server not responding**: Restart with `/workspace/manage-pharbit.sh restart`
- **Web interface not loading**: Check server status and logs

## 📞 **Support**

All documentation is up-to-date and reflects the current working state of PharbitChain. The system is fully operational and ready for production use.

**Start exploring blockchain technology and pharmaceutical supply chain management today!** 🚀