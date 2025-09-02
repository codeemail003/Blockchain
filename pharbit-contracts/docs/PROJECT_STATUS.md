# Pharbit Smart Contract System - Project Status

## What was implemented

- Contracts (Solidity 0.8.20)
  - PharbitStakeholder: RBAC for manufacturers, distributors, pharmacies, hospitals, IoT, regulators
  - PharbitBatch: batch lifecycle (status, custodian), sensor data recording, verifyBatch()
  - PharbitSensor: IoT sensor registry/attestation
  - PharbitSupplyChain: custody transfers, dispute events
  - PharbitGovernance: on-chain parameters (temperature, window)

- Hardhat setup
  - Hardhat v2.26 + @nomicfoundation/hardhat-toolbox
  - Ignition deployment module `ignition/modules/PharbitModule.ts`
  - Networks: hardhat, localhost, optional polygonTestnet via env
  - Compile success (evm target: paris)

- Deployment & exports
  - Script `npm run deploy:export`
    - Deploys with Ignition (hardhat/localhost)
    - Saves addresses to `deployments/addresses.<network>.json` and `deployments/addresses.local.json`
    - Copies ABIs to `frontend/src/contracts/*.json`

- Backend Web3 API (Node/Express)
  - File: `backend/server.js` (serves API + dashboard)
  - Router: `backend/api/blockchain-api.js`
    - GET /api/health
    - GET /api/batch/:id
    - GET /api/verify/:batchId
    - POST /api/sensor-data (requires PRIVATE_KEY; JSON-safe BigInt serialization)
  - Loads contract addresses and ABIs automatically from deployments and frontend/contracts

- Frontend dashboard (static)
  - File: `frontend/public/index.html`
  - Features:
    - Connect MetaMask
    - Call backend: /api/health, /api/verify/:id
    - Submit sensor data via backend (when signer configured)
  - Served by backend at `/`

- Documentation
  - `docs/api-reference.md` (API skeleton)
  - `docs/user-guide.md` (quick start)
  - This file: `docs/PROJECT_STATUS.md`

## How to run (local dev)

1) Start a local node and deploy

```bash
cd pharbit-contracts
npx hardhat node    # optional if you want a persistent localhost JSON-RPC
npm run deploy:export
```

2) Start backend API + dashboard

```bash
cd backend
npm install
export RPC_URL=http://127.0.0.1:8545
# optional for POST /api/sensor-data
# export PRIVATE_KEY=<one of the local Hardhat account keys>
npm start
```

3) Use

- Dashboard: http://localhost:4000
- API:
  - GET http://localhost:4000/api/health
  - GET http://localhost:4000/api/verify/TEST_BATCH
  - POST http://localhost:4000/api/sensor-data (JSON body: batchId, temperature, humidity, gps, tampering)

## Notes / next steps

- Add POST /api/batch to call createBatch on-chain for full E2E
- Wire stakeholder registration and custody transfers to API
- Add event indexing for supply chain journey and alerts
- Add testnet deployment (set RPC_URL/PRIVATE_KEY) and verify scripts
- Expand frontend UI for batch creation, custody, and history