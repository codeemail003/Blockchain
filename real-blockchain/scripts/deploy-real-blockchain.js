/**
 * @fileoverview Complete deployment script for real pharmaceutical blockchain
 * Deploys smart contracts, sets up infrastructure, and configures services
 */

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
    console.log('🚀 Starting complete pharmaceutical blockchain deployment...');

    // Check environment variables
    const requiredEnvVars = [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'S3_BUCKET_NAME'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:', missingVars.join(', '));
        console.log('Please set these variables in your .env file');
        process.exit(1);
    }

    // Get network information
    const network = await ethers.provider.getNetwork();
    console.log(`\n🌐 Deploying to network: ${network.name} (Chain ID: ${network.chainId})`);

    // Deploy smart contracts
    console.log('\n📋 Deploying smart contracts...');
    try {
        execSync('npx hardhat run scripts/deploy-contracts.js --network ' + network.name, { stdio: 'inherit' });
        console.log('✅ Smart contracts deployed successfully');
    } catch (error) {
        console.error('❌ Smart contract deployment failed:', error.message);
        process.exit(1);
    }

    // Read contract addresses
    const addressesFile = path.join(__dirname, '../contract-addresses.json');
    let contractAddresses = {};
    
    if (fs.existsSync(addressesFile)) {
        contractAddresses = JSON.parse(fs.readFileSync(addressesFile, 'utf8'));
    }

    const pharmaContractAddress = contractAddresses[network.name]?.PharmaceuticalSupplyChain;
    if (!pharmaContractAddress) {
        console.error('❌ Contract address not found');
        process.exit(1);
    }

    console.log(`✅ Pharmaceutical contract deployed at: ${pharmaContractAddress}`);

    // Create deployment configuration
    const deploymentConfig = {
        network: {
            name: network.name,
            chainId: network.chainId.toString(),
            rpcUrl: process.env.RPC_URL || `https://${network.name}.infura.io/v3/YOUR_PROJECT_ID`,
            blockExplorerUrl: process.env.BLOCK_EXPLORER_URL || 'https://etherscan.io'
        },
        contracts: {
            PharmaceuticalSupplyChain: pharmaContractAddress
        },
        services: {
            supabase: {
                url: process.env.SUPABASE_URL,
                enabled: true
            },
            s3: {
                bucket: process.env.S3_BUCKET_NAME,
                region: process.env.AWS_REGION || 'us-east-1',
                enabled: true
            },
            metamask: {
                enabled: true,
                supportedChains: ['0x1', '0x89', '0x38', '0xa', '0xa4b1']
            }
        },
        deployment: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            deployer: (await ethers.getSigners())[0].address
        }
    };

    // Save deployment configuration
    const configFile = path.join(__dirname, '../deployment-config.json');
    fs.writeFileSync(configFile, JSON.stringify(deploymentConfig, null, 2));
    console.log('📄 Deployment configuration saved to:', configFile);

    // Create environment file for production
    const envFile = path.join(__dirname, '../.env.production');
    const envContent = `# Production Environment Configuration
# Generated on ${new Date().toISOString()}

# Server Configuration
PORT=3000
NODE_ENV=production

# Supabase Configuration
SUPABASE_URL=${process.env.SUPABASE_URL}
SUPABASE_ANON_KEY=${process.env.SUPABASE_ANON_KEY}

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=${process.env.AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${process.env.AWS_SECRET_ACCESS_KEY}
AWS_REGION=${process.env.AWS_REGION || 'us-east-1'}
S3_BUCKET_NAME=${process.env.S3_BUCKET_NAME}

# Blockchain Network Configuration
CHAIN_ID=${network.chainId.toString()}
CHAIN_NAME=${network.name}
RPC_URL=${deploymentConfig.network.rpcUrl}
BLOCK_EXPLORER_URL=${deploymentConfig.network.blockExplorerUrl}

# Smart Contract Configuration
CONTRACT_ADDRESS=${pharmaContractAddress}

# Security Configuration
HTTPS_ENABLED=true
CORS_ORIGINS=https://your-domain.com

# Rate Limiting
RATE_WINDOW_MS=900000
RATE_MAX=1000

# Database Configuration
JSON_BODY_LIMIT=10mb

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=/var/log/pharbit-chain.log

# P2P Configuration
P2P_PORT=3001

# Mining Configuration
MINING_ENABLED=true
DIFFICULTY=4
MINING_REWARD=50
BLOCK_SIZE=1000
`;

    fs.writeFileSync(envFile, envContent);
    console.log('📄 Production environment file created:', envFile);

    // Create Docker configuration
    const dockerComposeContent = `version: '3.8'

services:
  pharbit-blockchain:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - SUPABASE_URL=\${SUPABASE_URL}
      - SUPABASE_ANON_KEY=\${SUPABASE_ANON_KEY}
      - AWS_ACCESS_KEY_ID=\${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=\${AWS_SECRET_ACCESS_KEY}
      - S3_BUCKET_NAME=\${S3_BUCKET_NAME}
      - CONTRACT_ADDRESS=${pharmaContractAddress}
      - CHAIN_ID=${network.chainId}
      - RPC_URL=${deploymentConfig.network.rpcUrl}
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
`;

    const dockerComposeFile = path.join(__dirname, '../docker-compose.prod.yml');
    fs.writeFileSync(dockerComposeFile, dockerComposeContent);
    console.log('📄 Docker Compose configuration created:', dockerComposeFile);

    // Create Dockerfile
    const dockerfileContent = `FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create directories
RUN mkdir -p logs data

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
`;

    const dockerfilePath = path.join(__dirname, '../Dockerfile');
    fs.writeFileSync(dockerfilePath, dockerfileContent);
    console.log('📄 Dockerfile created:', dockerfilePath);

    // Create deployment instructions
    const deploymentInstructions = `# Pharmaceutical Blockchain Deployment Instructions

## 🚀 Deployment Complete!

Your pharmaceutical blockchain has been successfully deployed with the following configuration:

### 📋 Contract Information
- **Network**: ${network.name} (Chain ID: ${network.chainId})
- **Contract Address**: ${pharmaContractAddress}
- **Block Explorer**: ${deploymentConfig.network.blockExplorerUrl}

### 🔗 Services Configured
- ✅ Supabase Database
- ✅ AWS S3 Storage
- ✅ MetaMask Integration
- ✅ Smart Contracts

### 📁 Files Created
- \`deployment-config.json\` - Complete deployment configuration
- \`.env.production\` - Production environment variables
- \`docker-compose.prod.yml\` - Docker Compose configuration
- \`Dockerfile\` - Docker container configuration

## 🚀 Next Steps

### 1. Deploy to Production Server
\`\`\`bash
# Copy files to your server
scp -r . user@your-server:/opt/pharbit-blockchain/

# On your server
cd /opt/pharbit-blockchain
docker-compose -f docker-compose.prod.yml up -d
\`\`\`

### 2. Configure Domain and SSL
- Set up your domain name
- Configure SSL certificates
- Update CORS_ORIGINS in .env.production

### 3. Set up Monitoring
- Configure log aggregation
- Set up health checks
- Monitor blockchain metrics

### 4. Test the System
\`\`\`bash
# Health check
curl http://your-domain.com/api/health

# Test MetaMask connection
curl -X POST http://your-domain.com/api/metamask/connect

# Test database sync
curl -X POST http://your-domain.com/api/sync/database
\`\`\`

### 5. Frontend Integration
Update your frontend to use:
- Contract address: ${pharmaContractAddress}
- API endpoint: http://your-domain.com/api
- Network: ${network.name}

## 🔧 Configuration

### Environment Variables
All required environment variables are set in \`.env.production\`.

### Database Schema
The Supabase database will be automatically initialized with the required tables.

### S3 Bucket
Make sure your S3 bucket has the correct permissions for the application.

## 📞 Support

For support and questions:
- Check the logs: \`docker-compose logs -f\`
- Monitor health: \`curl http://your-domain.com/api/health\`
- View metrics: \`curl http://your-domain.com/api/real-blockchain/stats\`

## 🎉 Ready to Use!

Your pharmaceutical blockchain is now ready for production use!
`;

    const instructionsFile = path.join(__dirname, '../DEPLOYMENT_INSTRUCTIONS.md');
    fs.writeFileSync(instructionsFile, deploymentInstructions);
    console.log('📄 Deployment instructions created:', instructionsFile);

    console.log('\n🎉 Deployment completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`   Contract: ${pharmaContractAddress}`);
    console.log(`   Configuration: ${configFile}`);
    console.log(`   Instructions: ${instructionsFile}`);
    
    console.log('\n🔗 Next Steps:');
    console.log('   1. Review the deployment configuration');
    console.log('   2. Deploy to your production server');
    console.log('   3. Configure your domain and SSL');
    console.log('   4. Test the system');
    console.log('   5. Start using your pharmaceutical blockchain!');

    return deploymentConfig;
}

// Handle errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    });