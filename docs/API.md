# AgentNexus API Documentation

## Base URL

```
Development: http://localhost:3001/api
Production: https://api.agentnexus.io/api
```

## Authentication

Most endpoints require authentication via wallet signature or JWT token.

```http
Authorization: Bearer <your-jwt-token>
```

## Agents API

### List Agents

Get a paginated list of agents with optional filtering.

**Endpoint:** `GET /agents`

**Query Parameters:**
- `search` (string, optional) - Search by name or description
- `category` (string, optional) - Filter by category: `DATA_ANALYSIS`, `CONTENT_CREATION`, `AUTOMATION`, `TRADING`, `RESEARCH`, `OTHER`
- `minPrice` (number, optional) - Minimum price in wei
- `maxPrice` (number, optional) - Maximum price in wei
- `sortBy` (string, optional) - Sort by: `newest`, `popular`, `price_asc`, `price_desc`
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 20)

**Response:**
```json
{
  "agents": [
    {
      "id": "cm123abc",
      "name": "Trading Bot Alpha",
      "description": "Advanced trading algorithm for crypto markets",
      "category": "TRADING",
      "status": "PUBLISHED",
      "price": "1000000000000000000",
      "imageUrl": "https://...",
      "creatorId": "user123",
      "creatorAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "version": "1.0.0",
      "purchaseCount": 15,
      "executionCount": 342,
      "rating": 4.8,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

### Get Agent

Get detailed information about a specific agent.

**Endpoint:** `GET /agents/:id`

**Response:**
```json
{
  "id": "cm123abc",
  "name": "Trading Bot Alpha",
  "description": "Advanced trading algorithm...",
  "category": "TRADING",
  "status": "PUBLISHED",
  "price": "1000000000000000000",
  "imageUrl": "https://...",
  "creatorId": "user123",
  "creatorAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "version": "1.0.0",
  "purchaseCount": 15,
  "executionCount": 342,
  "rating": 4.8,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

### Create Agent

Create a new agent (requires authentication).

**Endpoint:** `POST /agents`

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "My Agent",
  "description": "Agent description",
  "category": "DATA_ANALYSIS",
  "price": "1000000000000000000",
  "version": "1.0.0",
  "imageUrl": "https://...",
  "dockerImage": "myagent:latest"
}
```

**Response:**
```json
{
  "id": "cm123abc",
  "name": "My Agent",
  "status": "DRAFT",
  ...
}
```

## Executions API

### Execute Agent

Start a new agent execution.

**Endpoint:** `POST /executions`

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "agentId": "cm123abc",
  "purchaseId": "purchase123",
  "inputData": {
    "query": "analyze market trends",
    "timeframe": "1d"
  }
}
```

**Response:**
```json
{
  "id": "exec123",
  "userId": "user123",
  "agentId": "cm123abc",
  "status": "PENDING",
  "inputData": { ... },
  "startTime": "2025-01-01T00:00:00Z",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

### Get Execution

Get execution status and details.

**Endpoint:** `GET /executions/:id`

**Response:**
```json
{
  "id": "exec123",
  "userId": "user123",
  "agentId": "cm123abc",
  "status": "COMPLETED",
  "inputData": { ... },
  "outputData": {
    "result": "Analysis complete",
    "data": [...]
  },
  "logs": "[INFO] Starting execution...",
  "startTime": "2025-01-01T00:00:00Z",
  "endTime": "2025-01-01T00:01:30Z",
  "duration": 90000,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:01:30Z"
}
```

### Get Execution Logs

Get real-time execution logs.

**Endpoint:** `GET /executions/:id/logs`

**Response:**
```json
{
  "logs": [
    {
      "timestamp": "2025-01-01T00:00:01Z",
      "level": "info",
      "message": "Starting execution..."
    },
    {
      "timestamp": "2025-01-01T00:00:05Z",
      "level": "info",
      "message": "Processing input data..."
    },
    {
      "timestamp": "2025-01-01T00:01:25Z",
      "level": "info",
      "message": "Execution completed successfully"
    }
  ]
}
```

### Cancel Execution

Cancel a running execution.

**Endpoint:** `POST /executions/:id/cancel`

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "exec123",
  "status": "CANCELLED",
  "message": "Execution cancelled successfully"
}
```

## Profile API

### Get User Purchases

Get all agents purchased by a user.

**Endpoint:** `GET /users/:userId/purchases`

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "purchase123",
    "agent": {
      "id": "cm123abc",
      "name": "Trading Bot Alpha",
      ...
    },
    "price": "1000000000000000000",
    "purchasedAt": "2025-01-01T00:00:00Z",
    "transactionHash": "0x123..."
  }
]
```

### Get User Executions

Get execution history for a user.

**Endpoint:** `GET /users/:userId/executions`

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "exec123",
    "agent": {
      "id": "cm123abc",
      "name": "Trading Bot Alpha",
      ...
    },
    "status": "COMPLETED",
    "duration": 90000,
    "createdAt": "2025-01-01T00:00:00Z"
  }
]
```

### Get User Stats

Get user statistics.

**Endpoint:** `GET /users/:userId/stats`

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalPurchases": 5,
  "totalExecutions": 42,
  "totalSpent": "5000000000000000000",
  "successRate": 95.2
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Anonymous**: 100 requests/hour
- **Authenticated**: 1000 requests/hour
- **Premium**: 10000 requests/hour

Rate limit headers:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1704067200
```

## Pagination

Paginated endpoints return:

```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "hasMore": true
}
```

## Webhooks

Configure webhooks to receive real-time updates:

**Events:**
- `execution.started`
- `execution.completed`
- `execution.failed`
- `purchase.created`

**Webhook Payload:**
```json
{
  "event": "execution.completed",
  "data": {
    "id": "exec123",
    "status": "COMPLETED",
    ...
  },
  "timestamp": "2025-01-01T00:00:00Z"
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { AgentNexusClient } from '@agentnexus/sdk';

const client = new AgentNexusClient({
  apiUrl: 'https://api.agentnexus.io',
  apiKey: 'your-api-key'
});

// List agents
const agents = await client.agents.list({
  category: 'TRADING',
  sortBy: 'popular'
});

// Execute agent
const execution = await client.executions.create({
  agentId: 'cm123abc',
  inputData: { query: 'analyze market' }
});

// Poll for completion
const result = await execution.waitForCompletion();
```

### Python

```python
from agentnexus import Client

client = Client(
    api_url="https://api.agentnexus.io",
    api_key="your-api-key"
)

# List agents
agents = client.agents.list(
    category="TRADING",
    sort_by="popular"
)

# Execute agent
execution = client.executions.create(
    agent_id="cm123abc",
    input_data={"query": "analyze market"}
)

# Wait for completion
result = execution.wait_for_completion()
```

## Support

For API support:
- Email: api@agentnexus.io
- Discord: https://discord.gg/agentnexus
- Documentation: https://docs.agentnexus.io

