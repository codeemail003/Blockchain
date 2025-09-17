# PharbitChain - EVM-Compatible Pharmaceutical Blockchain

A comprehensive EVM-compatible pharmaceutical blockchain system built with Solidity smart contracts, featuring batch tracking, compliance management, NFT tokenization, and a modern React frontend.

## 🏥 Overview

PharbitChain is a production-ready pharmaceutical supply chain blockchain that ensures compliance with FDA 21 CFR Part 11 regulations, provides end-to-end batch tracking, and enables secure document management through AWS S3 integration.

## ✨ Features

### Smart Contracts
- **PharbitCore**: Main contract for pharmaceutical operations
- **ComplianceManager**: FDA compliance and regulatory features
- **BatchNFT**: NFT implementation for batch tokenization
- **PharbitDeployer**: Factory contract for one-click deployment

### Key Capabilities
- 🔐 **Role-based Access Control** (RBAC)
- 📦 **Batch Lifecycle Management**
- 🛡️ **FDA 21 CFR Part 11 Compliance**
- 🎫 **NFT Batch Tokenization**
- 🔄 **Real-time Transfer Tracking**
- 📊 **Comprehensive Audit Trails**
- 🚨 **Emergency Pause Functionality**
- 🔍 **Compliance Verification**
- 📋 **Regulatory Approval Tracking**

### Frontend Features
- 🦊 **MetaMask Integration**
- 📱 **Responsive React Interface**
- 📊 **Real-time Dashboard**
- 🔧 **Contract Deployment Tools**
- 📦 **Batch Management Interface**
- 🛡️ **Compliance Center**
- 👥 **Role Management**

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  React App  │  MetaMask  │  Web3.js  │  Ethers.js         │
├─────────────────────────────────────────────────────────────┤
│                    API Layer                                │
├─────────────────────────────────────────────────────────────┤
│  Express.js  │  REST API  │  WebSocket  │  Authentication  │
├─────────────────────────────────────────────────────────────┤
│                  Smart Contract Layer                       │
├─────────────────────────────────────────────────────────────┤
│  PharbitCore  │  ComplianceManager  │  BatchNFT  │  Deployer│
├─────────────────────────────────────────────────────────────┤
│                    Blockchain Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Ethereum  │  Polygon  │  BSC  │  Arbitrum  │  Other EVM   │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 8+
- MetaMask wallet
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Maitreyapharbit/Blockchain.git
cd pharbit-blockchain
```

2. **Install dependencies**
```bash
npm install
cd frontend
npm install
cd ..
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Compile contracts**
```bash
npm run compile
```

5. **Run tests**
```bash
npm run test:contracts
```

6. **Deploy locally**
```bash
npm run deploy:local
```

7. **Start frontend**
```bash
npm run frontend
```

## 📦 Smart Contracts

### PharbitCore.sol
Main contract handling pharmaceutical operations:
- Batch creation and management
- Transfer tracking
- Status updates
- Emergency controls
- Role-based access

### ComplianceManager.sol
FDA compliance and regulatory features:
- Compliance record management
- Regulatory approval tracking
- Audit trail management
- Compliance standards
- Inspector role management

### BatchNFT.sol
NFT implementation for batch tokenization:
- ERC721 standard compliance
- Metadata management
- Transfer history
- Custom attributes
- Compliance certificates

### PharbitDeployer.sol
Factory contract for deployment:
- One-click deployment
- Role setup
- Address management
- Configuration management

## 🧪 Testing

### Run All Tests
```bash
npm run test:contracts
```

### Run Specific Test Suites
```bash
# Unit tests
npx hardhat test test/PharbitCore.test.js
npx hardhat test test/ComplianceManager.test.js
npx hardhat test test/BatchNFT.test.js
npx hardhat test test/PharbitDeployer.test.js

# Integration tests
npx hardhat test test/integration.test.js
```

### Test Coverage
```bash
npm run coverage
```

## 🚀 Deployment

### Local Development
```bash
# Start local blockchain
npx hardhat node

# Deploy contracts
npm run deploy:local
```

### Sepolia Testnet
```bash
# Set environment variables
export PRIVATE_KEY="your_private_key"
export SEPOLIA_RPC_URL="your_rpc_url"
export ETHERSCAN_API_KEY="your_etherscan_key"

# Deploy to Sepolia
npm run deploy:sepolia

# Verify contracts
npm run verify:sepolia
```

### Mainnet
```bash
# Set environment variables
export PRIVATE_KEY="your_private_key"
export MAINNET_RPC_URL="your_rpc_url"
export ETHERSCAN_API_KEY="your_etherscan_key"

# Deploy to Mainnet
npm run deploy:mainnet

# Verify contracts
npm run verify:mainnet
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
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
```

#### Frontend (.env.local)
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

## 📚 API Documentation

### Blockchain Endpoints

#### Connect to MetaMask
```http
POST /api/blockchain/connect
```

#### Deploy Contracts
```http
POST /api/blockchain/deploy/all
Content-Type: application/json

{
  "nftName": "PharbitBatch",
  "nftSymbol": "PBT",
  "baseTokenURI": "https://api.pharbit.com/metadata/",
  "contractURI": "https://api.pharbit.com/contract"
}
```

#### Create Batch
```http
POST /api/blockchain/batch/create
Content-Type: application/json

{
  "drugName": "Aspirin",
  "drugCode": "ASP001",
  "manufacturer": "PharmaCorp",
  "quantity": 1000,
  "productionDate": 1640995200,
  "expiryDate": 1672531200,
  "batchNumber": "BATCH001",
  "serialNumbers": "SN001,SN002,SN003"
}
```

#### Transfer Batch
```http
POST /api/blockchain/batch/transfer
Content-Type: application/json

{
  "batchId": 1,
  "to": "0x...",
  "reason": "Distribution",
  "location": "Warehouse A"
}
```

## 🔐 Security Features

### Smart Contract Security
- **OpenZeppelin Contracts**: Battle-tested security libraries
- **Access Control**: Role-based permissions
- **Reentrancy Protection**: Prevents reentrancy attacks
- **Pausable**: Emergency stop functionality
- **Input Validation**: Comprehensive parameter validation

### API Security
- **Rate Limiting**: Prevents abuse
- **Input Sanitization**: XSS and injection protection
- **CORS Configuration**: Secure cross-origin requests
- **Helmet.js**: Security headers
- **JWT Authentication**: Secure API access

### Compliance Features
- **FDA 21 CFR Part 11**: Digital signature compliance
- **Audit Trails**: Complete transaction history
- **Data Integrity**: Immutable blockchain records
- **Access Logging**: User activity tracking
- **Document Versioning**: Change tracking

## 🏥 Pharmaceutical Compliance

### FDA 21 CFR Part 11 Compliance
- Digital signatures for all transactions
- Immutable audit trails
- User authentication and authorization
- Data integrity verification
- Electronic record management

### Supply Chain Tracking
- End-to-end batch visibility
- Real-time status updates
- Transfer history tracking
- Compliance verification
- Recall management

### Quality Assurance
- Batch quality records
- Compliance certificates
- Inspection reports
- Corrective action tracking
- Regulatory approval management

## 🚀 Performance Optimization

### Gas Optimization
- Efficient storage patterns
- Batch operations
- Minimal external calls
- Optimized data structures

### Frontend Performance
- React Query for caching
- Lazy loading
- Code splitting
- Optimized re-renders

### Backend Performance
- Database indexing
- Connection pooling
- Caching strategies
- Async operations

## 📊 Monitoring & Analytics

### Blockchain Monitoring
- Transaction monitoring
- Gas usage tracking
- Contract event logging
- Error tracking

### Application Monitoring
- API performance metrics
- User activity tracking
- Error logging
- System health checks

### Compliance Reporting
- Audit trail reports
- Compliance status dashboards
- Regulatory submission data
- Quality metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Development Guidelines
- Follow Solidity style guide
- Write comprehensive tests
- Update documentation
- Follow security best practices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Join our Discord community

## 🔗 Links

- **Website**: https://pharbit.com
- **Documentation**: https://docs.pharbit.com
- **GitHub**: https://github.com/Maitreyapharbit/Blockchain
- **Discord**: https://discord.gg/pharbit

## 🙏 Acknowledgments

- OpenZeppelin for security libraries
- Hardhat for development framework
- React team for frontend framework
- Ethereum community for blockchain infrastructure

---

**Built with ❤️ for the pharmaceutical industry**