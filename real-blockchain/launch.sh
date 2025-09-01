#!/bin/bash

echo "🚀 Real Blockchain Launcher"
echo "============================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies."
        exit 1
    fi
    print_status "Dependencies installed successfully!"
fi

# Function to start the blockchain server
start_server() {
    print_info "Starting Real Blockchain Server..."
    print_info "The server will be available at: http://localhost:3000"
    print_info "Web interface will be available at: http://localhost:3000"
    print_info "API documentation will be shown in the console"
    echo ""
    print_info "Press Ctrl+C to stop the server"
    echo ""
    npm start
}

# Function to run tests
run_tests() {
    print_info "Running Real Blockchain Tests..."
    echo ""
    node test-blockchain.js
}

# Function to open web interface
open_web_interface() {
    print_info "Opening web interface..."
    
    # Check if server is running
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        print_status "Server is running!"
        print_info "Opening web interface in your browser..."
        
        # Try to open browser
        if command -v xdg-open &> /dev/null; then
            xdg-open http://localhost:3000
        elif command -v open &> /dev/null; then
            open http://localhost:3000
        elif command -v start &> /dev/null; then
            start http://localhost:3000
        else
            print_info "Please open your browser and go to: http://localhost:3000"
        fi
    else
        print_warning "Server is not running. Starting server first..."
        start_server &
        sleep 3
        open_web_interface
    fi
}

# Function to show API documentation
show_api_docs() {
    echo ""
    echo "🌐 Real Blockchain API Documentation"
    echo "===================================="
    echo ""
    echo "Base URL: http://localhost:3000/api"
    echo ""
    echo "📋 Available Endpoints:"
    echo ""
    echo "🔗 Blockchain Operations:"
    echo "  GET  /blockchain              - Get complete blockchain"
    echo "  GET  /blockchain/latest       - Get latest block"
    echo "  GET  /blockchain/block/:index - Get block by index"
    echo "  GET  /blockchain/validate     - Validate blockchain integrity"
    echo ""
    echo "💸 Transaction Operations:"
    echo "  GET  /transactions/pending    - Get pending transactions"
    echo "  POST /transactions            - Create new transaction"
    echo "  GET  /transactions/:address   - Get transaction history"
    echo ""
    echo "⛏️  Mining Operations:"
    echo "  POST /mine                    - Mine pending transactions"
    echo "  GET  /mining/status           - Get mining status"
    echo ""
    echo "💰 Wallet Operations:"
    echo "  GET  /wallet                  - Get wallet information"
    echo "  POST /wallet/generate         - Generate new wallet"
    echo "  POST /wallet/import           - Import wallet from private key"
    echo "  POST /wallet/transaction      - Create transaction from wallet"
    echo ""
    echo "🏦 Account Operations:"
    echo "  GET  /balance/:address        - Get address balance"
    echo ""
    echo "🔧 System Operations:"
    echo "  GET  /health                  - Health check"
    echo ""
    echo "📝 Example Usage:"
    echo ""
    echo "Generate a wallet:"
    echo "  curl -X POST http://localhost:3000/api/wallet/generate"
    echo ""
    echo "Create a transaction:"
    echo "  curl -X POST http://localhost:3000/api/wallet/transaction \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"to\": \"0x1234...\", \"amount\": 10, \"fee\": 0.001}'"
    echo ""
    echo "Mine a block:"
    echo "  curl -X POST http://localhost:3000/api/mine \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"minerAddress\": \"0x1234...\"}'"
    echo ""
}

# Function to show blockchain features
show_features() {
    echo ""
    echo "🎯 Real Blockchain Features"
    echo "==========================="
    echo ""
    echo "🔐 Cryptographic Security:"
    echo "  ✅ Elliptic Curve Cryptography (secp256k1 - same as Bitcoin)"
    echo "  ✅ Digital Signatures for transaction verification"
    echo "  ✅ SHA256 & Double SHA256 hashing"
    echo "  ✅ Address Generation from public keys"
    echo "  ✅ Private Key Management with secure storage"
    echo ""
    echo "⛏️  Proof of Work Consensus:"
    echo "  ✅ Mining Algorithm with adjustable difficulty"
    echo "  ✅ Block Validation with cryptographic proofs"
    echo "  ✅ Merkle Trees for transaction verification"
    echo "  ✅ Nonce Generation for mining"
    echo ""
    echo "💰 Transaction System:"
    echo "  ✅ Signed Transactions with private keys"
    echo "  ✅ Transaction Validation and verification"
    echo "  ✅ Fee System for miners"
    echo "  ✅ Double Spending Protection"
    echo "  ✅ Balance Tracking for all addresses"
    echo ""
    echo "🗄️  Data Persistence:"
    echo "  ✅ LevelDB for blockchain storage"
    echo "  ✅ Wallet Persistence with secure file storage"
    echo "  ✅ Transaction History tracking"
    echo "  ✅ Blockchain Validation and integrity checks"
    echo ""
    echo "🌐 API Server:"
    echo "  ✅ RESTful API for all blockchain operations"
    echo "  ✅ Real-time Mining capabilities"
    echo "  ✅ Wallet Management endpoints"
    echo "  ✅ Blockchain Explorer functionality"
    echo ""
}

# Main menu
while true; do
    echo ""
    echo "Choose an option:"
    echo "1. 🚀 Start Blockchain Server"
    echo "2. 🧪 Run Tests"
    echo "3. 🌐 Open Web Interface"
    echo "4. 📚 Show API Documentation"
    echo "5. 🎯 Show Features"
    echo "6. 🚪 Exit"
    echo ""
    read -p "Enter your choice (1-6): " choice
    
    case $choice in
        1)
            start_server
            break
            ;;
        2)
            run_tests
            ;;
        3)
            open_web_interface
            ;;
        4)
            show_api_docs
            ;;
        5)
            show_features
            ;;
        6)
            print_info "Thank you for using Real Blockchain!"
            exit 0
            ;;
        *)
            echo "❌ Invalid choice. Please enter a number between 1-6."
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
done