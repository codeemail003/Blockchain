# 🏥 PharbitChain - Pharmaceutical Supply Chain Blockchain

A production-ready pharmaceutical supply chain blockchain system with AWS integration, FDA 21 CFR Part 11 compliance, and comprehensive monitoring.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Redis 6+
- AWS Account with S3 access
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Maitreyapharbit/Blockchain.git
cd pharbit-blockchain
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup credentials**
```bash
npm run setup:credentials
```

4. **Setup database**
```bash
npm run setup:database
```

5. **Start the application**
```bash
npm run dev
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# AWS Configuration
AWS_REGION=eu-north-1
AWS_S3_BUCKET=pharbit-blockchain
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# Database Configuration
DATABASE_URL=postgresql://pharbit_user:password@localhost:5432/pharbit
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here

# Compliance
COMPLIANCE_MODE=FDA_21CFR11
DIGITAL_SIGNATURE_REQUIRED=true
DSCSA_ENABLED=true
```

## 🏗️ Architecture

### Core Components

- **Blockchain Core**: Proof of Work consensus with pharmaceutical-specific features
- **Database Layer**: PostgreSQL + Redis + LevelDB integration
- **AWS S3 Integration**: Document storage with compliance features
- **Authentication**: JWT-based with role-based access control
- **Compliance Engine**: FDA 21 CFR Part 11, DSCSA, GDPR compliance
- **API Layer**: RESTful APIs with comprehensive validation
- **Monitoring**: Health checks, logging, and performance monitoring

### Technology Stack

- **Backend**: Node.js, Express.js
- **Blockchain**: Custom implementation with Proof of Work
- **Database**: PostgreSQL, Redis, LevelDB
- **Storage**: AWS S3
- **Authentication**: JWT, bcrypt
- **Monitoring**: PM2, Winston, Custom health checks
- **Documentation**: Swagger/OpenAPI

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile

### Blockchain Endpoints

- `GET /api/blockchain/status` - Get blockchain status
- `POST /api/blockchain/transaction` - Add transaction
- `POST /api/blockchain/mine` - Mine new block
- `GET /api/blockchain/block/{index}` - Get block by index
- `GET /api/blockchain/transaction/{hash}` - Get transaction by hash

### Document Management

- `POST /api/documents/upload` - Upload document
- `GET /api/documents/{fileId}/download` - Download document
- `GET /api/documents` - List documents
- `POST /api/documents/{fileId}/approve` - Approve document
- `DELETE /api/documents/{fileId}` - Delete document

### Batch Management

- `POST /api/batches` - Create batch
- `GET /api/batches` - List batches
- `GET /api/batches/{batchId}` - Get batch details
- `PUT /api/batches/{batchId}/update` - Update batch
- `POST /api/batches/{batchId}/transfer` - Transfer batch
- `POST /api/batches/{batchId}/recall` - Recall batch

### Compliance

- `GET /api/compliance/audit-trail` - Get audit trail
- `GET /api/compliance/violations` - Get compliance violations
- `POST /api/compliance/report` - Generate compliance report
- `GET /api/compliance/retention-check` - Check data retention

### Health Monitoring

- `GET /api/health` - System health status
- `GET /api/health/detailed` - Detailed health status
- `GET /api/health/ready` - Readiness check
- `GET /api/health/live` - Liveness check

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Token refresh mechanism
- Session management

### Data Protection
- End-to-end encryption
- Digital signatures for documents
- Secure file storage in S3
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### Compliance
- FDA 21 CFR Part 11 compliance
- DSCSA serialization support
- GDPR data protection
- ISO 27001 security standards
- Audit trail maintenance
- Data retention policies

## 🏥 Pharmaceutical Features

### Supply Chain Tracking
- Batch creation and tracking
- Product serialization
- Location tracking
- Ownership transfers
- Recall management

### Document Management
- Secure document upload
- Digital signatures
- Version control
- Access control
- Compliance validation

### Regulatory Compliance
- FDA 21 CFR Part 11
- DSCSA requirements
- Audit trail generation
- Compliance reporting
- Data retention management

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment
```bash
npm run deploy:ec2
```

### Docker Deployment
```bash
docker-compose up -d
```

### PM2 Management
```bash
pm2 start ecosystem.config.js
pm2 status
pm2 logs pharbit-blockchain
pm2 monit
```

## 📊 Monitoring

### Health Checks
- System health monitoring
- Database connectivity
- Blockchain validation
- S3 storage status
- Performance metrics

### Logging
- Structured logging with Winston
- Audit trail logging
- Security event logging
- Performance logging
- Error tracking

### Metrics
- Blockchain statistics
- Transaction throughput
- Database performance
- Memory usage
- CPU utilization

## 🧪 Testing

### Run Tests
```bash
npm test
npm run test:watch
npm run test:coverage
```

### Test Types
- Unit tests
- Integration tests
- API tests
- Security tests
- Compliance tests

## 📈 Performance

### Optimization Features
- Database indexing
- Redis caching
- Connection pooling
- Compression middleware
- Rate limiting
- Memory management

### Scalability
- Horizontal scaling with PM2
- Database sharding support
- Load balancing ready
- Microservices architecture
- Container support

## 🔧 Development

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database
- `npm run docs` - Generate API documentation

### Code Quality
- ESLint configuration
- Prettier formatting
- Pre-commit hooks
- TypeScript support
- JSDoc documentation

## 📋 Requirements

### System Requirements
- Node.js 18+
- PostgreSQL 12+
- Redis 6+
- 4GB RAM minimum
- 20GB disk space
- AWS S3 bucket

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Documentation](http://localhost:3000/api-docs)
- [Health Check](http://localhost:3000/health)
- [System Status](http://localhost:3000/api/health)

### Contact
- Email: support@pharbit.com
- GitHub Issues: [Create Issue](https://github.com/Maitreyapharbit/Blockchain/issues)

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core blockchain implementation
- ✅ Database integration
- ✅ AWS S3 integration
- ✅ Authentication system
- ✅ API endpoints
- ✅ Compliance features

### Phase 2 (Next)
- 🔄 Smart contracts
- 🔄 Mobile app
- 🔄 Advanced analytics
- 🔄 Machine learning integration
- 🔄 IoT device integration

### Phase 3 (Future)
- 📋 Multi-chain support
- 📋 Advanced AI features
- 📋 Global deployment
- 📋 Enterprise features
- 📋 Third-party integrations

---

**PharbitChain** - Revolutionizing pharmaceutical supply chain transparency and compliance through blockchain technology.