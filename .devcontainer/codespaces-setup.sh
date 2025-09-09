#!/bin/bash

echo "🚀 Setting up Pharbit Blockchain in GitHub Codespaces..."

sudo apt-get update -y

echo "📦 Installing blockchain development tools..."
npm install -g \
    hardhat \
    truffle \
    ganache-cli \
    @truffle/hdwallet-provider \
    web3 \
    ethers \
    solc \
    prettier \
    eslint

echo "📦 Installing project dependencies..."

if [ -d "real-blockchain" ]; then
    echo "🔗 Setting up real-blockchain..."
    cd real-blockchain
    npm install
    cd ..
fi

if [ -d "pharbit-contracts" ]; then
    echo "📜 Setting up pharbit-contracts..."
    cd pharbit-contracts
    npm install
    
    if [ ! -f "hardhat.config.js" ] && [ ! -f "hardhat.config.ts" ]; then
        echo "⚡ Initializing Hardhat..."
        npx hardhat init --yes
    fi
    cd ..
fi

echo "🔧 Configuring Git..."
git config --global init.defaultBranch main
git config --global pull.rebase false

echo "⚡ Setting up Codespaces aliases..."
cat >> ~/.bashrc << 'EOL'

# Pharbit Blockchain Aliases for Codespaces
alias pharbit-start='./fullstack-launch.sh start'
alias pharbit-stop='./fullstack-launch.sh stop'
alias pharbit-status='./fullstack-launch.sh status'
alias blockchain-test='cd real-blockchain && npm test'
alias contracts-test='cd pharbit-contracts && npx hardhat test'
alias contracts-compile='cd pharbit-contracts && npx hardhat compile'
alias ganache='ganache-cli --deterministic --accounts 10 --host 0.0.0.0'
alias hardhat-node='npx hardhat node --hostname 0.0.0.0'

alias ll='ls -alF'
alias ..='cd ..'
alias gs='git status'
alias ga='git add'
alias gc='git commit'
alias gp='git push'
EOL

echo "📝 Creating Codespaces helper files..."

cat > pharbit-codespaces-status.sh << 'EOL'
#!/bin/bash
echo "🌟 Pharbit Blockchain - GitHub Codespaces Status"
echo "==============================================="
echo "📍 Environment: GitHub Codespaces"
echo "🖥️  Machine: $(uname -a)"
echo "🌐 Codespace: $CODESPACE_NAME"
echo ""
echo "📊 Development Stack:"
echo "  Node.js: $(node --version)"
echo "  NPM: $(npm --version)"
echo "  Hardhat: $(npx hardhat --version 2>/dev/null || echo 'Not found')"
echo ""
echo "🔑 Environment Variables:"
env | grep -E "(ALCHEMY|INFURA|PHARBIT)" | cut -d= -f1 | sed 's/^/  ✅ /'
echo ""
echo "🌐 Forwarded Ports:"
echo "  3000 - Blockchain API"
echo "  3001 - Frontend Development"  
echo "  8545 - Ethereum RPC"
echo ""
echo "🚀 Quick Start Commands:"
echo "  pharbit-start           - Start blockchain system"
echo "  blockchain-test         - Test blockchain"
echo "  contracts-compile       - Compile smart contracts"
echo "  ganache                 - Start local Ethereum"
EOL

chmod +x pharbit-codespaces-status.sh

source ~/.bashrc

echo ""
echo "✅ GitHub Codespaces setup complete!"
echo "🎯 Run './pharbit-codespaces-status.sh' to verify setup"
echo "🚀 Start coding with 'pharbit-start'"
echo ""
