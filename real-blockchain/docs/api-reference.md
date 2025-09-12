# PharbitChain API Documentation

## Overview

PharbitChain provides a comprehensive RESTful API for interacting with the pharmaceutical blockchain platform. This document outlines all available endpoints, their parameters, and example responses.

## Authentication

All API requests require authentication using JSON Web Tokens (JWT). Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## API Endpoints

### Batch Management

#### Create Batch

```http
POST /api/batches
```

Create a new pharmaceutical batch with multi-signature authorization.

**Parameters:**

```json
{
  "product": "string",
  "quantity": "number",
  "manufacturer": "string",
  "manufacturingDate": "ISO8601 date",
  "expiryDate": "ISO8601 date",
  "temperature": {
    "min": "number",
    "max": "number"
  },
  "signers": ["string"]
}
```

**Response:**

```json
{
  "batchId": "string",
  "status": "pending",
  "transactionId": "string"
}
```

#### Verify Batch

```http
GET /api/batches/{batchId}/verify
```

Verify the authenticity and compliance of a batch.

**Response:**

```json
{
  "authentic": "boolean",
  "tempCompliance": "boolean",
  "locationTracking": "boolean",
  "validationResults": [
    {
      "check": "string",
      "passed": "boolean",
      "details": "object"
    }
  ]
}
```

### Supply Chain Tracking

#### Update Batch Location

```http
POST /api/batches/{batchId}/location
```

Update the current location and status of a batch.

**Parameters:**

```json
{
  "location": "string",
  "status": "string",
  "timestamp": "ISO8601 date"
}
```

#### Get Batch History

```http
GET /api/batches/{batchId}/history
```

Retrieve complete history of a batch including location, temperature, and handling.

### Temperature Monitoring

#### Add Temperature Reading

```http
POST /api/batches/{batchId}/temperature
```

Add a new temperature reading for a batch.

**Parameters:**

```json
{
  "temperature": "number",
  "timestamp": "ISO8601 date",
  "deviceId": "string"
}
```

#### Get Temperature History

```http
GET /api/batches/{batchId}/temperature
```

Retrieve temperature history for a batch.

### Multi-Signature Wallet

#### Create Wallet

```http
POST /api/wallets
```

Create a new multi-signature wallet.

**Parameters:**

```json
{
  "name": "string",
  "owners": ["string"],
  "requiredSignatures": "number",
  "policy": "string"
}
```

#### Create Transaction

```http
POST /api/wallets/{walletId}/transactions
```

Create a new multi-signature transaction.

**Parameters:**

```json
{
  "type": "string",
  "recipient": "string",
  "amount": "number",
  "metadata": "object"
}
```

#### Add Signature

```http
POST /api/transactions/{txId}/signatures
```

Add a signature to a pending transaction.

**Parameters:**

```json
{
  "signerId": "string",
  "signature": "string"
}
```

### Compliance and Reporting

#### Generate Compliance Report

```http
POST /api/compliance/reports
```

Generate a compliance report for specified criteria.

**Parameters:**

```json
{
  "type": "string",
  "startDate": "ISO8601 date",
  "endDate": "ISO8601 date",
  "criteria": ["string"]
}
```

#### Validate Compliance

```http
POST /api/compliance/validate
```

Validate compliance against specific regulations.

**Parameters:**

```json
{
  "regulation": "string",
  "data": "object"
}
```

### System Health

#### Get Health Status

```http
GET /api/health
```

Get current system health status including all components.

**Response:**

```json
{
  "status": "string",
  "components": {
    "blockchain": {
      "status": "string",
      "lastCheck": "ISO8601 date",
      "details": "object"
    },
    "database": {
      "status": "string",
      "lastCheck": "ISO8601 date",
      "details": "object"
    }
  },
  "metrics": {
    "system": "object",
    "performance": "object"
  }
}
```

#### Get System Metrics

```http
GET /api/metrics
```

Get detailed system performance metrics.

### Analytics

#### Get Dashboard Data

```http
GET /api/analytics/dashboard
```

Get consolidated dashboard data including metrics, alerts, and performance indicators.

#### Get Batch Analytics

```http
GET /api/analytics/batches
```

Get analytical data about batch processing and compliance.

## WebSocket API

Real-time updates are available through WebSocket connections:

```javascript
const ws = new WebSocket("ws://api.pharbitchain.com/ws");

ws.onmessage = function (event) {
  const data = JSON.parse(event.data);
  // Handle different event types
  switch (data.type) {
    case "TEMPERATURE_ALERT":
      // Handle temperature alert
      break;
    case "NEW_BATCH":
      // Handle new batch
      break;
    case "COMPLIANCE_UPDATE":
      // Handle compliance update
      break;
  }
};
```

## Error Handling

API errors follow a standard format:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object"
  }
}
```

Common error codes:

- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `500`: Internal Server Error

## Rate Limiting

API requests are rate-limited to 1000 requests per minute per API key. Rate limit headers are included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1632150000
```

## SDK Examples

### Node.js

```javascript
const PharbitChain = require("pharbitchain-sdk");

const client = new PharbitChain({
  apiKey: "your-api-key",
  environment: "production",
});

// Create a batch
const batch = await client.batches.create({
  product: "Test Medicine",
  quantity: 1000,
  manufacturer: "Test Labs",
});

// Monitor temperature
client.batches.onTemperatureAlert(batchId, (alert) => {
  console.log("Temperature violation:", alert);
});
```

### Python

```python
from pharbitchain import PharbitChain

client = PharbitChain(
    api_key='your-api-key',
    environment='production'
)

# Create a batch
batch = client.batches.create(
    product='Test Medicine',
    quantity=1000,
    manufacturer='Test Labs'
)

# Monitor temperature
def handle_temperature_alert(alert):
    print(f'Temperature violation: {alert}')

client.batches.on_temperature_alert(batch_id, handle_temperature_alert)
```

## Best Practices

1. **Pagination**: Use `limit` and `offset` parameters for listing endpoints
2. **Caching**: Cache responses using the provided `ETag` headers
3. **Compression**: Enable gzip compression for requests
4. **Batch Operations**: Use batch endpoints for multiple operations
5. **Webhooks**: Set up webhooks for asynchronous notifications

## Support

For API support, contact:

- Email: api-support@pharbitchain.com
- Documentation: https://docs.pharbitchain.com
- Status Page: https://status.pharbitchain.com
