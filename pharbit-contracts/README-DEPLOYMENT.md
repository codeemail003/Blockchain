# Pharbit Contracts - Complete Deployment Solution

This document provides a complete working solution for deploying Pharbit pharmaceutical blockchain contracts to localhost with full CommonJS compatibility.

## 🚀 Quick Start

### Single Command Deployment
```bash
cd pharbit-contracts
./deploy.sh
```

This single command will:
1. ✅ Install dependencies
2. ✅ Compile contracts
3. ✅ Start Hardhat node
4. ✅ Deploy all 5 contracts
5. ✅ Export addresses and ABIs
6. ✅ Display deployment summary

## 📁 Files Created

### 1. `scripts/deploy-localhost.js`
- **Purpose**: CommonJS deployment script for localhost
- **Features**:
  - Uses `require()` instead of ES6 imports
  - Deploys all 5 Pharbit contracts in correct order
  - Handles errors gracefully
  - Saves addresses to `deployments/addresses.localhost.json`
  - Displays deployment summary

### 2. `scripts/export-addresses.js`
- **Purpose**: Export contract ABIs and create consolidated addresses
- **Features**:
  - Copies ABIs from `artifacts/` to `frontend/src/contracts/`
  - Creates consolidated addresses file
  - Uses CommonJS syntax
  - Handles missing files gracefully

### 3. `deploy.sh`
- **Purpose**: Complete deployment automation script
- **Features**:
  - Starts Hardhat node in background
  - Waits for node initialization
  - Runs deployment and export scripts
  - Colored output and error handling
  - Cleanup on exit

### 4. Updated `package.json`
- **Added Scripts**:
  - `deploy:localhost` - Deploy to localhost
  - `deploy:full` - Run complete deployment script
  - `export` - Export addresses and ABIs

### 5. Enhanced `hardhat.config.cjs`
- **Improvements**:
  - Proper localhost network configuration
  - Test accounts with 10,000 ETH each
  - Chain ID 31337 for local development

## 🔧 Contract Deployment Order

The contracts are deployed in the following dependency order:

1. **PharbitGovernance** - Governance contract with admin privileges
2. **PharbitStakeholder** - Stakeholder management contract  
3. **PharbitSensor** - IoT sensor data validation contract
4. **PharbitBatch** - Pharmaceutical batch tracking contract
5. **PharbitSupplyChain** - Supply chain workflow contract

## 📊 Output Files

After successful deployment:

### Address Files
- `deployments/addresses.localhost.json` - Full deployment data
- `deployments/addresses.local.json` - Latest deployment (compatibility)
- `contract-addresses.json` - Consolidated addresses (root)
- `frontend/src/contract-addresses.json` - Frontend addresses

### ABI Files
- `frontend/src/contracts/PharbitGovernance.json`
- `frontend/src/contracts/PharbitStakeholder.json`
- `frontend/src/contracts/PharbitSensor.json`
- `frontend/src/contracts/PharbitBatch.json`
- `frontend/src/contracts/PharbitSupplyChain.json`

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `./deploy.sh` | Complete deployment (recommended) |
| `npm run deploy:full` | Same as above |
| `npm run deploy:localhost` | Deploy contracts only |
| `npm run export` | Export addresses and ABIs only |
| `npm run compile` | Compile contracts |
| `npm run node` | Start Hardhat node only |

## 🔍 Troubleshooting

### Common Issues

1. **"Cannot find module" errors**
   ```bash
   npm install
   ```

2. **"Hardhat node not running"**
   ```bash
   npm run node
   # Then in another terminal:
   npm run deploy:localhost
   ```

3. **"Contract compilation failed"**
   ```bash
   npm run clean
   npm run compile
   ```

4. **"Permission denied" for deploy.sh**
   ```bash
   chmod +x deploy.sh
   ```

### Verification Steps

1. **Check Hardhat node is running**:
   ```bash
   curl -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        http://localhost:8545
   ```

2. **Check deployment files**:
   ```bash
   ls -la deployments/
   ls -la frontend/src/contracts/
   ```

3. **View contract addresses**:
   ```bash
   cat deployments/addresses.localhost.json
   ```

## 🌐 Network Configuration

### Localhost Network
- **URL**: `http://127.0.0.1:8545`
- **Chain ID**: `31337`
- **Accounts**: 20 test accounts with 10,000 ETH each
- **Mnemonic**: `"test test test test test test test test test test test junk"`

### Test Accounts
The first 5 accounts are commonly used:
- Account 0: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Account 1: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- Account 2: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- Account 3: `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
- Account 4: `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`

## 🔄 Development Workflow

1. **Make contract changes**
2. **Compile**: `npm run compile`
3. **Deploy**: `./deploy.sh` (full) or `npm run deploy:localhost` (quick)
4. **Test**: Use deployed addresses in frontend/backend
5. **Repeat** as needed

## 🎯 Next Steps

After successful deployment:

1. **Start Backend API**:
   ```bash
   npm run backend
   ```

2. **Open Frontend Dashboard**:
   - Open `frontend/public/index.html` in browser
   - Connect MetaMask to `http://localhost:8545`
   - Import test account using mnemonic above

3. **Test Contracts**:
   - Use the provided UI to interact with contracts
   - Check contract addresses in MetaMask
   - Verify transactions on localhost

## 📝 Environment Variables

The following environment variables are supported (optional):

```bash
# .env file
ETHERSCAN_API_KEY=your_etherscan_key
RPC_URL=your_rpc_url
PRIVATE_KEY=your_private_key
POLYGONSCAN_API_KEY=your_polygonscan_key
```

## ✅ Success Indicators

You'll know the deployment was successful when you see:

- ✅ All 5 contracts deployed with addresses
- ✅ Addresses saved to `deployments/addresses.localhost.json`
- ✅ ABIs copied to `frontend/src/contracts/`
- ✅ Hardhat node running on `http://localhost:8545`
- ✅ No ES6/CommonJS syntax errors

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Check console output for specific error messages
4. Ensure network connectivity
5. Review the deployment logs in `hardhat-node.log`

---

**🎉 You now have a complete, working deployment system for your Pharbit pharmaceutical blockchain contracts!**