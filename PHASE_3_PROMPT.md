# Phase 3: Backend Core Services - Development Prompt

## 🎯 Objective

Build a robust Node.js/Express backend orchestrator with comprehensive API endpoints, service layer, and smart contract integration.

## 📋 Context

**Previous Phases**:
- ✅ Phase 1: Foundation complete (workspace, database schema, Docker)
- ✅ Phase 2: Smart contracts complete (46/46 tests passing, 94.93% coverage)

**Current Phase**: Phase 3 - Backend Core Services

## 🏗️ Architecture Requirements

### Technology Stack
- **Runtime**: Node.js 20.x with TypeScript
- **Framework**: Express.js 4.18.x
- **Database**: PostgreSQL 16 with Prisma ORM
- **Cache/Queue**: Redis 7 with Bull
- **Blockchain**: Viem 2.9.x for contract interactions
- **Authentication**: JWT-based
- **Logging**: Winston
- **Testing**: Jest with Supertest

### Backend Structure

```
backend/
├── src/
│   ├── index.ts                 ✅ (exists - basic server)
│   ├── controllers/             ⏳ (needs implementation)
│   │   ├── AgentController.ts
│   │   ├── PurchaseController.ts
│   │   ├── ExecutionController.ts
│   │   └── UserController.ts
│   ├── services/                ⏳ (needs implementation)
│   │   ├── AgentService.ts
│   │   ├── WalletService.ts     # Alchemy AA integration
│   │   ├── PaymentService.ts    # Escrow contract
│   │   ├── EntitlementService.ts # ERC-1155 contract
│   │   └── ExecutionService.ts  # Docker orchestration
│   ├── middleware/              ⏳ (needs implementation)
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── logger.ts
│   │   ├── rateLimiter.ts
│   │   └── validator.ts
│   ├── routes/                  ⏳ (needs implementation)
│   │   ├── agents.ts
│   │   ├── purchases.ts
│   │   ├── executions.ts
│   │   └── users.ts
│   ├── types/                   ⏳ (needs implementation)
│   │   └── index.ts
│   └── utils/                   ⏳ (needs implementation)
│       ├── blockchain.ts        # Viem client setup
│       └── helpers.ts
├── prisma/
│   └── schema.prisma            ✅ (exists - complete schema)
└── tests/                       ⏳ (needs implementation)
    ├── agents.test.ts
    ├── purchases.test.ts
    └── executions.test.ts
```

## 🔌 API Endpoints to Implement

### Agents API (`/api/agents`)

```typescript
GET    /api/agents              # List all active agents (with filters)
GET    /api/agents/:id          # Get agent details
POST   /api/agents              # Create agent (admin only)
PUT    /api/agents/:id          # Update agent (admin/developer)
DELETE /api/agents/:id          # Soft delete agent (admin)
GET    /api/agents/:id/stats    # Get agent execution statistics
```

### Purchases API (`/api/purchases`)

```typescript
GET    /api/purchases           # List user's purchases
GET    /api/purchases/:id       # Get purchase details
POST   /api/purchases           # Purchase agent (creates escrow payment)
```

### Executions API (`/api/executions`)

```typescript
GET    /api/executions          # List user's executions
GET    /api/executions/:id      # Get execution details
POST   /api/executions          # Execute agent (requires entitlement)
GET    /api/executions/:id/logs # Get execution logs
POST   /api/executions/:id/cancel # Cancel running execution
```

### Users API (`/api/users`)

```typescript
GET    /api/users/me            # Get current user profile
PUT    /api/users/me            # Update user profile
GET    /api/users/me/entitlements # Get user's agent entitlements
POST   /api/users/auth          # Authenticate with wallet signature
```

## 🔐 Smart Contract Integration

### Escrow Contract (Payment Management)

**Contract**: `AgentNexusEscrow.sol`  
**Deployed**: Base Sepolia (pending deployment)

**Functions to Integrate**:
```typescript
// In PaymentService.ts
async depositPayment(
  paymentId: string,
  agentId: number,
  amount: bigint,
  token: string
): Promise<TransactionReceipt>

async releasePayment(paymentId: string): Promise<TransactionReceipt>
async refundPayment(paymentId: string): Promise<TransactionReceipt>
```

### Entitlements Contract (Access Rights)

**Contract**: `AgentNexusEntitlements.sol`  
**Deployed**: Base Sepolia (pending deployment)

**Functions to Integrate**:
```typescript
// In EntitlementService.ts
async mintEntitlement(
  userAddress: string,
  agentId: number,
  amount: number
): Promise<TransactionReceipt>

async hasAccess(
  userAddress: string,
  agentId: number
): Promise<boolean>

async burnEntitlement(
  userAddress: string,
  agentId: number
): Promise<TransactionReceipt>
```

## 🔧 Service Layer Implementation

### 1. AgentService

**Purpose**: CRUD operations for agents

**Key Methods**:
```typescript
class AgentService {
  async listAgents(filters: AgentFilters): Promise<Agent[]>
  async getAgentById(id: string): Promise<Agent | null>
  async createAgent(data: CreateAgentDto): Promise<Agent>
  async updateAgent(id: string, data: UpdateAgentDto): Promise<Agent>
  async deleteAgent(id: string): Promise<void>
  async getAgentStats(id: string): Promise<AgentStats>
}
```

### 2. WalletService (Alchemy AA Integration)

**Purpose**: Account Abstraction with Alchemy SDK

**Key Methods**:
```typescript
class WalletService {
  async createSmartAccount(ownerAddress: string): Promise<SmartAccount>
  async getSmartAccountAddress(ownerAddress: string): Promise<string>
  async sendUserOperation(params: UserOperationParams): Promise<string>
  async sponsorUserOperation(userOp: UserOperation): Promise<UserOperation>
}
```

**Alchemy Dependencies**:
```typescript
import { AlchemyProvider } from "@alchemy/aa-alchemy";
import { LocalAccountSigner, type SmartAccountSigner } from "@alchemy/aa-core";
```

### 3. PaymentService (Escrow Integration)

**Purpose**: Handle payment flows with smart contracts

**Key Methods**:
```typescript
class PaymentService {
  async initiatePurchase(
    userId: string,
    agentId: string,
    token: string
  ): Promise<Purchase>
  
  async confirmPayment(purchaseId: string, txHash: string): Promise<Purchase>
  async releasePayment(purchaseId: string): Promise<void>
  async refundPayment(purchaseId: string): Promise<void>
  async verifyPayment(txHash: string): Promise<boolean>
}
```

### 4. EntitlementService (ERC-1155 Integration)

**Purpose**: Manage agent access rights

**Key Methods**:
```typescript
class EntitlementService {
  async grantAccess(userId: string, agentId: string): Promise<Entitlement>
  async checkAccess(userId: string, agentId: string): Promise<boolean>
  async revokeAccess(userId: string, agentId: string): Promise<void>
  async getUserEntitlements(userId: string): Promise<Entitlement[]>
}
```

### 5. ExecutionService (Docker Integration)

**Purpose**: Execute agents in isolated Docker containers

**Key Methods**:
```typescript
class ExecutionService {
  async executeAgent(
    userId: string,
    agentId: string,
    input: Record<string, any>
  ): Promise<Execution>
  
  async getExecutionStatus(executionId: string): Promise<ExecutionStatus>
  async getExecutionLogs(executionId: string): Promise<string>
  async cancelExecution(executionId: string): Promise<void>
  async cleanupContainer(containerId: string): Promise<void>
}
```

**Docker Integration**:
```typescript
import Docker from 'dockerode';

const docker = new Docker();

// Create container
const container = await docker.createContainer({
  Image: agent.dockerImage,
  Env: [`INPUT=${JSON.stringify(input)}`],
  HostConfig: {
    Memory: 512 * 1024 * 1024, // 512MB
    CpuQuota: 50000,
    NetworkMode: 'none' // Isolated network
  }
});
```

## 🔒 Middleware Implementation

### 1. Authentication Middleware

```typescript
// middleware/auth.ts
export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await prisma.user.findUnique({ 
      where: { id: payload.userId } 
    });
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### 2. Rate Limiting

```typescript
// middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests, please try again later'
});

export const executionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 executions per hour
  message: 'Execution limit reached'
});
```

### 3. Request Validation

```typescript
// middleware/validator.ts
import { z } from 'zod';

export const validateBody = (schema: z.ZodSchema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
  };
};
```

### 4. Error Handler

```typescript
// middleware/errorHandler.ts
export const errorHandler = (err, req, res, next) => {
  logger.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
};
```

## 📝 Validation Schemas (Zod)

```typescript
// types/index.ts
import { z } from 'zod';

export const CreateAgentSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  category: z.enum(['TRADING', 'ANALYTICS', 'DEFI', 'NFT', 'SOCIAL', 'UTILITY']),
  price: z.string().regex(/^\d+(\.\d+)?$/),
  priceToken: z.string(),
  dockerImage: z.string(),
  inputSchema: z.record(z.any()),
  outputSchema: z.record(z.any())
});

export const ExecuteAgentSchema = z.object({
  agentId: z.string().cuid(),
  input: z.record(z.any())
});

export const PurchaseAgentSchema = z.object({
  agentId: z.string().cuid(),
  token: z.string().startsWith('0x')
});
```

## 🧪 Testing Requirements

### Unit Tests (Jest)

**Target**: 85%+ coverage

```typescript
// tests/agents.test.ts
describe('AgentService', () => {
  it('should list all active agents', async () => {
    const agents = await agentService.listAgents({});
    expect(agents).toBeInstanceOf(Array);
  });
  
  it('should create new agent', async () => {
    const agent = await agentService.createAgent(validAgentData);
    expect(agent.id).toBeDefined();
  });
  
  it('should reject invalid agent data', async () => {
    await expect(
      agentService.createAgent(invalidData)
    ).rejects.toThrow();
  });
});
```

### Integration Tests (Supertest)

```typescript
// tests/api/agents.test.ts
describe('GET /api/agents', () => {
  it('should return list of agents', async () => {
    const response = await request(app)
      .get('/api/agents')
      .expect(200);
    
    expect(response.body).toHaveProperty('agents');
    expect(response.body.agents).toBeInstanceOf(Array);
  });
  
  it('should require authentication for POST', async () => {
    await request(app)
      .post('/api/agents')
      .send(validAgentData)
      .expect(401);
  });
});
```

## 🔐 Environment Variables

**Required in `.env`**:

```bash
# Server
PORT=8200
NODE_ENV=development

# Database
DATABASE_URL=postgresql://agentnexus:development@localhost:5432/agentnexus

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRY=7d

# Blockchain
BASE_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
ESCROW_CONTRACT_ADDRESS=0x... # From Phase 2 deployment
ENTITLEMENTS_CONTRACT_ADDRESS=0x... # From Phase 2 deployment
DEPLOYER_PRIVATE_KEY=0x... # For backend transactions

# Alchemy Account Abstraction
ALCHEMY_API_KEY=your_alchemy_key
ALCHEMY_GAS_POLICY_ID=your_gas_policy_id

# Docker
DOCKER_HOST=unix:///var/run/docker.sock
```

## ✅ Success Criteria

### Functionality
- ✅ All API endpoints operational
- ✅ Smart contract integration working
- ✅ Alchemy AA wallet creation functional
- ✅ Docker agent execution working
- ✅ Database queries optimized (<100ms)

### Quality
- ✅ 85%+ test coverage
- ✅ All tests passing
- ✅ API response time <200ms (95th percentile)
- ✅ Zero critical linting errors
- ✅ Comprehensive error handling

### Documentation
- ✅ OpenAPI 3.0 specification
- ✅ Inline code comments
- ✅ API usage examples
- ✅ Environment setup guide

## 🚀 Implementation Strategy

### Parallel Development Streams (5-LLM Collaboration)

**Stream A** (Grok-2 - Innovator):
- Creative API design patterns
- Novel error handling approaches
- Innovative caching strategies

**Stream B** (Gemini-2.0 - Optimizer):
- Database query optimization
- API performance tuning
- Gas-efficient contract calls

**Stream C** (Claude-3.5 - Craftsperson):
- Comprehensive test suites
- API documentation
- Code quality and maintainability

**Stream D** (Model 4 - Guardian):
- Security middleware
- Input validation
- Authentication/authorization

**Stream E** (Model 5 - Integrator):
- Smart contract integration
- Alchemy AA setup
- Docker orchestration

### Consensus Required On:
1. API endpoint structure
2. Error handling strategy
3. Authentication approach
4. Payment flow design
5. Execution security model

## 📊 Expected Output

For Phase 3, deliver:

1. **Complete Backend API** - All endpoints functional
2. **Service Layer** - 5 services fully implemented
3. **Middleware Suite** - Auth, validation, rate limiting, errors
4. **Test Suite** - 85%+ coverage, all passing
5. **OpenAPI Documentation** - Complete API specification
6. **Integration Guide** - How to connect frontend

## 🎯 Begin Implementation

**Start with Service Layer**:
1. AgentService (CRUD for agents)
2. PaymentService (Escrow integration)
3. EntitlementService (ERC-1155 integration)
4. ExecutionService (Docker orchestration)
5. WalletService (Alchemy AA)

**Then Build API Layer**:
1. Routes (agents, purchases, executions, users)
2. Controllers (request handling)
3. Middleware (auth, validation, errors)
4. Tests (unit + integration)

**Let's build the best backend API Base has ever seen!** 🚀

