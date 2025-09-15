#!/bin/bash

# ===========================================
# PHARBIT BLOCKCHAIN STARTUP SCRIPT
# ===========================================
# This script ensures your blockchain always starts with your real credentials

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting PharbitChain with your real credentials...${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the pharbit-blockchain directory${NC}"
    exit 1
fi

# Step 1: Ensure credentials are set up
echo -e "${YELLOW}🔐 Setting up credentials...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📝 Creating .env file with your credentials...${NC}"
    bash scripts/auto-setup-credentials.sh
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Step 2: Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Step 3: Create necessary directories
echo -e "${YELLOW}📁 Creating necessary directories...${NC}"
mkdir -p logs
mkdir -p blockchain-data
mkdir -p uploads
echo -e "${GREEN}✅ Directories created${NC}"

# Step 4: Test credentials
echo -e "${YELLOW}🔍 Testing credentials...${NC}"
node -e "
const CredentialManager = require('./config/credentials');
async function test() {
    try {
        const creds = new CredentialManager();
        await creds.initialize();
        console.log('✅ Credentials test passed');
        console.log('AWS Access Key:', creds.AWS_ACCESS_KEY_ID.substring(0, 8) + '...');
        console.log('S3 Bucket:', creds.AWS_S3_BUCKET);
        console.log('Region:', creds.AWS_REGION);
    } catch (error) {
        console.error('❌ Credentials test failed:', error.message);
        process.exit(1);
    }
}
test();
"

# Step 5: Start the blockchain
echo -e "${GREEN}🎉 Starting PharbitChain...${NC}"
echo -e "${BLUE}📋 Your blockchain will use these credentials:${NC}"
echo -e "   AWS Access Key: AKIATZ6TTL4RVL7FBAPL"
echo -e "   S3 Bucket: pharbit-blockchain"
echo -e "   Region: eu-north-1"
echo -e "   Supabase: wtiaimyjsxrnqezxcxpw.supabase.co"
echo ""

# Check if PM2 is available
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}🔄 Starting with PM2...${NC}"
    pm2 start ecosystem.config.js --env production
    echo -e "${GREEN}✅ Blockchain started with PM2${NC}"
    echo -e "${BLUE}📊 Monitor with: pm2 monit${NC}"
    echo -e "${BLUE}📋 Logs: pm2 logs pharbit-blockchain${NC}"
    echo -e "${BLUE}🛑 Stop: pm2 stop pharbit-blockchain${NC}"
else
    echo -e "${YELLOW}🔄 Starting with Node.js...${NC}"
    node src/index.js
fi