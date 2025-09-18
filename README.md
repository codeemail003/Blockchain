# PharbitChain - Pharmaceutical Blockchain Supply Chain Management

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Solidity Version](https://img.shields.io/badge/solidity-%5E0.8.20-blue)](https://soliditylang.org/)
[![React Version](https://img.shields.io/badge/react-18.2.0-blue)](https://reactjs.org/)

A comprehensive blockchain-based pharmaceutical supply chain management system built with Ethereum smart contracts, Node.js backend, and React frontend. PharbitChain ensures transparency, traceability, and compliance in pharmaceutical supply chains.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Node.js Backend │    │  Smart Contracts │
│                 │    │                 │    │                 │
│  - Dashboard    │◄──►│  - REST API     │◄──►│  - Batch Mgmt   │
│  - Batch Mgmt   │    │  - Auth Service │    │  - Compliance   │
│  - Compliance   │    │  - File Storage │    │  - NFT Tracking │
│  - Wallet Mgmt  │    │  - Database     │    │  - Access Control│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MetaMask      │    │   Supabase      │    │   Hardhat       │
│   Wallet        │    │   PostgreSQL    │    │   Local Node    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Features

### Smart Contracts
- **Batch Management**: Create, transfer, and track pharmaceutical batches
- **Compliance Tracking**: FDA compliance and regulatory features
- **NFT Integration**: ERC721 tokens for batch tokenization
- **Access Control**: Role-based permissions for different stakeholders
- **Emergency Pause**: Safety mechanisms for critical situations

### Backend API
- **RESTful API**: Complete CRUD operations for all entities
- **Authentication**: JWT-based authentication with role management
- **File Management**: AWS S3 integration for document storage
- **Database**: Supabase PostgreSQL with real-time features
- **Blockchain Integration**: Ethers.js for smart contract interaction

### Frontend Application
- **Modern UI**: React with TypeScript and styled-components
- **Web3 Integration**: MetaMask connection and transaction management
- **Real-time Updates**: Live transaction and batch status updates
- **Responsive Design**: Mobile and desktop optimized
- **Dashboard**: Comprehensive overview and analytics

## 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher
- **Git** for version control
- **MetaMask** browser extension
- **Docker** (optional, for containerized deployment)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/pharbitchain/pharbit-blockchain.git
cd pharbit-blockchain
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm run install:all

# Or install individually
npm install                    # Root dependencies
cd backend && npm install     # Backend dependencies
cd ../frontend && npm install # Frontend dependencies
cd ../contracts && npm install # Contract dependencies
```

### 3. Environment Configuration

```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit configuration files
nano backend/.env
nano frontend/.env
```

#### Required Environment Variables

**Backend (.env):**
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_S3_BUCKET=your_s3_bucket_name
JWT_SECRET=your_jwt_secret_key
ETHEREUM_RPC_URL=http://localhost:8545
PRIVATE_KEY=your_private_key
```

**Frontend (.env):**
```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_ETHEREUM_RPC_URL=http://localhost:8545
REACT_APP_CONTRACT_ADDRESS=0x...
```

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Start all services with one command
./scripts/start-blockchain.sh
```

This will:
- Start Hardhat local node
- Deploy smart contracts
- Start backend server
- Start frontend application
- Open browser to http://localhost:3001

### Option 2: Manual Setup

```bash
# Terminal 1: Start Hardhat node
cd contracts
npx hardhat node

# Terminal 2: Deploy contracts
cd contracts
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3: Start backend
cd backend
npm run dev

# Terminal 4: Start frontend
cd frontend
npm start
```

### Option 3: Docker Setup

```bash
# Development with hot reload
docker-compose -f docker-compose.dev.yml up

# Production deployment
docker-compose up -d
```

## 📚 Usage

### 1. Access the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/health

### 2. Connect MetaMask

1. Install MetaMask browser extension
2. Create or import a wallet
3. Add local network (http://localhost:8545, Chain ID: 31337)
4. Import test accounts from Hardhat (check terminal output)

### 3. Create Your First Batch

1. Navigate to "Batch Management"
2. Click "Create New Batch"
3. Fill in batch details (drug name, quantity, etc.)
4. Submit transaction via MetaMask
5. View batch in dashboard

### 4. Manage Compliance

1. Go to "Compliance Center"
2. Add compliance records for batches
3. Track audit history
4. Generate compliance reports

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test Suites

```bash
# Smart contracts
npm run test:contracts

# Backend API
npm run test:backend

# Frontend components
npm run test:frontend
```

### Test Coverage

```bash
# Generate coverage reports
npm run test:coverage
```

## 📖 API Documentation

### Authentication Endpoints

```http
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
POST /api/auth/logout
```

### Batch Management

```http
GET    /api/batches              # List all batches
POST   /api/batches              # Create new batch
GET    /api/batches/:id          # Get batch details
PUT    /api/batches/:id          # Update batch
DELETE /api/batches/:id          # Delete batch
POST   /api/batches/:id/transfer # Transfer ownership
```

### Compliance Management

```http
GET  /api/compliance/:batchId    # Get compliance history
POST /api/compliance/check       # Add compliance record
PUT  /api/compliance/:id         # Update compliance record
```

### File Management

```http
POST /api/files/upload           # Upload file to S3
GET  /api/files/:id              # Download file
GET  /api/files/:id/metadata     # Get file metadata
```

## 🔧 Development

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type checking (frontend)
cd frontend && npm run type-check
```

### Database Management

```bash
# Run migrations
cd backend && npm run db:migrate

# Seed database
cd backend && npm run db:seed
```

### Contract Deployment

```bash
# Deploy to local network
cd contracts && npm run deploy:local

# Deploy to Sepolia testnet
cd contracts && npm run deploy:sepolia

# Verify contracts
cd contracts && npm run verify
```

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   # Set production environment variables
   export NODE_ENV=production
   export SUPABASE_URL=your_production_url
   # ... other production variables
   ```

2. **Build Application**
   ```bash
   npm run build
   ```

3. **Deploy with Docker**
   ```bash
   docker-compose up -d
   ```

4. **Deploy to Cloud**
   - AWS EC2 with PM2
   - Google Cloud Run
   - Azure Container Instances
   - Heroku

### AWS EC2 Deployment

```bash
# Use the provided deployment script
./scripts/deploy-to-ec2.sh
```

## 📁 Project Structure

```
pharbit-blockchain/
├── contracts/                 # Smart contracts
│   ├── contracts/            # Solidity contracts
│   ├── scripts/              # Deployment scripts
│   ├── test/                 # Contract tests
│   └── hardhat.config.js     # Hardhat configuration
├── backend/                  # Node.js backend
│   ├── routes/               # API routes
│   ├── services/             # Business logic
│   ├── middleware/           # Express middleware
│   ├── config/               # Configuration
│   └── index.js              # Entry point
├── frontend/                 # React frontend
│   ├── src/                  # Source code
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   └── contexts/         # React contexts
│   └── public/               # Static assets
├── scripts/                  # Utility scripts
├── docs/                     # Documentation
├── tests/                    # Integration tests
└── docker-compose.yml        # Docker configuration
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation
- Use conventional commits
- Ensure all tests pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.pharbitchain.com](https://docs.pharbitchain.com)
- **Issues**: [GitHub Issues](https://github.com/pharbitchain/pharbit-blockchain/issues)
- **Discord**: [PharbitChain Community](https://discord.gg/pharbitchain)
- **Email**: support@pharbitchain.com

## 🙏 Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for smart contract libraries
- [Hardhat](https://hardhat.org/) for development environment
- [React](https://reactjs.org/) for frontend framework
- [Supabase](https://supabase.com/) for backend services
- [AWS](https://aws.amazon.com/) for cloud infrastructure

## 📊 Roadmap

- [ ] Multi-chain support (Polygon, BSC)
- [ ] Mobile application
- [ ] Advanced analytics dashboard
- [ ] Machine learning integration
- [ ] IoT device integration
- [ ] Regulatory compliance automation

---

**Built with ❤️ by the PharbitChain Team**