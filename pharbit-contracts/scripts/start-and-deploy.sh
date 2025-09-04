#!/bin/bash

# Pharbit Contracts - Start Node and Deploy Script
# This script starts a Hardhat node, deploys contracts, and exports addresses/ABIs

set -e  # Exit on any error

echo "🏥 Pharbit Pharmaceutical Blockchain - Local Development Setup"
echo "=============================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "hardhat.config.cjs" ]; then
    print_error "Please run this script from the pharbit-contracts directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "Checking dependencies..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies"
        exit 1
    fi
    print_success "Dependencies installed successfully"
else
    print_success "Dependencies already installed"
fi

# Compile contracts
print_status "Compiling contracts..."
npm run compile
if [ $? -ne 0 ]; then
    print_error "Contract compilation failed"
    exit 1
fi
print_success "Contracts compiled successfully"

# Kill any existing Hardhat node processes
print_status "Checking for existing Hardhat node processes..."
if pgrep -f "hardhat node" > /dev/null; then
    print_warning "Found existing Hardhat node processes. Killing them..."
    pkill -f "hardhat node" || true
    sleep 2
fi

# Start Hardhat node in background
print_status "Starting Hardhat node on localhost:8545..."
npx hardhat node > hardhat-node.log 2>&1 &
HARDHAT_PID=$!

# Wait for node to start
print_status "Waiting for Hardhat node to start..."
sleep 5

# Check if node is running
if ! kill -0 $HARDHAT_PID 2>/dev/null; then
    print_error "Failed to start Hardhat node"
    cat hardhat-node.log
    exit 1
fi

print_success "Hardhat node started successfully (PID: $HARDHAT_PID)"

# Wait a bit more for the node to be fully ready
sleep 3

# Deploy contracts
print_status "Deploying contracts to localhost..."
npm run deploy:localhost
if [ $? -ne 0 ]; then
    print_error "Contract deployment failed"
    print_status "Stopping Hardhat node..."
    kill $HARDHAT_PID 2>/dev/null || true
    exit 1
fi
print_success "Contracts deployed successfully"

# Export addresses and ABIs
print_status "Exporting addresses and ABIs..."
npm run export
if [ $? -ne 0 ]; then
    print_warning "Address/ABI export failed, but deployment was successful"
fi

# Display deployment summary
print_status "Deployment Summary:"
echo "==================="

if [ -f "deployments/addresses.localhost.json" ]; then
    echo "Contract addresses saved to: deployments/addresses.localhost.json"
    echo "Contract addresses also saved to: deployments/addresses.local.json"
    echo ""
    echo "Contract Addresses:"
    echo "------------------"
    cat deployments/addresses.localhost.json | grep -E '"(governance|stakeholder|sensor|batch|supplyChain)"' | sed 's/^/  /'
fi

if [ -d "frontend/src/contracts" ]; then
    echo ""
    echo "ABI files copied to: frontend/src/contracts/"
    ls -la frontend/src/contracts/*.json 2>/dev/null | awk '{print "  " $9}' || echo "  No ABI files found"
fi

echo ""
print_success "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Hardhat node is running on http://localhost:8545"
echo "2. You can now start the backend API: npm run backend"
echo "3. Or start the frontend dashboard"
echo ""
echo "To stop the Hardhat node, run: kill $HARDHAT_PID"
echo "Or use Ctrl+C and then: pkill -f 'hardhat node'"
echo ""
echo "Logs are available in: hardhat-node.log"

# Keep the script running to maintain the node
print_status "Hardhat node is running. Press Ctrl+C to stop..."
trap 'print_status "Stopping Hardhat node..."; kill $HARDHAT_PID 2>/dev/null || true; print_success "Hardhat node stopped"; exit 0' INT

# Wait for the Hardhat node process
wait $HARDHAT_PID