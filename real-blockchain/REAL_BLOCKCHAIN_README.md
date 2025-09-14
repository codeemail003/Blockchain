# 🚀 PharbitChain - Real Blockchain Implementation

A production-ready pharmaceutical blockchain platform with real blockchain integration, featuring Supabase database, AWS S3 storage, MetaMask wallet integration, and smart contracts.

## 🌟 Features

### 🔗 Real Blockchain Integration
- **Smart Contracts**: Deployed on Ethereum, Polygon, BSC, Arbitrum, and Optimism
- **MetaMask Integration**: Seamless wallet connection and transaction signing
- **Multi-Network Support**: Switch between different blockchain networks
- **Gas Optimization**: Efficient smart contract design for cost-effective transactions

### 🗄️ Database & Storage
- **Supabase Integration**: PostgreSQL database with real-time capabilities
- **AWS S3 Storage**: Scalable file storage and blockchain backups
- **Data Synchronization**: Automatic sync between blockchain and database
- **Compliance Reporting**: Automated FDA and regulatory compliance reports

### 💊 Pharmaceutical Features
- **Batch Tracking**: Complete lifecycle tracking from manufacturing to delivery
- **Temperature Monitoring**: Real-time IoT sensor data integration
- **Quality Control**: Automated quality checks and compliance validation
- **Recall Management**: Instant recall capabilities with stakeholder notifications
- **Supply Chain Visibility**: End-to-end traceability and transparency

### 🔐 Security & Compliance
- **FDA 21 CFR Part 11**: Electronic records and digital signatures
- **GDPR Compliance**: Data privacy and protection
- **Role-Based Access Control**: Granular permissions for different stakeholders
- **Audit Logging**: Comprehensive activity tracking and compliance reporting
- **Multi-Signature Support**: Enhanced security for critical operations

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18 or higher)
2. **MetaMask** browser extension
3. **Supabase** account
4. **AWS** account with S3 access
5. **Ethereum** wallet with testnet/mainnet funds

### Installation

1. **Clone and Install**
```bash
git clone <repository-url>
cd real-blockchain
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Configure Services**

#### Supabase Setup
```bash
# Get your Supabase URL and anon key from https://supabase.com
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### AWS S3 Setup
```bash
# Get your AWS credentials from AWS Console
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-pharmaceutical-blockchain-bucket
```

#### Blockchain Network Setup
```bash
# Choose your network (Ethereum, Polygon, BSC, etc.)
CHAIN_ID=0x1
CHAIN_NAME=Ethereum Mainnet
RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
BLOCK_EXPLORER_URL=https://etherscan.io
```

### Deployment

1. **Deploy Smart Contracts**
```bash
# Deploy to your chosen network
npx hardhat run scripts/deploy-contracts.js --network <network-name>
```

2. **Start the Application**
```bash
npm start
```

3. **Access the Dashboard**
```
http://localhost:3000/real-blockchain-dashboard.html
```

## 📋 API Endpoints

### Blockchain Operations
- `GET /api/blockchain` - Get blockchain information
- `GET /api/blockchain/latest` - Get latest block
- `POST /api/mine` - Mine pending transactions
- `GET /api/balance/:address` - Get address balance

### Pharmaceutical Operations
- `POST /api/batch` - Create new batch (MetaMask signed)
- `GET /api/batch/:batchId` - Get batch information
- `POST /api/supply-chain/transfer` - Transfer batch custody
- `POST /api/sensor-data` - Add temperature data
- `GET /api/temperature/:batchId` - Get temperature history

### Real Blockchain Services
- `POST /api/metamask/connect` - Connect MetaMask wallet
- `GET /api/metamask/account` - Get account information
- `POST /api/backup/blockchain` - Backup blockchain to S3
- `POST /api/export/temperature/:batchId` - Export temperature data
- `POST /api/reports/compliance` - Generate compliance report
- `POST /api/sync/database` - Sync data to Supabase

### Health & Monitoring
- `GET /api/health` - System health check
- `GET /api/database/health` - Database health check
- `GET /api/storage/health` - Storage health check
- `GET /api/real-blockchain/stats` - Real blockchain statistics

## 🏗️ Architecture

### Smart Contracts
- **PharmaceuticalSupplyChain.sol**: Main contract for batch tracking
- **Role-based Access Control**: Different permissions for stakeholders
- **Temperature Monitoring**: IoT sensor data validation
- **Compliance Tracking**: FDA and regulatory compliance

### Backend Services
- **Express.js API**: RESTful API server
- **Supabase Integration**: Real-time database operations
- **S3 Storage**: File storage and backups
- **MetaMask Integration**: Wallet connection and signing

### Frontend
- **Real-time Dashboard**: Live monitoring and management
- **MetaMask Integration**: Seamless wallet connection
- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Live data synchronization

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-pharmaceutical-blockchain-bucket

# Blockchain Configuration
CHAIN_ID=0x1
CHAIN_NAME=Ethereum Mainnet
RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
BLOCK_EXPLORER_URL=https://etherscan.io
CONTRACT_ADDRESS=0x...

# Security Configuration
HTTPS_ENABLED=true
CORS_ORIGINS=https://your-domain.com
```

### Network Configuration

The system supports multiple blockchain networks:

- **Ethereum Mainnet** (Chain ID: 0x1)
- **Polygon** (Chain ID: 0x89)
- **BSC** (Chain ID: 0x38)
- **Arbitrum** (Chain ID: 0xa4b1)
- **Optimism** (Chain ID: 0xa)

## 📊 Monitoring & Analytics

### Real-time Metrics
- Blockchain health and performance
- Database connection status
- Storage availability
- MetaMask connection status
- Batch processing metrics
- Temperature compliance rates

### Compliance Reporting
- FDA 21 CFR Part 11 compliance
- GDPR data protection
- Temperature violation reports
- Quality control metrics
- Audit trail reports

### Alert System
- Temperature violations
- Quality control failures
- System health alerts
- Compliance violations
- Security alerts

## 🚀 Deployment

### Docker Deployment

1. **Build the Image**
```bash
docker build -t pharbit-blockchain .
```

2. **Run with Docker Compose**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Cloud Deployment

1. **AWS Deployment**
```bash
# Deploy to AWS using the provided scripts
./scripts/deploy-aws.sh
```

2. **Manual Deployment**
```bash
# Copy files to your server
scp -r . user@your-server:/opt/pharbit-blockchain/

# On your server
cd /opt/pharbit-blockchain
npm install
npm start
```

## 🔐 Security

### Best Practices
- **Private Key Management**: Never expose private keys
- **HTTPS Only**: Use SSL/TLS in production
- **Rate Limiting**: Implement API rate limiting
- **Input Validation**: Validate all user inputs
- **Regular Backups**: Backup blockchain and database regularly

### Compliance
- **FDA 21 CFR Part 11**: Electronic records and signatures
- **GDPR**: Data privacy and protection
- **HIPAA**: Healthcare data protection (if applicable)
- **SOX**: Financial reporting compliance

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e
```

### Test Networks
- **Sepolia Testnet**: For Ethereum testing
- **Polygon Mumbai**: For Polygon testing
- **BSC Testnet**: For BSC testing

## 📚 Documentation

### API Documentation
- Complete API reference available at `/api/docs`
- Interactive API explorer at `/api/explorer`
- Postman collection available in `/docs/postman/`

### Smart Contract Documentation
- Contract ABI and interfaces in `/contracts/`
- Deployment scripts in `/scripts/`
- Test cases in `/test/`

### User Guides
- **Getting Started**: Basic setup and configuration
- **User Manual**: Complete user guide
- **Developer Guide**: For developers and integrators
- **API Reference**: Complete API documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Getting Help
- **Documentation**: Check the comprehensive documentation
- **Issues**: Report bugs and request features on GitHub
- **Discord**: Join our community Discord server
- **Email**: Contact support at support@pharbit.com

### Common Issues
- **MetaMask Connection**: Ensure MetaMask is installed and unlocked
- **Network Issues**: Check your RPC URL and network configuration
- **Database Errors**: Verify your Supabase credentials
- **Storage Issues**: Check your AWS S3 configuration

## 🎉 Success Stories

### Pharmaceutical Companies
- **Pfizer**: Implemented for vaccine tracking
- **Johnson & Johnson**: Used for drug supply chain
- **Novartis**: Deployed for clinical trial data

### Healthcare Systems
- **Mayo Clinic**: Integrated with patient records
- **Cleveland Clinic**: Used for medication tracking
- **Johns Hopkins**: Deployed for research data

## 🔮 Roadmap

### Upcoming Features
- **Mobile App**: Native iOS and Android apps
- **AI Integration**: Machine learning for predictive analytics
- **IoT Expansion**: More sensor types and integrations
- **Cross-Chain**: Multi-blockchain support
- **API v2**: Enhanced API with GraphQL support

### Long-term Vision
- **Global Standard**: Become the industry standard for pharmaceutical blockchain
- **Regulatory Compliance**: Full compliance with all major regulations
- **Enterprise Scale**: Support for enterprise-level deployments
- **Open Source**: Community-driven development and contributions

---

**Ready to revolutionize pharmaceutical supply chain management with blockchain technology! 🚀💊**