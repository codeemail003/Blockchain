# Pharbit User Guide (Skeleton)

## Overview
Pharmaceutical supply chain tracking via smart contracts on Polygon/Ethereum.

## Setup
1. Install Node.js LTS
2. `npm ci`
3. `npx hardhat compile`
4. Configure `.env` for RPC and private key
5. `npm run deploy:testnet`

## Wallet
- Use MetaMask; connect in frontend

## Workflows
- Create batch (manufacturer)
- Transfer custody (manufacturer->distributor->pharmacy)
- Record sensor data (IoT)
- Verify batch

## Compliance
- Governance parameters set via `PharbitGovernance`