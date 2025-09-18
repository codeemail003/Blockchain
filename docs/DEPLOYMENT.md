# PharbitChain Deployment Guide

## Overview

This guide covers various deployment options for PharbitChain, from local development to production cloud deployment.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [AWS EC2 Deployment](#aws-ec2-deployment)
4. [Production Deployment](#production-deployment)
5. [Monitoring and Maintenance](#monitoring-and-maintenance)

## Local Development

### Prerequisites

- Node.js 18+
- npm 8+
- Git
- MetaMask browser extension

### Quick Start

```bash
# Clone repository
git clone https://github.com/pharbitchain/pharbit-blockchain.git
cd pharbit-blockchain

# Install dependencies
npm run install:all

# Start all services
./scripts/start-blockchain.sh
```

### Manual Setup

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

## Docker Deployment

### Development with Docker

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Run tests
docker-compose -f docker-compose.dev.yml run test-runner

# Run linting
docker-compose -f docker-compose.dev.yml run linter
```

### Production with Docker

```bash
# Build and start production environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Docker Configuration

The project includes multiple Docker configurations:

- **Dockerfile**: Production multi-stage build
- **Dockerfile.dev**: Development with hot reload
- **docker-compose.yml**: Production services
- **docker-compose.dev.yml**: Development services

## AWS EC2 Deployment

### Prerequisites

- AWS Account
- EC2 instance (t3.medium or larger)
- Domain name (optional)
- SSL certificate (optional)

### Automated Deployment

```bash
# Run deployment script
./scripts/deploy-to-ec2.sh

# Follow interactive prompts
# Enter AWS credentials, instance details, etc.
```

### Manual Deployment

#### 1. Launch EC2 Instance

```bash
# Launch Ubuntu 20.04 LTS instance
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-id subnet-xxxxxxxxx \
  --associate-public-ip-address
```

#### 2. Configure Security Groups

**Inbound Rules:**
- SSH (22): Your IP
- HTTP (80): 0.0.0.0/0
- HTTPS (443): 0.0.0.0/0
- Custom TCP (3000): 0.0.0.0/0 (Backend API)
- Custom TCP (3001): 0.0.0.0/0 (Frontend)

#### 3. Connect to Instance

```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

#### 4. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install Docker (optional)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
```

#### 5. Deploy Application

```bash
# Clone repository
git clone https://github.com/pharbitchain/pharbit-blockchain.git
cd pharbit-blockchain

# Install dependencies
npm run install:all

# Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with production values

# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 6. Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/pharbit-blockchain

# Add configuration
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/pharbit-blockchain /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 7. SSL Certificate (Optional)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Production Deployment

### Environment Variables

**Backend (.env):**
```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# AWS
AWS_ACCESS_KEY_ID=your_production_aws_key
AWS_SECRET_ACCESS_KEY=your_production_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_production_bucket

# JWT
JWT_SECRET=your_production_jwt_secret

# Blockchain
ETHEREUM_RPC_URL=your_production_rpc_url
PRIVATE_KEY=your_production_private_key
CONTRACT_ADDRESS=your_deployed_contract_address
```

**Frontend (.env):**
```env
REACT_APP_ENV=production
REACT_APP_API_URL=https://your-domain.com/api
REACT_APP_ETHEREUM_RPC_URL=your_production_rpc_url
REACT_APP_CONTRACT_ADDRESS=your_deployed_contract_address
```

### Database Setup

1. **Supabase Setup:**
   - Create production project
   - Run database migrations
   - Configure RLS policies
   - Set up backups

2. **Database Migrations:**
   ```bash
   cd backend
   npm run db:migrate
   npm run db:seed
   ```

### Smart Contract Deployment

1. **Deploy to Testnet:**
   ```bash
   cd contracts
   npx hardhat run scripts/deploy.js --network sepolia
   ```

2. **Deploy to Mainnet:**
   ```bash
   cd contracts
   npx hardhat run scripts/deploy.js --network mainnet
   ```

3. **Verify Contracts:**
   ```bash
   npx hardhat verify --network mainnet CONTRACT_ADDRESS
   ```

### Monitoring Setup

1. **PM2 Monitoring:**
   ```bash
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 30
   ```

2. **Health Checks:**
   ```bash
   # Add to crontab
   */5 * * * * curl -f http://localhost:3000/api/health || pm2 restart backend
   ```

3. **Log Management:**
   ```bash
   # Install logrotate
   sudo apt install logrotate -y
   
   # Configure log rotation
   sudo nano /etc/logrotate.d/pharbit-blockchain
   ```

## Monitoring and Maintenance

### Health Monitoring

```bash
# Check service status
pm2 status

# View logs
pm2 logs

# Monitor resources
pm2 monit

# Restart services
pm2 restart all
```

### Database Maintenance

```bash
# Backup database
pg_dump -h your-db-host -U pharbit pharbit_blockchain > backup.sql

# Restore database
psql -h your-db-host -U pharbit pharbit_blockchain < backup.sql
```

### Security Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js dependencies
npm audit fix

# Update Docker images
docker-compose pull
docker-compose up -d
```

### Performance Optimization

1. **Enable Gzip Compression:**
   ```nginx
   gzip on;
   gzip_types text/plain text/css application/json application/javascript;
   ```

2. **Configure Caching:**
   ```nginx
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

3. **Database Optimization:**
   - Add indexes for frequently queried fields
   - Configure connection pooling
   - Set up read replicas for heavy read workloads

### Backup Strategy

1. **Database Backups:**
   - Daily automated backups
   - Point-in-time recovery
   - Cross-region replication

2. **File Backups:**
   - S3 versioning enabled
   - Cross-region replication
   - Lifecycle policies

3. **Code Backups:**
   - Git repository
   - Automated deployments
   - Rollback procedures

### Troubleshooting

**Common Issues:**

1. **Service Won't Start:**
   ```bash
   # Check logs
   pm2 logs backend
   
   # Check environment variables
   pm2 env 0
   
   # Restart service
   pm2 restart backend
   ```

2. **Database Connection Issues:**
   ```bash
   # Test database connection
   cd backend
   node -e "require('./config/database').test()"
   ```

3. **Blockchain Connection Issues:**
   ```bash
   # Test RPC connection
   curl -X POST -H "Content-Type: application/json" \
     --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
     YOUR_RPC_URL
   ```

### Scaling

1. **Horizontal Scaling:**
   - Load balancer configuration
   - Multiple backend instances
   - Database read replicas

2. **Vertical Scaling:**
   - Increase instance size
   - Optimize database queries
   - Implement caching

3. **Auto-scaling:**
   - AWS Auto Scaling Groups
   - CloudWatch metrics
   - Custom scaling policies

## Security Considerations

1. **Environment Variables:**
   - Never commit .env files
   - Use secure secret management
   - Rotate keys regularly

2. **Network Security:**
   - Configure firewalls
   - Use VPCs and private subnets
   - Enable DDoS protection

3. **Application Security:**
   - Regular security audits
   - Dependency updates
   - Input validation

4. **Blockchain Security:**
   - Secure private key storage
   - Multi-signature wallets
   - Regular security reviews

## Cost Optimization

1. **Resource Right-sizing:**
   - Monitor usage patterns
   - Use appropriate instance types
   - Implement auto-scaling

2. **Storage Optimization:**
   - S3 lifecycle policies
   - Database cleanup scripts
   - Log rotation

3. **Network Optimization:**
   - Use CDN for static assets
   - Optimize API responses
   - Implement caching

This deployment guide provides comprehensive instructions for deploying PharbitChain in various environments. Choose the deployment method that best fits your requirements and infrastructure.