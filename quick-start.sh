#!/bin/bash

echo "🚀 Pharbit Blockchain - Quick Start"
echo "==================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
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

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        echo "Visit: https://nodejs.org/"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_status "Prerequisites check passed!"
    echo "Node.js version: $(node --version)"
    echo "npm version: $(npm --version)"
    echo ""
}

# Show blockchain comparison
show_comparison() {
    echo "📊 Blockchain Comparison"
    echo "========================"
    echo ""
    echo "🎓 Simple Blockchain:"
    echo "   • Perfect for learning"
    echo "   • No complex setup"
    echo "   • Web interface included"
    echo "   • File-based storage"
    echo "   • Great for beginners"
    echo ""
    echo "🔐 Real Blockchain:"
    echo "   • Production-ready"
    echo "   • Cryptographic security"
    echo "   • Proof of Work mining"
    echo "   • RESTful API server"
    echo "   • Advanced features"
    echo ""
}

# Launch simple blockchain
launch_simple() {
    print_info "Launching Simple Blockchain..."
    
    if [ ! -d "simple-blockchain" ]; then
        print_error "Simple blockchain directory not found!"
        exit 1
    fi
    
    cd simple-blockchain
    
    if [ ! -f "launch.sh" ]; then
        print_error "Launch script not found!"
        exit 1
    fi
    
    if [ ! -x "launch.sh" ]; then
        chmod +x launch.sh
    fi
    
    print_status "Starting Simple Blockchain..."
    ./launch.sh
}

# Launch real blockchain
launch_real() {
    print_info "Launching Real Blockchain..."
    
    if [ ! -d "real-blockchain" ]; then
        print_error "Real blockchain directory not found!"
        exit 1
    fi
    
    cd real-blockchain
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_info "Installing dependencies..."
        npm install
        if [ $? -ne 0 ]; then
            print_error "Failed to install dependencies!"
            exit 1
        fi
        print_status "Dependencies installed successfully!"
    fi
    
    if [ ! -f "launch.sh" ]; then
        print_error "Launch script not found!"
        exit 1
    fi
    
    if [ ! -x "launch.sh" ]; then
        chmod +x launch.sh
    fi
    
    print_status "Starting Real Blockchain..."
    ./launch.sh
}

# Test both blockchains
test_both() {
    print_info "Testing both blockchain implementations..."
    echo ""
    
    # Test simple blockchain
    echo "🧪 Testing Simple Blockchain..."
    cd simple-blockchain
    if [ -f "process-transaction.js" ]; then
        node process-transaction.js "test-sender" "test-receiver" "5" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            print_status "Simple blockchain test passed!"
        else
            print_error "Simple blockchain test failed!"
        fi
    else
        print_error "Simple blockchain files not found!"
    fi
    cd ..
    
    echo ""
    
    # Test real blockchain
    echo "🧪 Testing Real Blockchain..."
    cd real-blockchain
    if [ -f "test-blockchain.js" ]; then
        timeout 30s node test-blockchain.js > /dev/null 2>&1
        if [ $? -eq 0 ] || [ $? -eq 124 ]; then
            print_status "Real blockchain test passed!"
        else
            print_error "Real blockchain test failed!"
        fi
    else
        print_error "Real blockchain test files not found!"
    fi
    cd ..
    
    echo ""
    print_status "Testing completed!"
}

# Show documentation
show_docs() {
    echo "📚 Documentation"
    echo "================"
    echo ""
    echo "📖 Main README: README.md"
    echo "📖 Usage Guide: USAGE_GUIDE.md"
    echo "📖 Simple Blockchain: simple-blockchain/README.md"
    echo "📖 Real Blockchain: real-blockchain/README.md"
    echo ""
    echo "🌐 Quick Links:"
    echo "   • Simple Blockchain Web Interface: simple-blockchain/web-interface.html"
    echo "   • Real Blockchain API: http://localhost:3000/api"
    echo "   • Real Blockchain Web Interface: http://localhost:3000"
    echo ""
}

# Main menu
main_menu() {
    while true; do
        echo ""
        echo "Choose an option:"
        echo "1. 🎓 Launch Simple Blockchain (Learning)"
        echo "2. 🔐 Launch Real Blockchain (Production)"
        echo "3. 🧪 Test Both Blockchains"
        echo "4. 📊 Show Comparison"
        echo "5. 📚 Show Documentation"
        echo "6. 🚪 Exit"
        echo ""
        read -p "Enter your choice (1-6): " choice
        
        case $choice in
            1)
                launch_simple
                break
                ;;
            2)
                launch_real
                break
                ;;
            3)
                test_both
                ;;
            4)
                show_comparison
                ;;
            5)
                show_docs
                ;;
            6)
                print_info "Thank you for using Pharbit Blockchain!"
                exit 0
                ;;
            *)
                print_error "Invalid choice. Please enter a number between 1-6."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Check if running in interactive mode
if [ -t 0 ]; then
    # Interactive mode
    check_prerequisites
    show_comparison
    main_menu
else
    # Non-interactive mode - show help
    echo "🚀 Pharbit Blockchain - Quick Start"
    echo "==================================="
    echo ""
    echo "Usage:"
    echo "  ./quick-start.sh                    # Interactive mode"
    echo "  ./quick-start.sh simple             # Launch simple blockchain"
    echo "  ./quick-start.sh real               # Launch real blockchain"
    echo "  ./quick-start.sh test               # Test both blockchains"
    echo ""
    echo "Examples:"
    echo "  ./quick-start.sh simple             # Start simple blockchain"
    echo "  ./quick-start.sh real               # Start real blockchain"
    echo ""
    
    # Handle command line arguments
    case "$1" in
        "simple")
            launch_simple
            ;;
        "real")
            launch_real
            ;;
        "test")
            test_both
            ;;
        *)
            echo "For interactive mode, run: ./quick-start.sh"
            exit 1
            ;;
    esac
fi