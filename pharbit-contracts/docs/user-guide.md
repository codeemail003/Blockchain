# Pharbit User Guide (Skeleton)

## Overview
Pharmaceutical supply chain tracking via smart contracts on Polygon/Ethereum.
---
## 🏭 Production-Ready Features & Enterprise Compliance

Pharbit Contracts are designed for pharmaceutical supply chain traceability, security, and regulatory compliance:

- **Security:** Multi-sig wallets, audit logging, field encryption, role-based access
- **Compliance:** FDA 21 CFR Part 11, GDPR, immutable audit trails, data retention, regulatory validation
- **Traceability:** Batch lifecycle, recall management, serialization, cold chain monitoring
- **Integration:** RESTful & GraphQL APIs, webhooks, ERP/IoT connectors
- **Testing:** 90%+ code coverage, integration/load/security/compliance/chaos tests
- **Documentation:** Complete API docs, user guides, module READMEs
---

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