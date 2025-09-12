PharbitChain - Production Docker Deployment Guide

Prerequisites
---
## 🏭 Production Deployment Best Practices

- **Environment Management:** Use environment-specific configs (dev, staging, production) and secrets management integration.
- **Secrets:** Store secrets securely (do not hardcode in compose files). Use Docker secrets or environment vaults.
- **Backups:** Schedule automated backups and validate integrity. Use `./deploy/scripts/backup.sh` and `restore.sh`.
- **Monitoring:** Integrate health checks, metrics, and log aggregation. Use `./deploy/scripts/health.sh` and external monitoring tools.
- **Compliance:** Ensure FDA/GDPR compliance with audit trails, data retention, and regulatory validation.
- **Zero-Downtime Updates:** Use rolling updates and backup manager for safe upgrades.
- **Security:** Enable TLS, multi-sig wallets, audit logging, and role-based access control.
- **Documentation:** Document all deployment steps and environment variables.
---

Environment
- App reads config from environment variables (see .env.example).
- In Docker, you can pass environment in compose or an .env file.

Build and Run
```bash
# From repo root
docker compose build pharbitchain
docker compose up -d pharbitchain

# Check health
curl http://localhost:3000/api/health
```

HTTPS (optional)
1. Place tls.crt and tls.key under ./certs
2. Enable env vars in compose:
```yaml
    environment:
      - HTTPS_ENABLED=true
      - HTTPS_KEY_PATH=/certs/tls.key
      - HTTPS_CERT_PATH=/certs/tls.crt
    volumes:
      - ./certs:/certs:ro
```
3. Access: https://localhost:3000

Persistence
- LevelDB lives in /app/blockchain-db inside the container.
- Compose defines a named volume pharbitchain_data for persistence.

Logs
- View container logs:
```bash
docker logs -f pharbitchain
```

Backups
```bash
./deploy/scripts/backup.sh
./deploy/scripts/restore.sh ./backups/LATEST.tar.gz
```
---
## 🛡️ Compliance & Security

- **FDA 21 CFR Part 11**: Electronic records, audit trails, data integrity
- **GDPR**: Data privacy, right-to-erasure, retention management
- **Zero-Trust Architecture**: End-to-end encryption, multi-factor authentication
- **Enterprise Security**: Multi-sig, HSM, key recovery, role-based access, audit logging
- **Traceability**: Immutable batch tracking, recall, serialization, cold chain, expiry

Health Checks
```bash
./deploy/scripts/health.sh
```

Updates / Rollouts
```bash
docker compose build pharbitchain
docker compose up -d pharbitchain
```

Environment Variables (common)
- PORT (default 3000)
- DB_PATH (default /app/blockchain-db)
- DIFFICULTY, MINING_REWARD, BLOCK_SIZE
- CORS_ORIGINS, RATE_WINDOW_MS, RATE_MAX, JSON_BODY_LIMIT
- HTTPS_ENABLED, HTTPS_KEY_PATH, HTTPS_CERT_PATH

Troubleshooting
- If container restarts, check logs: docker logs pharbitchain
- Verify volume permissions on host
- Ensure TLS paths are mounted correctly when HTTPS is enabled