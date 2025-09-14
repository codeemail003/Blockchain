# 🚀 PharbitChain - Always Running Server

Your PharbitChain blockchain server is now configured to run continuously with automatic restart capabilities.

## ✅ **Current Status**
- **Server Status**: ✅ Running
- **Web Interface**: http://localhost:3000
- **API Base**: http://localhost:3000/api
- **Process Manager**: PM2 (Production-ready)

## 🔧 **Management Commands**

### **Quick Commands:**
```bash
# Check server status
/workspace/manage-pharbit.sh status

# View server logs
/workspace/manage-pharbit.sh logs

# Restart server
/workspace/manage-pharbit.sh restart

# Stop server
/workspace/manage-pharbit.sh stop

# Start server
/workspace/manage-pharbit.sh start

# Open web interface
/workspace/manage-pharbit.sh web

# Real-time monitoring
/workspace/manage-pharbit.sh monitor
```

### **PM2 Commands (Advanced):**
```bash
# View all processes
pm2 status

# View logs
pm2 logs pharbit-blockchain

# Restart
pm2 restart pharbit-blockchain

# Stop
pm2 stop pharbit-blockchain

# Start
pm2 start pharbit-blockchain

# Monitor dashboard
pm2 monit
```

## 🔄 **Auto-Restart Features**

### **1. PM2 Process Manager**
- ✅ **Automatic restart** on crashes
- ✅ **Memory monitoring** (restarts if memory usage too high)
- ✅ **Process persistence** across reboots
- ✅ **Log management** with rotation

### **2. Health Monitoring**
- ✅ **Health checks** every minute
- ✅ **Automatic recovery** if server becomes unresponsive
- ✅ **Logging** of all restart events

## 📁 **File Locations**

```
/workspace/real-blockchain/          # Main server directory
├── src/index.js                     # Server code
├── public/index.html                # Web interface
├── logs/                           # Log files
│   ├── server.log                  # Server output
│   └── monitor.log                 # Monitor logs
├── ecosystem.config.js             # PM2 configuration
└── start-server.sh                 # Startup script

/workspace/                          # Management scripts
├── manage-pharbit.sh               # Main management script
├── start-pharbit-always.sh         # Always-running startup
├── stop-pharbit.sh                 # Stop script
└── monitor-pharbit.sh              # Health monitor
```

## 🌐 **Web Interface Features**

Your web interface at **http://localhost:3000** includes:

### **💰 Wallet Management**
- Generate new wallets
- Connect MetaMask
- View balances
- Import/export wallets

### **💸 Transaction System**
- Send cryptocurrency
- View transaction history
- Pending transactions

### **⛏️ Mining System**
- Mine new blocks
- Mining status
- Difficulty adjustment

### **💊 Pharmaceutical Features**
- Create medicine batches
- Verify batch authenticity
- Supply chain transfers
- IoT sensor data
- Alert system

### **📊 Blockchain Explorer**
- Real-time statistics
- Block information
- Live updates

## 🔍 **Troubleshooting**

### **If Server Stops:**
```bash
# Check status
/workspace/manage-pharbit.sh status

# Restart if needed
/workspace/manage-pharbit.sh restart

# Check logs for errors
/workspace/manage-pharbit.sh logs
```

### **If Web Interface Not Loading:**
```bash
# Check if server is running
curl http://localhost:3000/api/health

# Restart server
/workspace/manage-pharbit.sh restart
```

### **If PM2 Issues:**
```bash
# Reset PM2
pm2 kill
pm2 start pharbit-blockchain
pm2 save
```

## 📈 **Monitoring**

### **Real-time Monitoring:**
```bash
# PM2 dashboard
pm2 monit

# Or use management script
/workspace/manage-pharbit.sh monitor
```

### **Log Monitoring:**
```bash
# Follow logs in real-time
pm2 logs pharbit-blockchain --follow

# Or view recent logs
/workspace/manage-pharbit.sh logs
```

## 🎯 **Key Benefits**

1. **🔄 Always Running**: Server automatically restarts on crashes
2. **📊 Production Ready**: PM2 provides enterprise-grade process management
3. **🔍 Easy Monitoring**: Simple commands to check status and logs
4. **🌐 Complete Web Interface**: Full blockchain functionality in browser
5. **📱 Responsive Design**: Works on desktop and mobile
6. **🔧 Easy Management**: Simple scripts for all operations

## 🚀 **Getting Started**

1. **Open your browser** and go to http://localhost:3000
2. **Generate wallets** using the wallet management section
3. **Create transactions** and mine blocks
4. **Create medicine batches** for pharmaceutical tracking
5. **Monitor everything** through the web interface

Your PharbitChain server is now running continuously and will automatically restart if it ever crashes! 🎉