## Hyperledger Fabric Adoption Guide

This guide explains how to stand up a local Hyperledger Fabric network and connect your Node.js backend to it. We use Fabric v2.5+ test-network and the Node SDK.

### Prerequisites
- Docker and Docker Compose
- cURL, bash, OpenSSL
- Node.js 18+

### 1) Clone Fabric samples and start a test network
```bash
# From a working directory outside this repo
git clone https://github.com/hyperledger/fabric-samples.git
cd fabric-samples
git checkout v2.5.7
cd test-network

# Bring up a 2-org Raft network with CA
./network.sh down
./network.sh up createChannel -c mychannel -ca -s couchdb

# Deploy basic chaincode (asset-transfer) as a sanity check
./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-go -ccl go
```

Outputs:
- Connection profiles: `fabric-samples/test-network/organizations/peerOrganizations/*/connection-*.json`
- MSP materials (certs/keys): `fabric-samples/test-network/organizations`
- Channel: `mychannel`

### 2) Prepare connection profile and wallet for backend
Copy the following from `fabric-samples/test-network` into this repo:
```
pharbit-contracts/backend/fabric/
├── connection-org1.json
├── wallet/
│   └── appUser.id
└── README.md
```

How to enroll an app user (Org1):
```bash
cd fabric-samples/test-network

# Register + enroll appUser using Org1 CA
ORG1_MSP=org1.example.com
ORG1_CA=localhost:7054

FABRIC_CA_CLIENT_HOME=./organizations/peerOrganizations/$ORG1_MSP \
fabric-ca-client register --id.name appUser --id.secret appUserpw --id.type client -u https://$ORG1_CA --tls.certfiles organizations/fabric-ca/org1/tls-cert.pem

FABRIC_CA_CLIENT_HOME=./organizations/peerOrganizations/$ORG1_MSP \
fabric-ca-client enroll -u https://appUser:appUserpw@$ORG1_CA --tls.certfiles organizations/fabric-ca/org1/tls-cert.pem -M appUser

# Copy cert/key to this repo's backend wallet format
mkdir -p /workspace/pharbit-contracts/backend/fabric/wallet
cp appUser/signcerts/* /workspace/pharbit-contracts/backend/fabric/wallet/appUser-cert.pem
cp appUser/keystore/* /workspace/pharbit-contracts/backend/fabric/wallet/appUser-key.pem

# Copy Org1 connection profile
cp organizations/peerOrganizations/$ORG1_MSP/connection-org1.json /workspace/pharbit-contracts/backend/fabric/connection-org1.json
```

### 3) Wire the backend to Fabric (Node SDK)
We will add a new client in `pharbit-contracts/backend` that uses the Fabric Gateway SDK.

Env variables (example):
```
FABRIC_CONNECTION_PROFILE=./fabric/connection-org1.json
FABRIC_CHANNEL=mychannel
FABRIC_CHAINCODE=basic
FABRIC_IDENTITY_LABEL=appUser
FABRIC_CERT=./fabric/wallet/appUser-cert.pem
FABRIC_KEY=./fabric/wallet/appUser-key.pem
```

Minimal client usage pattern:
```javascript
import { connect, signers, identities } from '@hyperledger/fabric-gateway';
import fs from 'fs';

const cp = JSON.parse(fs.readFileSync(process.env.FABRIC_CONNECTION_PROFILE));
const cert = fs.readFileSync(process.env.FABRIC_CERT);
const key = fs.readFileSync(process.env.FABRIC_KEY);

const identity = identities.x509Identity('Org1MSP', cert);
const signer = signers.newPrivateKeySigner(identities.privateKeyFromPem(key));

// connect() with gRPC client using cp (peer endpoint + TLS)
// const network = await gateway.getNetwork(process.env.FABRIC_CHANNEL);
// const contract = network.getContract(process.env.FABRIC_CHAINCODE);
// await contract.submitTransaction('CreateAsset', 'asset1', 'blue', '10', 'Tom', '100');
```

### 4) API strategy
- Keep your existing REST routes, but swap their handlers to call Fabric chaincode via the Gateway SDK.
- Example mapping:
  - POST /api/drugs/register → `contract.submitTransaction('RegisterDrug', ...)`
  - GET /api/drugs/:id → `contract.evaluateTransaction('GetDrug', id)`

### 5) Notes
- Fabric is permissioned, no Proof of Work.
- Endorsement policies control which orgs must sign a tx.
- Channels provide data isolation; consider a pharma-private channel.
- For production, use Certificate Authorities and proper MSP directory layout.

### 6) Troubleshooting
- Use `peer chaincode query/invoke` from `test-network` to isolate chaincode issues.
- Check peer/orderer logs (Docker).
- Verify TLS certs and hostnames match in the connection profile.

