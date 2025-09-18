# PharbitChain Backend API

A comprehensive Node.js Express backend server for pharmaceutical blockchain management with complete integration for blockchain, database, and file storage services.

## 🏗️ Architecture

### Project Structure
```
backend/
├── index.js                 # Main entry point
├── package.json             # Dependencies and scripts
├── .env.example            # Environment variables template
├── middleware/             # Custom middleware
│   ├── auth.js            # Authentication & authorization
│   ├── validation.js      # Input validation
│   └── errorHandler.js    # Error handling
├── routes/                # API routes
│   ├── auth.js           # Authentication routes
│   ├── batches.js        # Batch management routes
│   ├── compliance.js     # Compliance routes
│   ├── wallets.js        # Wallet management routes
│   ├── files.js          # File management routes
│   └── health.js         # Health check routes
├── services/             # External service integrations
│   ├── blockchainService.js  # Ethereum blockchain integration
│   ├── databaseService.js    # Supabase database integration
│   └── s3Service.js          # AWS S3 file storage integration
└── utils/                # Utility functions
    ├── logger.js         # Winston logging configuration
    └── swagger.js        # API documentation
```

## 🚀 Features

### Core Functionality
- **Batch Management**: Create, transfer, and track pharmaceutical batches
- **Compliance Tracking**: Record compliance checks and audit trails
- **Wallet Management**: Generate and manage Ethereum wallets
- **File Storage**: Upload and manage files with S3 integration
- **Authentication**: JWT-based authentication with role-based access control

### Integrations
- **Blockchain**: ethers.js integration with smart contracts
- **Database**: Supabase PostgreSQL with real-time capabilities
- **File Storage**: AWS S3 with pre-signed URLs and metadata
- **Logging**: Winston with structured logging and file rotation
- **Documentation**: Swagger/OpenAPI 3.0 with interactive docs

### Security Features
- JWT authentication with role-based access control
- Input validation with Joi and express-validator
- Rate limiting and CORS protection
- Helmet security headers
- Encrypted wallet storage
- Secure file upload with type validation

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/verify` - Verify JWT token

### Batch Management
- `GET /api/batches` - Get all batches (paginated)
- `GET /api/batches/:batchId` - Get batch by ID
- `POST /api/batches` - Create new batch
- `PUT /api/batches/:batchId/transfer` - Transfer batch ownership
- `PUT /api/batches/:batchId/status` - Update batch status
- `PUT /api/batches/:batchId/metadata` - Update batch metadata
- `GET /api/batches/:batchId/transfers` - Get transfer history
- `GET /api/batches/statistics` - Get batch statistics

### Compliance Management
- `POST /api/compliance/checks` - Add compliance check
- `GET /api/compliance/checks/:recordId` - Get compliance record
- `PUT /api/compliance/checks/:recordId/status` - Update compliance status
- `GET /api/compliance/batches/:batchId` - Get compliance history
- `POST /api/compliance/audits` - Record audit trail
- `GET /api/compliance/audits` - Get audit trails
- `POST /api/compliance/standards` - Set compliance standard
- `GET /api/compliance/standards/:name` - Get compliance standard
- `GET /api/compliance/statistics` - Get compliance statistics

### Wallet Management
- `POST /api/wallets/generate` - Generate new wallets
- `POST /api/wallets/import` - Import existing wallet
- `GET /api/wallets` - Get user's wallets
- `GET /api/wallets/:address` - Get wallet by address
- `GET /api/wallets/:address/balance` - Get wallet balance
- `POST /api/wallets/:address/export` - Export wallet private key
- `PUT /api/wallets/:address` - Update wallet
- `DELETE /api/wallets/:address` - Delete wallet

### File Management
- `POST /api/files/upload` - Upload files to S3
- `GET /api/files/:fileId` - Get file by ID
- `GET /api/files/:fileId/download` - Download file
- `GET /api/files/:fileId/url` - Get pre-signed URL
- `GET /api/files/batches/:batchId` - Get files by batch
- `GET /api/files` - Get user's files (paginated)
- `DELETE /api/files/:fileId` - Delete file
- `GET /api/files/statistics` - Get file statistics

### Health & Monitoring
- `GET /health` - Health check
- `GET /health/ready` - Readiness check
- `GET /health/live` - Liveness check
- `GET /health/metrics` - Service metrics

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+
- PostgreSQL database (Supabase)
- AWS S3 bucket
- Ethereum node (local or remote)

### Installation

1. **Clone and install dependencies:**
```bash
cd backend
npm install
```

2. **Environment configuration:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Required environment variables:**
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Blockchain Configuration
RPC_URL=http://localhost:8545
PRIVATE_KEY=your-private-key-here
PHARMACEUTICAL_BATCH_ADDRESS=0x...
BATCH_NFT_ADDRESS=0x...
COMPLIANCE_MANAGER_ADDRESS=0x...

# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=pharbit-blockchain-files
```

4. **Start the server:**
```bash
# Development
npm run dev

# Production
npm start
```

## 📚 API Documentation

### Interactive Documentation
- **Swagger UI**: `http://localhost:3000/api-docs`
- **OpenAPI Spec**: Available at `/api-docs.json`

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Response Format
All API responses follow a consistent format:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Handling
Errors are returned with detailed information:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint",
  "method": "POST"
}
```

## 🔧 Configuration

### Database Setup
The service automatically creates required tables on startup:
- `users` - User accounts and roles
- `batches` - Pharmaceutical batch records
- `batch_transfers` - Batch transfer history
- `compliance_records` - Compliance check records
- `audit_trails` - Audit trail records
- `files` - File metadata and references
- `wallets` - Wallet information (encrypted)

### S3 Bucket Setup
1. Create an S3 bucket
2. Configure CORS policy for file uploads
3. Set up IAM user with appropriate permissions
4. Configure environment variables

### Blockchain Setup
1. Deploy smart contracts using Hardhat
2. Update contract addresses in environment
3. Ensure RPC endpoint is accessible
4. Fund wallet with ETH for gas fees

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
- Unit tests for all services
- Integration tests for API endpoints
- Error handling tests
- Authentication and authorization tests

## 📊 Monitoring & Logging

### Logging
- **Console**: Development logs with colors
- **Files**: Production logs with rotation
- **Levels**: error, warn, info, debug
- **Structured**: JSON format with metadata

### Health Checks
- **Health**: Overall service health
- **Ready**: Service readiness for traffic
- **Live**: Service liveness
- **Metrics**: System and application metrics

### Monitoring
- Request/response logging
- Performance metrics
- Error tracking
- Blockchain transaction monitoring
- Database operation tracking
- S3 operation tracking

## 🔒 Security

### Authentication & Authorization
- JWT tokens with configurable expiration
- Role-based access control (RBAC)
- Permission-based authorization
- Resource ownership validation

### Input Validation
- Joi schema validation
- Express-validator rules
- Sanitization and type checking
- File upload validation

### Security Headers
- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Request size limits

### Data Protection
- Encrypted wallet storage
- Secure file uploads
- Input sanitization
- SQL injection prevention

## 🚀 Deployment

### Production Deployment
1. Set `NODE_ENV=production`
2. Configure production database
3. Set up SSL/TLS certificates
4. Configure reverse proxy (Nginx)
5. Set up monitoring and logging
6. Configure backup strategies

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment-Specific Configuration
- **Development**: Local services, debug logging
- **Staging**: Production-like setup, testing data
- **Production**: Optimized performance, security hardening

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the logs for error details
- Contact the development team

---

**Built with ❤️ for pharmaceutical supply chain transparency and compliance**