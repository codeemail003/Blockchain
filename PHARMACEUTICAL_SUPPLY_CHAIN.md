# Pharmaceutical Supply Chain Management System

A complete blockchain-based solution for pharmaceutical supply chain management, compliance tracking, and batch tokenization using Solidity smart contracts and React frontend.

## 🏗️ Architecture Overview

### Smart Contracts

1. **PharmaceuticalBatch.sol** - Core batch management contract
2. **BatchNFT.sol** - ERC721 NFT contract for batch tokenization
3. **ComplianceManager.sol** - Compliance tracking and auditing system

### Frontend Components

1. **PharmaBatchManager.js** - Batch creation, transfer, and status management
2. **ComplianceManager.js** - Compliance checks and audit trail management
3. **PharmaceuticalSupplyChain.js** - Main dashboard integrating all components

## 📋 Features

### Batch Management
- ✅ Create pharmaceutical batches with metadata
- ✅ Transfer batch ownership between parties
- ✅ Update batch status throughout lifecycle
- ✅ Track batch history and transfers
- ✅ Role-based access control
- ✅ Emergency pause functionality

### NFT Tokenization
- ✅ Mint NFTs for each batch
- ✅ Link token IDs to batch IDs
- ✅ Transfer NFT ownership
- ✅ Burn NFTs when needed
- ✅ Metadata management
- ✅ Attribute tracking

### Compliance Management
- ✅ Add compliance checks for batches
- ✅ Track compliance status (PENDING, PASSED, FAILED, etc.)
- ✅ Record audit trails
- ✅ Set compliance standards
- ✅ Evidence management
- ✅ Regulatory reporting

### Security Features
- ✅ Role-based access control (RBAC)
- ✅ Emergency pause functionality
- ✅ Reentrancy protection
- ✅ Input validation
- ✅ Access control modifiers
- ✅ Secure batch transfers

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MetaMask wallet
- Hardhat development environment

### Installation

1. **Install dependencies:**
```bash
cd /workspace/pharbit-blockchain
npm install
```

2. **Start local blockchain:**
```bash
npx hardhat node
```

3. **Deploy contracts:**
```bash
npx hardhat run scripts/deploy-pharma-contracts.js --network localhost
```

4. **Start frontend:**
```bash
cd frontend
npm install
npm start
```

5. **Access the application:**
- Open http://localhost:3001
- Navigate to "Pharma Supply Chain" in the sidebar
- Connect your MetaMask wallet

## 📊 Contract Details

### PharmaceuticalBatch.sol

**Key Functions:**
- `createBatch()` - Create new pharmaceutical batch
- `transferBatch()` - Transfer batch ownership
- `updateBatchStatus()` - Update batch status
- `getBatch()` - Get batch information
- `recallBatch()` - Recall a batch

**Batch Statuses:**
- CREATED (0)
- IN_PRODUCTION (1)
- QUALITY_CHECK (2)
- PACKAGED (3)
- IN_TRANSIT (4)
- AT_DISTRIBUTOR (5)
- AT_PHARMACY (6)
- DISPENSED (7)
- RECALLED (8)
- EXPIRED (9)
- DESTROYED (10)

**Roles:**
- MANUFACTURER_ROLE
- DISTRIBUTOR_ROLE
- PHARMACY_ROLE
- REGULATOR_ROLE
- AUDITOR_ROLE

### BatchNFT.sol

**Key Functions:**
- `mintBatchNFT()` - Mint NFT for batch
- `burnBatchNFT()` - Burn NFT
- `getBatchFromToken()` - Get batch ID from token
- `getTokenFromBatch()` - Get token ID from batch
- `updateTokenMetadata()` - Update token metadata

**Features:**
- ERC721 compliance
- URI storage
- Enumerable tokens
- Metadata management
- Attribute tracking

### ComplianceManager.sol

**Key Functions:**
- `addComplianceCheck()` - Add compliance check
- `updateComplianceStatus()` - Update compliance status
- `recordAuditTrail()` - Record audit trail
- `setComplianceStandard()` - Set compliance standard
- `isBatchCompliant()` - Check batch compliance

**Check Types:**
- QUALITY_CONTROL (0)
- REGULATORY_COMPLIANCE (1)
- SAFETY_INSPECTION (2)
- DOCUMENTATION_REVIEW (3)
- STORAGE_CONDITIONS (4)
- TRANSPORT_COMPLIANCE (5)
- MANUFACTURING_STANDARDS (6)
- PACKAGING_INTEGRITY (7)

**Compliance Statuses:**
- PENDING (0)
- PASSED (1)
- FAILED (2)
- REQUIRES_ATTENTION (3)
- UNDER_REVIEW (4)

## 🧪 Testing

### Run Tests
```bash
npx hardhat test test/pharma-contracts.test.js
```

### Test Coverage
- ✅ Batch creation and management
- ✅ Batch transfers and ownership
- ✅ Status updates and transitions
- ✅ NFT minting and burning
- ✅ Compliance checks and audits
- ✅ Role-based access control
- ✅ Error handling and edge cases
- ✅ Integration workflows

## 📱 Frontend Usage

### Batch Management
1. **Create Batch:**
   - Click "Create Batch" button
   - Fill in drug information
   - Set manufacture and expiry dates
   - Add metadata and serial numbers

2. **Transfer Batch:**
   - Click "Transfer" on any batch card
   - Enter recipient address
   - Add reason and location
   - Include transfer notes

3. **Update Status:**
   - Click "Update Status" on any batch card
   - Select new status from dropdown
   - Add reason for status change

### Compliance Management
1. **Add Compliance Check:**
   - Click "Add Compliance Check" button
   - Select batch ID and check type
   - Add findings and corrective actions
   - Include evidence hashes

2. **Update Compliance Status:**
   - Click "Update Status" on compliance record
   - Select new status and mark as passed/failed
   - Add updated notes

3. **Record Audit Trail:**
   - Use audit trail functionality
   - Record detailed audit findings
   - Add recommendations and evidence

### NFT Management
1. **Mint Batch NFT:**
   - Navigate to batch management
   - Click "Mint NFT" for any batch
   - Set token URI and metadata
   - Add custom attributes

2. **Transfer NFT:**
   - Use standard ERC721 transfer functions
   - Transfer ownership to other addresses
   - Track NFT ownership changes

## 🔧 Configuration

### Environment Variables
```env
# Hardhat Network
HARDHAT_NETWORK=localhost
RPC_URL=http://localhost:8545

# Contract Addresses (auto-populated after deployment)
PHARMACEUTICAL_BATCH_ADDRESS=0x...
BATCH_NFT_ADDRESS=0x...
COMPLIANCE_MANAGER_ADDRESS=0x...
```

### Deployment Configuration
The deployment script automatically:
- Deploys all three contracts
- Sets up roles and permissions
- Creates sample data for testing
- Saves deployment information to JSON

## 📈 Monitoring & Analytics

### Dashboard Features
- Total batches count
- Compliance checks count
- Audit trails count
- NFT tokens count
- Real-time status updates

### Event Tracking
All major operations emit events for frontend integration:
- BatchCreated
- BatchTransferred
- BatchStatusUpdated
- BatchNFTMinted
- ComplianceRecordCreated
- AuditTrailRecorded

## 🛡️ Security Considerations

### Smart Contract Security
- ✅ Access control on all functions
- ✅ Reentrancy protection
- ✅ Input validation
- ✅ Emergency pause functionality
- ✅ Role-based permissions

### Frontend Security
- ✅ MetaMask integration
- ✅ Input sanitization
- ✅ Error handling
- ✅ Transaction confirmation
- ✅ User feedback

## 🚀 Deployment

### Local Development
```bash
# Start local node
npx hardhat node

# Deploy contracts
npx hardhat run scripts/deploy-pharma-contracts.js --network localhost

# Start frontend
cd frontend && npm start
```

### Testnet Deployment
```bash
# Deploy to Sepolia
npx hardhat run scripts/deploy-pharma-contracts.js --network sepolia

# Verify contracts
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Mainnet Deployment
```bash
# Deploy to mainnet
npx hardhat run scripts/deploy-pharma-contracts.js --network mainnet

# Verify contracts
npx hardhat verify --network mainnet <CONTRACT_ADDRESS>
```

## 📚 API Reference

### PharmaceuticalBatch Contract
```solidity
// Create a new batch
function createBatch(
    string memory drugName,
    string memory drugCode,
    string memory manufacturer,
    uint256 manufactureDate,
    uint256 expiryDate,
    uint256 quantity,
    string memory serialNumbers,
    string[] memory metadataKeys,
    string[] memory metadataValues
) external returns (uint256);

// Transfer batch ownership
function transferBatch(
    uint256 batchId,
    address to,
    string memory reason,
    string memory location,
    string memory notes
) external;

// Update batch status
function updateBatchStatus(
    uint256 batchId,
    BatchStatus newStatus,
    string memory reason
) external;
```

### BatchNFT Contract
```solidity
// Mint NFT for batch
function mintBatchNFT(
    address to,
    uint256 batchId,
    string memory tokenURI,
    string memory metadata,
    string[] memory attributesKeys,
    string[] memory attributesValues
) external;

// Get batch from token
function getBatchFromToken(uint256 tokenId) external view returns (uint256);

// Get token from batch
function getTokenFromBatch(uint256 batchId) external view returns (uint256);
```

### ComplianceManager Contract
```solidity
// Add compliance check
function addComplianceCheck(
    uint256 batchId,
    CheckType checkType,
    string memory notes,
    string memory findings,
    string memory correctiveActions,
    string[] memory evidenceHashes,
    string[] memory additionalDataKeys,
    string[] memory additionalDataValues
) external;

// Update compliance status
function updateComplianceStatus(
    uint256 recordId,
    ComplianceStatus newStatus,
    bool passed,
    string memory updatedNotes
) external;
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the test cases for examples

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - Pharmaceutical batch management
  - NFT tokenization
  - Compliance tracking
  - React frontend integration
  - Comprehensive testing suite

---

**Built with ❤️ for pharmaceutical supply chain transparency and compliance**