# PharmaTracker - Pharmaceutical Supply Chain Blockchain

A comprehensive blockchain-based pharmaceutical supply chain tracking system built with Hardhat, Solidity, and Express.js.

## 🏥 Overview

PharmaTracker is a smart contract system that enables secure tracking of pharmaceutical drugs through the entire supply chain, from manufacturing to pharmacy distribution. It provides transparency, authenticity verification, and expiry management for pharmaceutical products.

## ✨ Features

### Smart Contract Features
- **Drug Registration**: Register pharmaceutical drugs with detailed information
- **Supply Chain Tracking**: Track drug ownership transfers through the supply chain
- **Expiry Management**: Monitor drug expiry dates and prevent expired drug transfers
- **Access Control**: Authorized manufacturer system for secure drug registration
- **Event Logging**: Comprehensive event logging for all operations
- **Transfer History**: Complete audit trail of drug ownership changes

### Backend API Features
- **RESTful API**: Complete REST API for blockchain interaction
- **Demo Mode**: Fallback demo mode when blockchain is not available
- **Real-time Data**: Live blockchain data integration
- **Error Handling**: Comprehensive error handling and validation

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Git

### Installation

1. **Clone and Setup**
```bash
cd pharbit-contracts
npm install
```

2. **Compile Contracts**
```bash
npm run compile
```

3. **Run Tests**
```bash
npm test
```

4. **Deploy Contracts**
```bash
# Deploy to Hardhat network (for testing)
npx hardhat run scripts/deploy.js --network hardhat

# Deploy to localhost (requires running node)
npm run node  # In one terminal
npm run deploy  # In another terminal
```

5. **Start Backend API**
```bash
cd backend
npm install
npm start
```

## 📁 Project Structure

```
pharbit-contracts/
├── contracts/
│   └── PharmaTracker.sol          # Main smart contract
├── scripts/
│   └── deploy.js                  # Deployment script
├── test/
│   └── PharmaTracker.test.js      # Comprehensive tests
├── backend/
│   ├── api/
│   │   └── blockchain-api.js      # Express.js API
│   ├── contracts/                 # Contract ABIs
│   └── server.js                  # Backend server
├── frontend/
│   └── src/contracts/             # Frontend contract ABIs
├── deployments/                   # Deployment addresses
├── hardhat.config.js              # Hardhat configuration
└── package.json                   # Dependencies
```

## 🔧 Smart Contract API

### Core Functions

#### Drug Registration
```solidity
function registerDrug(
    string memory _name,
    string memory _manufacturer,
    uint256 _manufactureDate,
    uint256 _expiryDate,
    string memory _batchNumber,
    uint256 _quantity,
    string memory _storageConditions
) external returns (uint256)
```

#### Drug Transfer
```solidity
function transferDrug(uint256 _drugId, address _to) external
```

#### Information Retrieval
```solidity
function getDrug(uint256 _drugId) external view returns (DrugBatch memory)
function getTransferHistory(uint256 _drugId) external view returns (address[] memory)
function isDrugExpired(uint256 _drugId) external view returns (bool)
function getDaysUntilExpiry(uint256 _drugId) external view returns (uint256)
```

#### Manufacturer Management
```solidity
function authorizeManufacturer(address _manufacturer) external
function deauthorizeManufacturer(address _manufacturer) external
function isAuthorizedManufacturer(address _address) external view returns (bool)
```

## 🌐 Backend API Endpoints

### Health & Status
- `GET /api/health` - API health check and blockchain status

### Drug Management
- `GET /api/drugs` - Get all drugs
- `GET /api/drug/:id` - Get specific drug details
- `POST /api/drugs/register` - Register new drug
- `POST /api/drugs/:id/transfer` - Transfer drug ownership
- `GET /api/drugs/owner/:address` - Get drugs by owner
- `GET /api/drugs/:id/expiry` - Check drug expiry

### Manufacturer Management
- `POST /api/manufacturers/authorize` - Authorize manufacturer
- `GET /api/manufacturers/:address/authorized` - Check authorization

### Statistics
- `GET /api/stats` - Get contract statistics

## 🧪 Testing

The project includes comprehensive tests covering:

- ✅ Contract deployment
- ✅ Manufacturer authorization
- ✅ Drug registration
- ✅ Drug transfers
- ✅ Information retrieval
- ✅ Expiry checking
- ✅ Access control
- ✅ Edge cases and error handling

Run tests with:
```bash
npm test
```

## 🔗 Network Configuration

### Localhost Development
- **URL**: `http://127.0.0.1:8545`
- **Chain ID**: `31337`
- **Accounts**: 20 test accounts with 10,000 ETH each

### Mumbai Testnet
- **URL**: Configured via `MUMBAI_RPC_URL` environment variable
- **Chain ID**: `80001`
- **Private Key**: Configured via `PRIVATE_KEY` environment variable

## 🔐 Environment Variables

Create a `.env` file in the project root:

```bash
# Mumbai Testnet
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=your_private_key_here
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# Backend
PORT=4000
```

## 📊 Demo Mode

The backend includes a demo mode that provides sample data when:
- No blockchain connection is available
- Contract is not deployed
- No signer is configured

This ensures the API remains functional for development and testing.

## 🚀 Deployment

### Local Development
```bash
# Start Hardhat node
npm run node

# Deploy contracts
npm run deploy

# Start backend
cd backend && npm start
```

### Mumbai Testnet
```bash
# Deploy to Mumbai
npm run deploy:mumbai
```

## 🔍 Usage Examples

### Register a Drug
```javascript
const response = await fetch('/api/drugs/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Aspirin',
    manufacturer: 'PharmaCorp',
    manufactureDate: Math.floor(Date.now() / 1000),
    expiryDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
    batchNumber: 'ASP2024001',
    quantity: 1000,
    storageConditions: 'Store at room temperature'
  })
});
```

### Transfer a Drug
```javascript
const response = await fetch('/api/drugs/1/transfer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
  })
});
```

## 🛠️ Development

### Adding New Features
1. Update the smart contract in `contracts/PharmaTracker.sol`
2. Add corresponding tests in `test/PharmaTracker.test.js`
3. Update the backend API in `backend/api/blockchain-api.js`
4. Deploy and test

### Code Quality
- All contracts are thoroughly tested
- Comprehensive error handling
- Gas optimization implemented
- Security best practices followed

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For questions or support, please open an issue in the repository.

---

**🎉 PharmaTracker - Secure, Transparent, Pharmaceutical Supply Chain Tracking on the Blockchain!**