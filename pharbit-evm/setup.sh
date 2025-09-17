#!/bin/bash

# Clean up existing installation
rm -rf node_modules package-lock.json

# Initialize a fresh package.json
echo '{
  "name": "pharbit-evm",
  "version": "1.0.0",
  "description": "EVM-compatible pharmaceutical blockchain",
  "scripts": {
    "test": "hardhat test",
    "node": "hardhat node",
    "deploy": "hardhat run scripts/deploy.js --network localhost"
  },
  "dependencies": {},
  "devDependencies": {}
}' > package.json

# Install dependencies with specific versions
npm install --save-dev \
  hardhat@2.16.0 \
  @nomiclabs/hardhat-ethers@2.2.3 \
  @nomiclabs/hardhat-waffle@2.0.6 \
  @openzeppelin/contracts@4.9.0 \
  ethereum-waffle@4.0.10 \
  ethers@5.7.2 \
  chai@4.3.7 \
  --legacy-peer-deps

# Initialize Hardhat if config doesn't exist
if [ ! -f hardhat.config.js ]; then
  npx hardhat
fi