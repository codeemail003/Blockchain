#!/bin/bash

# Start local Hardhat network in the background
echo "Starting local Hardhat network..."
npx hardhat node &
HARDHAT_PID=$!

# Wait for network to start
sleep 5

# Deploy contracts to local network
echo "Deploying contracts..."
npx hardhat run scripts/deploy.js --network localhost

# Run tests
echo "Running tests..."
npx hardhat test

# Clean up
kill $HARDHAT_PID