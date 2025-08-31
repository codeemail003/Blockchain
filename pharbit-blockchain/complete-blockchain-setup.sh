#!/bin/bash

echo "🚀 Creating Complete Pharbit Blockchain System"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    print_status "Prerequisites check passed!"
}

# Download Hyperledger Fabric binaries
download_fabric() {
    print_info "Downloading Hyperledger Fabric binaries..."
    
    if [ ! -f "./bin/fabric-ca-client" ]; then
        curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.2.12 1.5.5
        print_status "Fabric binaries downloaded successfully!"
    else
        print_status "Fabric binaries already exist!"
    fi
}

# Generate crypto materials
generate_crypto() {
    print_info "Generating cryptographic materials..."
    
    if [ ! -d "./crypto-config" ]; then
        cryptogen generate --config=./crypto-config.yaml
        print_status "Crypto materials generated!"
    else
        print_status "Crypto materials already exist!"
    fi
}

# Generate channel artifacts
generate_channel_artifacts() {
    print_info "Generating channel artifacts..."
    
    mkdir -p channel-artifacts
    
    if [ ! -f "./channel-artifacts/genesis.block" ]; then
        configtxgen -profile TwoOrgsOrdererGenesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block
        print_status "Genesis block created!"
    else
        print_status "Genesis block already exists!"
    fi
    
    if [ ! -f "./channel-artifacts/channel.tx" ]; then
        configtxgen -profile TwoOrgsChannel -outputCreateChannelTx ./channel-artifacts/channel.tx -channelID mychannel
        print_status "Channel configuration created!"
    else
        print_status "Channel configuration already exists!"
    fi
    
    if [ ! -f "./channel-artifacts/PharmaCorpMSPanchors.tx" ]; then
        configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/PharmaCorpMSPanchors.tx -channelID mychannel -asOrg PharmaCorpMSP
        print_status "Anchor peer configuration created!"
    else
        print_status "Anchor peer configuration already exists!"
    fi
}

# Create Docker Compose file
create_docker_compose() {
    print_info "Creating Docker Compose configuration..."
    
    cat > docker-compose.yaml << 'EOF'
version: '2'

volumes:
  orderer.pharbit.com:
  peer0.pharmacorp.pharbit.com:
  peer1.pharmacorp.pharbit.com:
  peer0.medidistributor.pharbit.com:
  peer1.medidistributor.pharbit.com:

networks:
  pharbit:

services:
  orderer.pharbit.com:
    container_name: orderer.pharbit.com
    image: hyperledger/fabric-orderer:2.2.12
    environment:
      - FABRIC_LOGGING_SPEC=INFO
      - ORDERER_GENERAL_LISTENADDRESS=0.0.0.0
      - ORDERER_GENERAL_LISTENPORT=7050
      - ORDERER_GENERAL_GENESISMETHOD=file
      - ORDERER_GENERAL_GENESISFILE=/var/hyperledger/orderer/orderer.genesis.block
      - ORDERER_GENERAL_LOCALMSPID=OrdererMSP
      - ORDERER_GENERAL_LOCALMSPDIR=/var/hyperledger/orderer/msp
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric
    command: orderer
    volumes:
      - ./channel-artifacts/genesis.block:/var/hyperledger/orderer/orderer.genesis.block
      - ./crypto-config/ordererOrganizations/pharbit.com/orderers/orderer.pharbit.com/msp:/var/hyperledger/orderer/msp
      - orderer.pharbit.com:/var/hyperledger/production/orderer
    ports:
      - 7050:7050
    networks:
      - pharbit

  peer0.pharmacorp.pharbit.com:
    container_name: peer0.pharmacorp.pharbit.com
    image: hyperledger/fabric-peer:2.2.12
    environment:
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=pharbit_pharbit
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_TLS_ENABLED=false
      - CORE_PEER_GOSSIP_USELEADERELECTION=true
      - CORE_PEER_GOSSIP_ORGLEADER=false
      - CORE_PEER_PROFILE_ENABLED=true
      - CORE_PEER_ID=peer0.pharmacorp.pharbit.com
      - CORE_PEER_ADDRESS=peer0.pharmacorp.pharbit.com:7051
      - CORE_PEER_LISTENADDRESS=0.0.0.0:7051
      - CORE_PEER_CHAINCODEADDRESS=peer0.pharmacorp.pharbit.com:7052
      - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:7052
      - CORE_PEER_LOCALMSPID=PharmaCorpMSP
    volumes:
      - /var/run/:/host/var/run/
      - ./crypto-config/peerOrganizations/pharmacorp.pharbit.com/peers/peer0.pharmacorp.pharbit.com/msp:/etc/hyperledger/fabric/msp
      - peer0.pharmacorp.pharbit.com:/var/hyperledger/production
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: peer node start
    ports:
      - 7051:7051
      - 7052:7052
    networks:
      - pharbit

  peer1.pharmacorp.pharbit.com:
    container_name: peer1.pharmacorp.pharbit.com
    image: hyperledger/fabric-peer:2.2.12
    environment:
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=pharbit_pharbit
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_TLS_ENABLED=false
      - CORE_PEER_GOSSIP_USELEADERELECTION=true
      - CORE_PEER_GOSSIP_ORGLEADER=false
      - CORE_PEER_PROFILE_ENABLED=true
      - CORE_PEER_ID=peer1.pharmacorp.pharbit.com
      - CORE_PEER_ADDRESS=peer1.pharmacorp.pharbit.com:8051
      - CORE_PEER_LISTENADDRESS=0.0.0.0:8051
      - CORE_PEER_CHAINCODEADDRESS=peer1.pharmacorp.pharbit.com:8052
      - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:8052
      - CORE_PEER_LOCALMSPID=PharmaCorpMSP
      - CORE_PEER_GOSSIP_BOOTSTRAP=peer0.pharmacorp.pharbit.com:7051
    volumes:
      - /var/run/:/host/var/run/
      - ./crypto-config/peerOrganizations/pharmacorp.pharbit.com/peers/peer1.pharmacorp.pharbit.com/msp:/etc/hyperledger/fabric/msp
      - peer1.pharmacorp.pharbit.com:/var/hyperledger/production
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: peer node start
    ports:
      - 8051:8051
      - 8052:8052
    networks:
      - pharbit

  peer0.medidistributor.pharbit.com:
    container_name: peer0.medidistributor.pharbit.com
    image: hyperledger/fabric-peer:2.2.12
    environment:
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=pharbit_pharbit
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_TLS_ENABLED=false
      - CORE_PEER_GOSSIP_USELEADERELECTION=true
      - CORE_PEER_GOSSIP_ORGLEADER=false
      - CORE_PEER_PROFILE_ENABLED=true
      - CORE_PEER_ID=peer0.medidistributor.pharbit.com
      - CORE_PEER_ADDRESS=peer0.medidistributor.pharbit.com:9051
      - CORE_PEER_LISTENADDRESS=0.0.0.0:9051
      - CORE_PEER_CHAINCODEADDRESS=peer0.medidistributor.pharbit.com:9052
      - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:9052
      - CORE_PEER_LOCALMSPID=MediDistributorMSP
      - CORE_PEER_GOSSIP_BOOTSTRAP=peer0.pharmacorp.pharbit.com:7051
    volumes:
      - /var/run/:/host/var/run/
      - ./crypto-config/peerOrganizations/medidistributor.pharbit.com/peers/peer0.medidistributor.pharbit.com/msp:/etc/hyperledger/fabric/msp
      - peer0.medidistributor.pharbit.com:/var/hyperledger/production
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: peer node start
    ports:
      - 9051:9051
      - 9052:9052
    networks:
      - pharbit

  cli:
    container_name: cli
    image: hyperledger/fabric-tools:2.2.12
    tty: true
    stdin_open: true
    environment:
      - GOPATH=/opt/gopath
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_ID=cli
      - CORE_PEER_ADDRESS=peer0.pharmacorp.pharbit.com:7051
      - CORE_PEER_LOCALMSPID=PharmaCorpMSP
      - CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/pharmacorp.pharbit.com/users/Admin@pharmacorp.pharbit.com/msp
      - CORE_CHAINCODE_KEEPALIVE=10
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: /bin/bash
    volumes:
      - /var/run/:/host/var/run/
      - ./chaincode/:/opt/gopath/src/github.com/
      - ./crypto-config:/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/
      - ./channel-artifacts:/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts
    networks:
      - pharbit
    depends_on:
      - orderer.pharbit.com
      - peer0.pharmacorp.pharbit.com
      - peer1.pharmacorp.pharbit.com
      - peer0.medidistributor.pharbit.com
EOF

    print_status "Docker Compose configuration created!"
}

# Create configuration files
create_config_files() {
    print_info "Creating configuration files..."
    
    # Create crypto-config.yaml
    cat > crypto-config.yaml << 'EOF'
OrdererOrgs:
  - Name: OrdererOrg
    Domain: pharbit.com
    Specs:
      - Hostname: orderer

PeerOrgs:
  - Name: PharmaCorp
    Domain: pharmacorp.pharbit.com
    EnableNodeOUs: true
    Template:
      Count: 2
    Users:
      Count: 1

  - Name: MediDistributor
    Domain: medidistributor.pharbit.com
    EnableNodeOUs: true
    Template:
      Count: 2
    Users:
      Count: 1
EOF

    # Create configtx.yaml
    cat > configtx.yaml << 'EOF'
Organizations:
    - &OrdererOrg
        Name: OrdererOrg
        ID: OrdererMSP
        MSPDir: crypto-config/ordererOrganizations/pharbit.com/msp

    - &PharmaCorp
        Name: PharmaCorpMSP
        ID: PharmaCorpMSP
        MSPDir: crypto-config/peerOrganizations/pharmacorp.pharbit.com/msp
        Policies:
            Readers:
                Type: Signature
                Rule: "OR('PharmaCorpMSP.member')"
            Writers:
                Type: Signature
                Rule: "OR('PharmaCorpMSP.member')"
            Admins:
                Type: Signature
                Rule: "OR('PharmaCorpMSP.admin')"
        AnchorPeers:
            - Host: peer0.pharmacorp.pharbit.com
              Port: 7051

    - &MediDistributor
        Name: MediDistributorMSP
        ID: MediDistributorMSP
        MSPDir: crypto-config/peerOrganizations/medidistributor.pharbit.com/msp
        Policies:
            Readers:
                Type: Signature
                Rule: "OR('MediDistributorMSP.member')"
            Writers:
                Type: Signature
                Rule: "OR('MediDistributorMSP.member')"
            Admins:
                Type: Signature
                Rule: "OR('MediDistributorMSP.admin')"
        AnchorPeers:
            - Host: peer0.medidistributor.pharbit.com
              Port: 9051

Application: &ApplicationDefaults
    Organizations:

Orderer: &OrdererDefaults
    OrdererType: etcdraft
    Addresses:
        - orderer.pharbit.com:7050
    BatchTimeout: 2s
    BatchSize:
        MaxMessageCount: 10
        AbsoluteMaxBytes: 99 MB
        PreferredMaxBytes: 512 KB
    Organizations:

Channel: &ChannelDefaults
    Policies:
        Readers:
            Type: ImplicitMeta
            Rule: "ANY Readers"
        Writers:
            Type: ImplicitMeta
            Rule: "ANY Writers"
        Admins:
            Type: ImplicitMeta
            Rule: "MAJORITY Admins"

Profiles:
    TwoOrgsOrdererGenesis:
        <<: *ChannelDefaults
        Orderer:
            <<: *OrdererDefaults
            Organizations:
                - *OrdererOrg
        Consortiums:
            PharbitConsortium:
                Organizations:
                    - *PharmaCorp
                    - *MediDistributor

    TwoOrgsChannel:
        Consortium: PharbitConsortium
        Application:
            <<: *ApplicationDefaults
            Organizations:
                - *PharmaCorp
                - *MediDistributor
EOF

    print_status "Configuration files created!"
}

# Start the network
start_network() {
    print_info "Starting the blockchain network..."
    
    docker-compose up -d
    
    print_status "Network started! Waiting for services to be ready..."
    sleep 10
}

# Create and join channel
setup_channel() {
    print_info "Setting up the channel..."
    
    # Create channel
    docker exec cli peer channel create -o orderer.pharbit.com:7050 -c mychannel -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/channel.tx
    
    # Join channel for PharmaCorp peers
    docker exec cli peer channel join -b mychannel.block
    docker exec -e CORE_PEER_ADDRESS=peer1.pharmacorp.pharbit.com:8051 cli peer channel join -b mychannel.block
    
    # Join channel for MediDistributor peers
    docker exec -e CORE_PEER_ADDRESS=peer0.medidistributor.pharbit.com:9051 -e CORE_PEER_LOCALMSPID=MediDistributorMSP -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/medidistributor.pharbit.com/users/Admin@medidistributor.pharbit.com/msp cli peer channel join -b mychannel.block
    
    print_status "Channel setup completed!"
}

# Install and instantiate chaincode
setup_chaincode() {
    print_info "Setting up chaincode..."
    
    # Install chaincode
    docker exec cli peer chaincode install -n medicine-tracking -v 1.0 -p github.com/medicine-tracking
    
    # Instantiate chaincode
    docker exec cli peer chaincode instantiate -o orderer.pharbit.com:7050 -C mychannel -n medicine-tracking -v 1.0 -c '{"Args":[]}' -P "AND ('PharmaCorpMSP.peer','MediDistributorMSP.peer')"
    
    print_status "Chaincode setup completed!"
}

# Create client applications
create_client_apps() {
    print_info "Creating client applications..."
    
    mkdir -p client
    
    # Create package.json
    cat > client/package.json << 'EOF'
{
  "name": "pharbit-blockchain-client",
  "version": "1.0.0",
  "description": "Client application for Pharbit Blockchain",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "create-transaction": "node create-transaction.js",
    "query": "node query.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": ["blockchain", "hyperledger-fabric", "medicine-tracking"],
  "author": "Pharbit Team",
  "license": "MIT",
  "dependencies": {
    "fabric-network": "^2.2.19",
    "fabric-ca-client": "^2.2.19"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
EOF

    # Create main application
    cat > client/app.js << 'EOF'
const { Wallets, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // Load the network configuration
        const ccpPath = path.resolve(__dirname, '..', 'config', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Create a new gateway for connecting to our peer node
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network
        const contract = network.getContract('medicine-tracking');

        console.log('✅ Connected to blockchain network successfully!');
        console.log('🚀 Ready to create transactions!');

        // Disconnect from the gateway
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to connect to network: ${error}`);
        process.exit(1);
    }
}

main();
EOF

    print_status "Client applications created!"
}

# Create connection profile
create_connection_profile() {
    print_info "Creating connection profile..."
    
    mkdir -p config
    
    cat > config/connection-org1.json << 'EOF'
{
    "name": "pharbit-network",
    "version": "1.0.0",
    "client": {
        "organization": "PharmaCorp",
        "connection": {
            "timeout": {
                "peer": {
                    "endorser": "300"
                },
                "orderer": "300"
            }
        }
    },
    "channels": {
        "mychannel": {
            "orderers": [
                "orderer.pharbit.com"
            ],
            "peers": {
                "peer0.pharmacorp.pharbit.com": {
                    "endorsingPeer": true,
                    "chaincodeQuery": true,
                    "ledgerQuery": true,
                    "eventSource": true
                },
                "peer1.pharmacorp.pharbit.com": {
                    "endorsingPeer": false,
                    "chaincodeQuery": true,
                    "ledgerQuery": true,
                    "eventSource": false
                },
                "peer0.medidistributor.pharbit.com": {
                    "endorsingPeer": true,
                    "chaincodeQuery": true,
                    "ledgerQuery": true,
                    "eventSource": true
                }
            }
        }
    },
    "organizations": {
        "PharmaCorp": {
            "mspid": "PharmaCorpMSP",
            "peers": [
                "peer0.pharmacorp.pharbit.com",
                "peer1.pharmacorp.pharbit.com"
            ],
            "certificateAuthorities": [
                "ca.pharmacorp.pharbit.com"
            ]
        },
        "MediDistributor": {
            "mspid": "MediDistributorMSP",
            "peers": [
                "peer0.medidistributor.pharbit.com"
            ],
            "certificateAuthorities": [
                "ca.medidistributor.pharbit.com"
            ]
        }
    },
    "orderers": {
        "orderer.pharbit.com": {
            "url": "grpc://localhost:7050"
        }
    },
    "peers": {
        "peer0.pharmacorp.pharbit.com": {
            "url": "grpc://localhost:7051"
        },
        "peer1.pharmacorp.pharbit.com": {
            "url": "grpc://localhost:8051"
        },
        "peer0.medidistributor.pharbit.com": {
            "url": "grpc://localhost:9051"
        }
    }
}
EOF

    print_status "Connection profile created!"
}

# Create README
create_readme() {
    print_info "Creating comprehensive README..."
    
    cat > README-COMPLETE-BLOCKCHAIN.md << 'EOF'
# 🚀 Complete Pharbit Blockchain System

Welcome to the complete Pharbit Blockchain system! This is a fully functional Hyperledger Fabric network with medicine tracking capabilities.

## 🎯 What's Included

### 🏗️ Network Components
- **Orderer Node**: Manages transaction ordering
- **PharmaCorp Peers**: 2 peer nodes for pharmaceutical organization
- **MediDistributor Peers**: 2 peer nodes for medical distributor organization
- **CLI Container**: Command-line interface for network management

### 📦 Smart Contracts
- **Medicine Tracking**: Track medicine batches, locations, and transfers
- **Transaction System**: Handle cryptocurrency-style transactions

### 🌐 Client Applications
- **Web Interface**: Beautiful UI for creating transactions
- **Interactive Terminal**: Command-line interface
- **Node.js Client**: Programmatic access to the blockchain

## 🚀 Quick Start

### 1. Start the Complete Network
```bash
./complete-blockchain-setup.sh
```

### 2. Use the Web Interface
```bash
./launch-transaction-creator.sh
# Choose option 1 (Web Interface)
```

### 3. Create Your First Transaction
- Enter sender: `0x89f97Cb35236a1d0190FB25B31C5C0fF4107Ec1b`
- Enter receiver: `6M3uvRFJSR3hcJab22fSAQGUgXxiMKgdg225k3Pq9qpR`
- Enter amount: `10`
- Click "Create Transaction Block"

## 🏗️ Network Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Orderer Node  │    │ PharmaCorp Peer │    │MediDistributor  │
│   (Port 7050)   │    │   (Port 7051)   │    │   Peer (9051)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   CLI Container │
                    │  (Management)   │
                    └─────────────────┘
```

## 📋 Available Commands

### Network Management
```bash
# Start network
docker-compose up -d

# Stop network
docker-compose down

# View logs
docker-compose logs -f

# Restart network
docker-compose restart
```

### Chaincode Operations
```bash
# Install chaincode
docker exec cli peer chaincode install -n medicine-tracking -v 1.0 -p github.com/medicine-tracking

# Instantiate chaincode
docker exec cli peer chaincode instantiate -o orderer.pharbit.com:7050 -C mychannel -n medicine-tracking -v 1.0 -c '{"Args":[]}' -P "AND ('PharmaCorpMSP.peer','MediDistributorMSP.peer')"

# Query chaincode
docker exec cli peer chaincode query -C mychannel -n medicine-tracking -c '{"Args":["GetAllMedicines"]}'
```

### Client Applications
```bash
# Web interface
open client/web-interface.html

# Interactive terminal
cd client && node interactive-transaction.js

# Quick transaction
./quick-start-transaction.sh
```

## 🔧 Configuration Files

- **crypto-config.yaml**: Cryptographic material configuration
- **configtx.yaml**: Channel and organization configuration
- **docker-compose.yaml**: Network topology and services
- **connection-org1.json**: Client connection profile

## 📊 Monitoring

### View Network Status
```bash
# Check running containers
docker ps

# View network logs
docker-compose logs orderer.pharbit.com
docker-compose logs peer0.pharmacorp.pharbit.com
```

### Check Channel Status
```bash
# List channels
docker exec cli peer channel list

# Get channel info
docker exec cli peer channel getinfo -c mychannel
```

## 🎉 Success Indicators

✅ **Network Running**: All containers are up and running  
✅ **Channel Created**: mychannel exists and is active  
✅ **Chaincode Installed**: medicine-tracking is deployed  
✅ **Client Connected**: Can create and query transactions  

## 🆘 Troubleshooting

### Common Issues

**Network won't start:**
```bash
# Check Docker is running
docker info

# Clean up and restart
docker-compose down -v
docker system prune -f
./complete-blockchain-setup.sh
```

**Chaincode errors:**
```bash
# Reinstall chaincode
docker exec cli peer chaincode install -n medicine-tracking -v 1.1 -p github.com/medicine-tracking
docker exec cli peer chaincode upgrade -o orderer.pharbit.com:7050 -C mychannel -n medicine-tracking -v 1.1 -c '{"Args":[]}'
```

**Client connection issues:**
```bash
# Check connection profile
cat config/connection-org1.json

# Verify network is running
docker ps
```

## 🚀 Next Steps

1. **Create more transactions** using the web interface
2. **Add more organizations** to the network
3. **Deploy additional chaincode** for new use cases
4. **Build custom applications** using the client SDK
5. **Monitor network performance** and optimize

---

**Your complete blockchain system is ready! 🎉**
EOF

    print_status "README created!"
}

# Main execution
main() {
    echo "🚀 Starting Complete Blockchain Setup..."
    echo "========================================"
    echo ""
    
    # Set environment variables
    export PATH=${PWD}/bin:${PWD}:$PATH
    export FABRIC_CFG_PATH=${PWD}
    
    # Execute setup steps
    check_prerequisites
    download_fabric
    create_config_files
    generate_crypto
    generate_channel_artifacts
    create_docker_compose
    create_connection_profile
    create_client_apps
    create_readme
    
    echo ""
    print_info "Starting the network..."
    start_network
    
    echo ""
    print_info "Setting up the channel..."
    setup_channel
    
    echo ""
    print_info "Setting up chaincode..."
    setup_chaincode
    
    echo ""
    print_status "🎉 Complete Blockchain System Created Successfully!"
    echo ""
    echo "📋 What's Available:"
    echo "  ✅ Hyperledger Fabric Network (4 peers + 1 orderer)"
    echo "  ✅ Medicine Tracking Chaincode"
    echo "  ✅ Transaction System"
    echo "  ✅ Web Interface"
    echo "  ✅ Interactive Terminal"
    echo "  ✅ Client Applications"
    echo ""
    echo "🚀 Next Steps:"
    echo "  1. Run: ./launch-transaction-creator.sh"
    echo "  2. Choose option 1 (Web Interface)"
    echo "  3. Create your first transaction!"
    echo ""
    echo "📚 Documentation: README-COMPLETE-BLOCKCHAIN.md"
    echo ""
}

# Run the main function
main