#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting PharbitChain...${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the pharbit-blockchain directory${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Create necessary directories
echo -e "${YELLOW}📁 Creating necessary directories...${NC}"
mkdir -p logs blockchain-data uploads
echo -e "${GREEN}✅ Directories created${NC}"

# Check if blockchain is already running
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Blockchain is already running on port 3000${NC}"
    echo -e "${BLUE}📊 Health check: http://localhost:3000/api/health${NC}"
    echo -e "${BLUE}📋 API docs: http://localhost:3000/api/docs${NC}"
    echo -e "${BLUE}🔗 Blockchain status: http://localhost:3000/api/blockchain/status${NC}"
    echo ""
    echo -e "${GREEN}🎉 Your blockchain is already running!${NC}"
    exit 0
fi

# Start the blockchain
echo -e "${GREEN}🎉 Starting PharbitChain...${NC}"
echo -e "${BLUE}📋 Your blockchain will use these services:${NC}"
echo -e "   AWS S3: pharbit-blockchain (eu-north-1)"
echo -e "   Supabase: PostgreSQL with real-time features"
echo -e "   Blockchain: Pharmaceutical compliance ready"
echo ""

# Start with the simple version
echo -e "${YELLOW}🔄 Starting blockchain server...${NC}"
node simple-start.js