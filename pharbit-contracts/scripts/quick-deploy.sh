#!/bin/bash

# Quick Deploy Script - Assumes Hardhat node is already running
# Usage: ./scripts/quick-deploy.sh

set -e

echo "🚀 Quick Deploy to Localhost"
echo "============================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "hardhat.config.cjs" ]; then
    echo "❌ Please run this script from the pharbit-contracts directory"
    exit 1
fi

# Check if Hardhat node is running
if ! curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545 > /dev/null; then
    echo "❌ Hardhat node is not running on localhost:8545"
    echo "   Please start it first with: npm run node"
    echo "   Or use the full setup script: ./scripts/start-and-deploy.sh"
    exit 1
fi

echo "✅ Hardhat node is running"

# Compile contracts
echo "📋 Compiling contracts..."
npm run compile

# Deploy contracts
echo "🚀 Deploying contracts..."
npm run deploy:localhost

# Export addresses and ABIs
echo "📤 Exporting addresses and ABIs..."
npm run export

echo "✅ Quick deployment completed!"
echo ""
echo "Contract addresses saved to: deployments/addresses.localhost.json"
echo "ABI files copied to: frontend/src/contracts/"