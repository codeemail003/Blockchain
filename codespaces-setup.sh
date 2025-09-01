#!/bin/bash

echo "🚀 Setting up Pharbit Blockchain in GitHub Codespaces"
echo "====================================================="
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

# Check if we're in Codespaces
if [ -n "$CODESPACES" ]; then
    print_info "Detected GitHub Codespaces environment"
else
    print_warning "Not in Codespaces environment, but continuing..."
fi

# Install Docker if not already installed
if ! command -v docker &> /dev/null; then
    print_info "Installing Docker..."
    apt-get update
    apt-get install -y docker.io docker-compose
    
    # Start Docker service
    service docker start
    
    print_status "Docker installed successfully!"
else
    print_status "Docker already installed"
fi

# Install Node.js if not already installed
if ! command -v node &> /dev/null; then
    print_info "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    print_status "Node.js installed successfully!"
else
    print_status "Node.js already installed"
fi

# Install Go if not already installed
if ! command -v go &> /dev/null; then
    print_info "Installing Go..."
    apt-get install -y golang-go
    
    print_status "Go installed successfully!"
else
    print_status "Go already installed"
fi

# Verify installations
echo ""
print_info "Verifying installations..."

docker --version
docker-compose --version
node --version
npm --version
go version

echo ""
print_status "Setup completed successfully!"
echo ""
echo "🚀 Next Steps:"
echo "1. Navigate to your blockchain directory:"
echo "   cd pharbit-blockchain"
echo ""
echo "2. Run the complete blockchain setup:"
echo "   ./complete-blockchain-setup.sh"
echo ""
echo "3. Or use the launcher:"
echo "   cd pharbit-fabric"
echo "   ./launch-transaction-creator.sh"
echo ""
echo "📚 Your blockchain system is ready to use!"