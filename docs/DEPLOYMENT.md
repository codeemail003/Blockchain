# PharbitChain Deployment Guide

## 🚀 Deployment Overview

This guide covers deploying PharbitChain to various environments, from local development to production mainnet.

## 📋 Prerequisites

### Required Tools
- Node.js 18+
- npm 8+
- Git
- MetaMask wallet
- Hardhat CLI

### Required Accounts
- Ethereum wallet with testnet/mainnet ETH
- AWS account (for S3 integration)
- Supabase account (for database)
- Etherscan account (for contract verification)

## 🔧 Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/Maitreyapharbit/Blockchain.git
cd pharbit-blockchain
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Environment Configuration

#### Backend Environment (.env)
```env
# AWS Configuration
AWS_REGION=eu-north-1
AWS_S3_BUCKET=pharbit-blockchain
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_url

# Application Configuration
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Blockchain Configuration
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=your_sepolia_rpc_url
MAINNET_RPC_URL=your_mainnet_rpc_url
ETHERSCAN_API_KEY=your_etherscan_key
```

#### Frontend Environment (.env.local)
```env
REACT_APP_NETWORK_ID=1337
REACT_APP_CHAIN_ID=0x539
REACT_APP_PHARBIT_CORE_ADDRESS=0x...
REACT_APP_COMPLIANCE_MANAGER_ADDRESS=0x...
REACT_APP_BATCH_NFT_ADDRESS=0x...
REACT_APP_PHARBIT_DEPLOYER_ADDRESS=0x...
REACT_APP_RPC_URL=http://localhost:8545
REACT_APP_BLOCK_EXPLORER_URL=
```

## 🏠 Local Development Deployment

### 1. Start Local Blockchain
```bash
# Terminal 1: Start Hardhat node
npx hardhat node
```

### 2. Deploy Contracts
```bash
# Terminal 2: Deploy contracts
npm run deploy:local
```

### 3. Start Backend
```bash
# Terminal 3: Start backend server
npm start
```

### 4. Start Frontend
```bash
# Terminal 4: Start frontend
npm run frontend
```

### 5. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3000/api
- Hardhat Console: http://localhost:8545

## 🧪 Sepolia Testnet Deployment

### 1. Get Sepolia ETH
- Visit [Sepolia Faucet](https://sepoliafaucet.com/)
- Request testnet ETH for your wallet

### 2. Configure Environment
```bash
export PRIVATE_KEY="your_private_key"
export SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
export ETHERSCAN_API_KEY="your_etherscan_key"
```

### 3. Deploy Contracts
```bash
npm run deploy:sepolia
```

### 4. Verify Contracts
```bash
npm run verify:sepolia
```

### 5. Update Frontend
```bash
# Copy contract addresses to frontend .env
cp .env.sepolia frontend/.env.local
```

### 6. Test on Sepolia
- Connect MetaMask to Sepolia testnet
- Import test accounts
- Test all functionality

## 🌐 Mainnet Deployment

### 1. Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Testnet deployment successful
- [ ] Sufficient ETH for gas fees
- [ ] Backup private keys
- [ ] Emergency procedures documented

### 2. Configure Environment
```bash
export PRIVATE_KEY="your_private_key"
export MAINNET_RPC_URL="https://mainnet.infura.io/v3/YOUR_INFURA_KEY"
export ETHERSCAN_API_KEY="your_etherscan_key"
```

### 3. Deploy Contracts
```bash
npm run deploy:mainnet
```

### 4. Verify Contracts
```bash
npm run verify:mainnet
```

### 5. Update Frontend
```bash
# Copy contract addresses to frontend .env
cp .env.mainnet frontend/.env.local
```

### 6. Production Testing
- Test all functionality on mainnet
- Verify contract interactions
- Monitor gas usage
- Check transaction confirmations

## 🐳 Docker Deployment

### 1. Build Docker Images
```bash
# Build backend image
docker build -t pharbit-backend .

# Build frontend image
docker build -t pharbit-frontend ./frontend
```

### 2. Run with Docker Compose
```bash
# Create docker-compose.yml
version: '3.8'
services:
  backend:
    image: pharbit-backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - ./logs:/app/logs

  frontend:
    image: pharbit-frontend
    ports:
      - "80:80"
    depends_on:
      - backend

# Start services
docker-compose up -d
```

## ☁️ Cloud Deployment

### AWS Deployment

#### 1. EC2 Instance Setup
```bash
# Launch EC2 instance
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Clone repository
git clone https://github.com/Maitreyapharbit/Blockchain.git
cd pharbit-blockchain
npm install
```

#### 2. Configure PM2
```bash
# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 3. Configure Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Vercel Deployment (Frontend)

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Deploy Frontend
```bash
cd frontend
vercel --prod
```

### Railway Deployment (Backend)

#### 1. Connect Repository
- Connect GitHub repository to Railway
- Set environment variables
- Deploy automatically

## 🔐 Security Considerations

### 1. Private Key Management
- Use hardware wallets for production
- Implement multi-sig for admin functions
- Store keys in secure key management systems
- Never commit private keys to version control

### 2. Access Control
- Implement proper role-based access control
- Use strong authentication mechanisms
- Regular access reviews
- Monitor for unauthorized access

### 3. Smart Contract Security
- Regular security audits
- Use established libraries (OpenZeppelin)
- Implement emergency pause functionality
- Monitor for suspicious activity

### 4. Infrastructure Security
- Use HTTPS everywhere
- Implement proper firewall rules
- Regular security updates
- Monitor system logs

## 📊 Monitoring and Maintenance

### 1. Application Monitoring
```bash
# Install monitoring tools
npm install -g pm2-logrotate

# Configure log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### 2. Blockchain Monitoring
- Monitor transaction confirmations
- Track gas usage
- Monitor contract events
- Set up alerts for failures

### 3. Database Monitoring
- Monitor database performance
- Set up backup procedures
- Monitor disk usage
- Track query performance

### 4. Backup Procedures
```bash
# Database backup
pg_dump pharbit_db > backup_$(date +%Y%m%d).sql

# Contract state backup
# Export contract state and events
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Contract Deployment Fails
```bash
# Check gas limit
# Increase gas price
# Verify network connection
# Check account balance
```

#### 2. Frontend Connection Issues
```bash
# Check MetaMask connection
# Verify network configuration
# Check contract addresses
# Clear browser cache
```

#### 3. API Connection Issues
```bash
# Check backend server status
# Verify environment variables
# Check database connection
# Review server logs
```

### Debug Commands
```bash
# Check contract deployment
npx hardhat verify --list --network sepolia

# Check transaction status
npx hardhat run scripts/check-tx.js --network sepolia

# Check contract state
npx hardhat run scripts/check-state.js --network sepolia
```

## 📈 Performance Optimization

### 1. Gas Optimization
- Use efficient data structures
- Minimize external calls
- Batch operations when possible
- Optimize storage patterns

### 2. Frontend Optimization
- Implement code splitting
- Use lazy loading
- Optimize images
- Implement caching

### 3. Backend Optimization
- Database indexing
- Connection pooling
- Caching strategies
- Load balancing

## 🔄 Update Procedures

### 1. Smart Contract Updates
- Deploy new contracts
- Migrate data if needed
- Update frontend addresses
- Test thoroughly

### 2. Application Updates
- Deploy new version
- Run database migrations
- Update environment variables
- Test functionality

### 3. Rollback Procedures
- Keep previous versions
- Database rollback scripts
- Contract rollback procedures
- Emergency contacts

## 📋 Post-Deployment Checklist

### 1. Functionality Testing
- [ ] All features working
- [ ] MetaMask integration
- [ ] Contract interactions
- [ ] API endpoints
- [ ] Database operations

### 2. Security Testing
- [ ] Access controls
- [ ] Input validation
- [ ] Authentication
- [ ] Authorization
- [ ] Data encryption

### 3. Performance Testing
- [ ] Load testing
- [ ] Stress testing
- [ ] Gas usage optimization
- [ ] Response times
- [ ] Throughput

### 4. Compliance Testing
- [ ] Audit trail functionality
- [ ] Data integrity
- [ ] Regulatory compliance
- [ ] Documentation
- [ ] Reporting

## 📞 Support and Maintenance

### 1. Monitoring Setup
- Application performance monitoring
- Error tracking
- Uptime monitoring
- Security monitoring

### 2. Backup Procedures
- Regular database backups
- Contract state backups
- Configuration backups
- Disaster recovery plan

### 3. Update Schedule
- Regular security updates
- Feature updates
- Bug fixes
- Performance improvements

### 4. Support Contacts
- Technical support team
- Emergency contacts
- Escalation procedures
- Documentation updates

This deployment guide provides comprehensive instructions for deploying PharbitChain across different environments while maintaining security, performance, and compliance standards.