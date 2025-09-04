#!/bin/bash

# Pharbit Contracts - Complete Deployment Script
# This script starts Hardhat node, deploys contracts, and exports addresses/ABIs

set -e  # Exit on any error

echo "🏥 Pharbit Pharmaceutical Blockchain - Complete Deployment"
echo "=========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

print_header() {
    echo -e "${PURPLE}[HEADER]${NC} $1"
}

# Function to cleanup on exit
cleanup() {
    if [ ! -z "$HARDHAT_PID" ] && kill -0 $HARDHAT_PID 2>/dev/null; then
        print_status "Stopping Hardhat node (PID: $HARDHAT_PID)..."
        kill $HARDHAT_PID 2>/dev/null || true
        sleep 2
    fi
    
    # Remove log file if it exists
    if [ -f "hardhat-node.log" ]; then
        rm -f hardhat-node.log
    fi
}

# Set up cleanup trap
trap cleanup EXIT INT TERM

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

print_header "Step 1: Environment Check"
print_status "Node.js version: $(node --version)"
print_status "npm version: $(npm --version)"
print_status "Current directory: $(pwd)"

print_header "Step 2: Dependencies Check"
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

print_header "Step 3: Contract Compilation"
print_status "Compiling contracts..."
npm run compile
if [ $? -ne 0 ]; then
    print_error "Contract compilation failed"
    exit 1
fi
print_success "Contracts compiled successfully"

print_header "Step 4: Hardhat Node Setup"
# Kill any existing Hardhat node processes
print_status "Checking for existing Hardhat node processes..."
if pgrep -f "hardhat node" > /dev/null; then
    print_warning "Found existing Hardhat node processes. Killing them..."
    pkill -f "hardhat node" || true
    sleep 3
fi

# Start Hardhat node in background
print_status "Starting Hardhat node on localhost:8545..."
npx hardhat node > hardhat-node.log 2>&1 &
HARDHAT_PID=$!

# Wait for node to start
print_status "Waiting for Hardhat node to initialize..."
sleep 5

# Check if node is running
if ! kill -0 $HARDHAT_PID 2>/dev/null; then
    print_error "Failed to start Hardhat node"
    if [ -f "hardhat-node.log" ]; then
        print_error "Hardhat node logs:"
        cat hardhat-node.log
    fi
    exit 1
fi

# Test node connectivity
print_status "Testing Hardhat node connectivity..."
if ! curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545 > /dev/null; then
    print_error "Hardhat node is not responding on localhost:8545"
    print_error "Node logs:"
    cat hardhat-node.log
    exit 1
fi

print_success "Hardhat node started successfully (PID: $HARDHAT_PID)"

print_header "Step 5: Contract Deployment"
print_status "Deploying contracts to localhost..."
npm run deploy:localhost
if [ $? -ne 0 ]; then
    print_error "Contract deployment failed"
    exit 1
fi
print_success "Contracts deployed successfully"

print_header "Step 6: Export Addresses and ABIs"
print_status "Exporting addresses and ABIs..."
npm run export
if [ $? -ne 0 ]; then
    print_warning "Address/ABI export failed, but deployment was successful"
fi

print_header "Step 7: Deployment Summary"
print_status "Deployment completed successfully!"

# Display deployment summary
if [ -f "deployments/addresses.localhost.json" ]; then
    print_success "Contract addresses saved to: deployments/addresses.localhost.json"
    print_success "Contract addresses also saved to: deployments/addresses.local.json"
    
    echo ""
    print_status "Contract Addresses:"
    echo "------------------"
    
    # Extract and display contract addresses
    if command -v jq &> /dev/null; then
        # Use jq if available for pretty formatting
        cat deployments/addresses.localhost.json | jq -r '.contracts | to_entries[] | "  \(.key): \(.value)"'
    else
        # Fallback to grep/sed
        cat deployments/addresses.localhost.json | grep -E '"(governance|stakeholder|sensor|batch|supplyChain)"' | sed 's/^/  /'
    fi
fi

# Check ABI files
if [ -d "frontend/src/contracts" ]; then
    echo ""
    print_success "ABI files copied to: frontend/src/contracts/"
    ABI_COUNT=$(ls -1 frontend/src/contracts/*.json 2>/dev/null | wc -l)
    print_status "ABI files available: $ABI_COUNT"
fi

# Check consolidated addresses
if [ -f "contract-addresses.json" ]; then
    print_success "Consolidated addresses saved to: contract-addresses.json"
fi

echo ""
print_success "🎉 Complete deployment finished successfully!"
echo ""
print_status "Next steps:"
echo "1. Hardhat node is running on http://localhost:8545"
echo "2. Start the backend API: npm run backend"
echo "3. Open the frontend dashboard"
echo "4. Connect MetaMask to localhost:8545"
echo ""
print_status "To stop the Hardhat node, press Ctrl+C or run: pkill -f 'hardhat node'"
echo ""

# Keep the script running to maintain the node
print_status "Hardhat node is running. Press Ctrl+C to stop..."
print_warning "Note: The node will continue running in the background after this script exits"

# Wait for user interrupt
wait $HARDHAT_PID