# Pharbit Contracts - Deployment Guide

This guide explains how to deploy the Pharbit pharmaceutical blockchain contracts to localhost using CommonJS-compatible scripts.

## Prerequisites

- Node.js (v16 or higher)
- npm
- Git

## Quick Start

### Option 1: Full Setup (Recommended for first time)
```bash
cd pharbit-contracts
npm run setup
```

This will:
1. Install dependencies
2. Compile contracts
3. Start Hardhat node
4. Deploy all contracts
5. Export addresses and ABIs
6. Keep the node running

### Option 2: Quick Deploy (If node is already running)
```bash
cd pharbit-contracts
npm run quick-deploy
```

### Option 3: Manual Steps
```bash
# 1. Install dependencies
npm install

# 2. Compile contracts
npm run compile

# 3. Start Hardhat node (in separate terminal)
npm run node

# 4. Deploy contracts (in another terminal)
npm run deploy:localhost

# 5. Export addresses and ABIs
npm run export
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run setup` | Full setup: install, compile, start node, deploy, export |
| `npm run quick-deploy` | Quick deploy (assumes node is running) |
| `npm run compile` | Compile Solidity contracts |
| `npm run deploy:localhost` | Deploy contracts to localhost |
| `npm run export` | Export addresses and ABIs |
| `npm run node` | Start Hardhat node |
| `npm run backend` | Start backend API server |

## Contract Deployment Order

The contracts are deployed in the following order:

1. **PharbitGovernance** - Governance contract with admin privileges
2. **PharbitStakeholder** - Stakeholder management contract
3. **PharbitSensor** - IoT sensor data validation contract
4. **PharbitBatch** - Pharmaceutical batch tracking contract
5. **PharbitSupplyChain** - Supply chain workflow contract

## Output Files

After successful deployment, the following files are created:

### Address Files
- `deployments/addresses.localhost.json` - Contract addresses for localhost
- `deployments/addresses.local.json` - Latest deployment addresses

### ABI Files
- `frontend/src/contracts/PharbitGovernance.json`
- `frontend/src/contracts/PharbitStakeholder.json`
- `frontend/src/contracts/PharbitSensor.json`
- `frontend/src/contracts/PharbitBatch.json`
- `frontend/src/contracts/PharbitSupplyChain.json`

## Network Configuration

The project is configured to work with:

- **localhost**: `http://127.0.0.1:8545` (Hardhat node)
- **hardhat**: In-memory network for testing
- **sepolia**: Ethereum Sepolia testnet (if configured)
- **polygonTestnet**: Polygon testnet (if configured)

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**
   - Run `npm install` to install dependencies
   - Ensure you're in the `pharbit-contracts` directory

2. **"Hardhat node not running"**
   - Start the node with `npm run node`
   - Or use the full setup script `npm run setup`

3. **"Contract compilation failed"**
   - Check Solidity syntax in contract files
   - Ensure all imports are correct
   - Run `npm run clean` then `npm run compile`

4. **"Deployment failed"**
   - Check if Hardhat node is running
   - Verify network configuration in `hardhat.config.cjs`
   - Check contract constructor parameters

### Logs

- Hardhat node logs: `hardhat-node.log`
- Deployment logs: Console output during deployment
- Error logs: Console output with error details

## Development Workflow

1. **Make contract changes**
2. **Compile**: `npm run compile`
3. **Deploy**: `npm run quick-deploy` (if node running) or `npm run setup`
4. **Test**: Use the deployed addresses in your frontend/backend
5. **Repeat** as needed

## Stopping the Node

To stop the Hardhat node:
- If using the setup script: Press `Ctrl+C`
- If running manually: Press `Ctrl+C` in the terminal running the node
- Or kill the process: `pkill -f "hardhat node"`

## Next Steps

After successful deployment:

1. **Start the backend API**: `npm run backend`
2. **Open the frontend dashboard**: Open `frontend/public/index.html` in a browser
3. **Connect MetaMask** to `http://localhost:8545`
4. **Test the contracts** using the provided UI

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the console output for error messages
3. Ensure all prerequisites are installed
4. Verify network connectivity