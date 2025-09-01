#!/bin/bash

echo "🐳 Installing Docker in GitHub Codespaces"
echo "========================================="
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

# Check if we're in Codespaces
if [ -n "$CODESPACES" ]; then
    print_info "Detected GitHub Codespaces environment"
else
    print_warning "Not in Codespaces environment, but continuing..."
fi

# Function to install Docker
install_docker() {
    print_info "Installing Docker..."
    
    # Update package list
    sudo apt-get update
    
    # Install prerequisites
    sudo apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Set up the stable repository
    echo \
      "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package list again
    sudo apt-get update
    
    # Install Docker Engine
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    
    print_status "Docker Engine installed successfully!"
}

# Function to install Docker Compose
install_docker_compose() {
    print_info "Installing Docker Compose..."
    
    # Download Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # Make it executable
    sudo chmod +x /usr/local/bin/docker-compose
    
    print_status "Docker Compose installed successfully!"
}

# Function to start Docker service
start_docker() {
    print_info "Starting Docker service..."
    
    # Try different methods to start Docker
    if command -v systemctl &> /dev/null; then
        sudo systemctl start docker
        sudo systemctl enable docker
    else
        # For containerized environments like Codespaces
        sudo dockerd --host=unix:///var/run/docker.sock --host=tcp://0.0.0.0:2376 &
        sleep 5
    fi
    
    print_status "Docker service started!"
}

# Function to configure Docker for Codespaces
configure_docker() {
    print_info "Configuring Docker for Codespaces..."
    
    # Create docker group if it doesn't exist
    sudo groupadd -f docker
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    # Set proper permissions
    sudo chmod 666 /var/run/docker.sock
    
    print_status "Docker configured for Codespaces!"
}

# Function to verify installation
verify_installation() {
    print_info "Verifying Docker installation..."
    
    # Check Docker version
    if docker --version; then
        print_status "Docker is installed and working!"
    else
        print_error "Docker installation failed!"
        return 1
    fi
    
    # Check Docker Compose version
    if docker-compose --version; then
        print_status "Docker Compose is installed and working!"
    else
        print_error "Docker Compose installation failed!"
        return 1
    fi
    
    # Test Docker with hello-world
    print_info "Testing Docker with hello-world container..."
    if docker run --rm hello-world; then
        print_status "Docker test successful!"
    else
        print_warning "Docker test failed, but installation might still work"
    fi
}

# Main installation process
main() {
    echo "🚀 Starting Docker installation..."
    echo ""
    
    # Check if Docker is already installed
    if command -v docker &> /dev/null; then
        print_info "Docker is already installed!"
        docker --version
    else
        install_docker
    fi
    
    # Check if Docker Compose is already installed
    if command -v docker-compose &> /dev/null; then
        print_info "Docker Compose is already installed!"
        docker-compose --version
    else
        install_docker_compose
    fi
    
    # Start Docker service
    start_docker
    
    # Configure Docker
    configure_docker
    
    # Verify installation
    verify_installation
    
    echo ""
    print_status "🎉 Docker installation completed!"
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
}

# Run the main function
main