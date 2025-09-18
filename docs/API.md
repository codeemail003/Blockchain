# PharbitChain API Documentation

## Overview

The PharbitChain API provides comprehensive endpoints for managing pharmaceutical supply chain operations on the blockchain. All endpoints are RESTful and return JSON responses.

**Base URL**: `http://localhost:3000/api`  
**Content-Type**: `application/json`  
**Authentication**: Bearer Token (JWT)

## Authentication

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "manufacturer",
      "walletAddress": "0x..."
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  }
}
```

### Register
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "manufacturer",
  "walletAddress": "0x..."
}
```

### Refresh Token
```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

## Batch Management

### List Batches
```http
GET /api/batches
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status
- `manufacturer` (optional): Filter by manufacturer

**Response:**
```json
{
  "success": true,
  "data": {
    "batches": [
      {
        "id": "batch_123",
        "drugName": "Aspirin",
        "manufacturer": "0x...",
        "manufactureDate": "2024-01-15",
        "expiryDate": "2026-01-15",
        "quantity": 1000,
        "status": "CREATED",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

### Create Batch
```http
POST /api/batches
```

**Request Body:**
```json
{
  "drugName": "Aspirin",
  "manufactureDate": "2024-01-15",
  "expiryDate": "2026-01-15",
  "quantity": 1000,
  "batchNumber": "ASP-2024-001",
  "description": "Standard aspirin tablets"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batch": {
      "id": "batch_123",
      "drugName": "Aspirin",
      "manufacturer": "0x...",
      "manufactureDate": "2024-01-15",
      "expiryDate": "2026-01-15",
      "quantity": 1000,
      "status": "CREATED",
      "transactionHash": "0x...",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  }
}
```

### Get Batch Details
```http
GET /api/batches/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batch": {
      "id": "batch_123",
      "drugName": "Aspirin",
      "manufacturer": "0x...",
      "manufactureDate": "2024-01-15",
      "expiryDate": "2026-01-15",
      "quantity": 1000,
      "status": "CREATED",
      "currentOwner": "0x...",
      "transactionHistory": [
        {
          "from": "0x...",
          "to": "0x...",
          "timestamp": "2024-01-15T10:00:00Z",
          "transactionHash": "0x..."
        }
      ],
      "complianceRecords": []
    }
  }
}
```

### Transfer Batch
```http
POST /api/batches/:id/transfer
```

**Request Body:**
```json
{
  "to": "0x...",
  "quantity": 100
}
```

### Update Batch Status
```http
PUT /api/batches/:id/status
```

**Request Body:**
```json
{
  "status": "IN_TRANSIT"
}
```

## Compliance Management

### Get Compliance History
```http
GET /api/compliance/:batchId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "complianceRecords": [
      {
        "id": "comp_123",
        "batchId": "batch_123",
        "checkType": "FDA_APPROVAL",
        "passed": true,
        "timestamp": "2024-01-15T10:00:00Z",
        "auditor": "0x...",
        "notes": "Passed FDA approval process",
        "documentHash": "0x..."
      }
    ]
  }
}
```

### Add Compliance Check
```http
POST /api/compliance/check
```

**Request Body:**
```json
{
  "batchId": "batch_123",
  "checkType": "FDA_APPROVAL",
  "passed": true,
  "auditor": "0x...",
  "notes": "Passed FDA approval process",
  "documentHash": "0x..."
}
```

## File Management

### Upload File
```http
POST /api/files/upload
```

**Request:** Multipart form data
- `file`: File to upload
- `batchId` (optional): Associated batch ID
- `metadata` (optional): Additional metadata

**Response:**
```json
{
  "success": true,
  "data": {
    "file": {
      "id": "file_123",
      "filename": "document.pdf",
      "size": 1024000,
      "mimeType": "application/pdf",
      "url": "https://s3.amazonaws.com/bucket/file_123.pdf",
      "hash": "0x...",
      "uploadedAt": "2024-01-15T10:00:00Z"
    }
  }
}
```

### Download File
```http
GET /api/files/:id
```

**Response:** File content with appropriate headers

### Get File Metadata
```http
GET /api/files/:id/metadata
```

**Response:**
```json
{
  "success": true,
  "data": {
    "file": {
      "id": "file_123",
      "filename": "document.pdf",
      "size": 1024000,
      "mimeType": "application/pdf",
      "url": "https://s3.amazonaws.com/bucket/file_123.pdf",
      "hash": "0x...",
      "uploadedAt": "2024-01-15T10:00:00Z",
      "metadata": {}
    }
  }
}
```

## Wallet Management

### Generate Wallet
```http
POST /api/wallets/generate
```

**Response:**
```json
{
  "success": true,
  "data": {
    "wallet": {
      "address": "0x...",
      "privateKey": "0x...",
      "mnemonic": "word1 word2 word3 ..."
    }
  }
}
```

### Get Wallet Balance
```http
GET /api/wallets/:address/balance
```

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x...",
    "balance": "1.5",
    "currency": "ETH"
  }
}
```

## Health Check

### System Health
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:00:00Z",
    "services": {
      "database": "connected",
      "blockchain": "connected",
      "s3": "connected"
    },
    "version": "1.0.0"
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_ERROR`: Authentication required
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `BLOCKCHAIN_ERROR`: Blockchain operation failed
- `DATABASE_ERROR`: Database operation failed
- `FILE_ERROR`: File operation failed
- `RATE_LIMIT_ERROR`: Rate limit exceeded
- `INTERNAL_ERROR`: Internal server error

## Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per minute
- **File Upload**: 10 requests per minute

## Pagination

List endpoints support pagination:

```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Filtering and Sorting

Many endpoints support filtering and sorting:

**Query Parameters:**
- `sort`: Field to sort by (e.g., `createdAt`, `-createdAt` for descending)
- `filter`: JSON object with filter criteria
- `search`: Text search across relevant fields

**Example:**
```
GET /api/batches?sort=-createdAt&filter={"status":"CREATED"}&search=aspirin
```

## WebSocket Events

Real-time updates are available via WebSocket:

**Connection:** `ws://localhost:3000/ws`

**Events:**
- `batch.created`: New batch created
- `batch.updated`: Batch status updated
- `batch.transferred`: Batch ownership transferred
- `compliance.added`: New compliance record added
- `transaction.confirmed`: Blockchain transaction confirmed

**Example:**
```javascript
const ws = new WebSocket('ws://localhost:3000/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.type, data.payload);
};
```