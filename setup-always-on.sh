#!/bin/bash

# ===========================================
# PHARBIT BLOCKCHAIN ALWAYS-ON SETUP
# ===========================================
# This script sets up your blockchain to always use your real credentials
# and automatically start on server boot

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Setting up PharbitChain for always-on operation with your real credentials...${NC}"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}❌ Please don't run this script as root${NC}"
    exit 1
fi

# Step 1: Setup credentials
echo -e "${YELLOW}🔐 Setting up your real credentials...${NC}"
bash scripts/auto-setup-credentials.sh

# Step 2: Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}📦 Installing PM2...${NC}"
    npm install -g pm2
    echo -e "${GREEN}✅ PM2 installed${NC}"
else
    echo -e "${GREEN}✅ PM2 already installed${NC}"
fi

# Step 3: Setup PM2 startup
echo -e "${YELLOW}🔄 Setting up PM2 startup...${NC}"
pm2 startup
echo -e "${GREEN}✅ PM2 startup configured${NC}"

# Step 4: Start the blockchain with PM2
echo -e "${YELLOW}🚀 Starting blockchain with PM2...${NC}"
pm2 start ecosystem.config.js --env production
pm2 save
echo -e "${GREEN}✅ Blockchain started and saved to PM2${NC}"

# Step 5: Setup systemd service (optional)
echo -e "${YELLOW}⚙️  Setting up systemd service...${NC}"
if [ -f "pharbit-blockchain.service" ]; then
    sudo cp pharbit-blockchain.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable pharbit-blockchain
    echo -e "${GREEN}✅ Systemd service configured${NC}"
    echo -e "${BLUE}📋 To manage with systemd:${NC}"
    echo -e "   Start: sudo systemctl start pharbit-blockchain"
    echo -e "   Stop: sudo systemctl stop pharbit-blockchain"
    echo -e "   Status: sudo systemctl status pharbit-blockchain"
    echo -e "   Logs: sudo journalctl -u pharbit-blockchain -f"
else
    echo -e "${YELLOW}⚠️  Systemd service file not found, skipping...${NC}"
fi

# Step 6: Setup monitoring
echo -e "${YELLOW}📊 Setting up monitoring...${NC}"
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
echo -e "${GREEN}✅ Monitoring configured${NC}"

# Step 7: Test the setup
echo -e "${YELLOW}🧪 Testing the setup...${NC}"
sleep 5
pm2 status
echo -e "${GREEN}✅ Setup test completed${NC}"

# Final instructions
echo ""
echo -e "${GREEN}🎉 PharbitChain is now set up for always-on operation!${NC}"
echo ""
echo -e "${BLUE}📋 Your blockchain is using these credentials:${NC}"
echo -e "   AWS Access Key: AKIATZ6TTL4RVL7FBAPL"
echo -e "   S3 Bucket: pharbit-blockchain"
echo -e "   Region: eu-north-1"
echo -e "   Supabase: wtiaimyjsxrnqezxcxpw.supabase.co"
echo ""
echo -e "${BLUE}🔧 Management Commands:${NC}"
echo -e "   Status: pm2 status"
echo -e "   Logs: pm2 logs pharbit-blockchain"
echo -e "   Monitor: pm2 monit"
echo -e "   Restart: pm2 restart pharbit-blockchain"
echo -e "   Stop: pm2 stop pharbit-blockchain"
echo -e "   Start: pm2 start pharbit-blockchain"
echo ""
echo -e "${BLUE}🌐 Access your blockchain:${NC}"
echo -e "   API: http://localhost:3000/api"
echo -e "   Health: http://localhost:3000/api/health"
echo -e "   Docs: http://localhost:3000/api/docs"
echo ""
echo -e "${GREEN}✅ Your blockchain will now automatically start on server boot!${NC}"