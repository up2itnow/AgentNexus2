# AgentNexus Architecture

## System Overview

AgentNexus is a decentralized marketplace for AI agents built on Base L2, featuring a modern web application architecture with smart contract integration and Docker-based agent execution.

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│              Next.js 14 + React + TailwindCSS               │
│                  wagmi + RainbowKit                         │
└───────────────────┬─────────────────────────────────────────┘
                    │ HTTP/WebSocket
┌───────────────────▼─────────────────────────────────────────┐
│                         Backend                              │
│              Node.js + Express + Prisma                     │
│                  PostgreSQL + Redis                         │
└───────┬───────────────────────┬─────────────────────────────┘
        │                       │
        │ JSON-RPC             │ Docker API
        │                       │
┌───────▼──────┐       ┌────────▼──────────────────────────┐
│   Base L2    │       │      Agent Runtime                │
│ Smart        │       │  Docker Containers                │
│ Contracts    │       │  (Isolated Execution)             │
└──────────────┘       └───────────────────────────────────┘
```

## Component Architecture

### 1. Frontend Layer

**Technology Stack:**
- Next.js 14 (App Router)
- React 18 + TypeScript
- TailwindCSS + CSS Variables
- wagmi + viem (Ethereum interaction)
- RainbowKit (Wallet UI)
- SWR (Data fetching)

**Key Features:**
- Server-side rendering (SSR)
- Client-side routing
- Responsive design (mobile-first)
- Dark mode support
- Real-time updates via polling

**Component Structure:**
```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Marketplace page
│   ├── agents/[id]/       # Agent detail
│   └── profile/           # User profile
├── components/
│   ├── agents/            # Agent-related components
│   ├── execution/         # Execution interface
│   ├── profile/           # Profile components
│   └── layout/            # Layout components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configs
├── providers/             # Context providers
└── types/                 # TypeScript definitions
```

### 2. Backend Layer

**Technology Stack:**
- Node.js 20 + Express
- Prisma ORM
- PostgreSQL (primary database)
- Redis (caching & queues)
- Docker (agent execution)

**Architecture Pattern:** Service-Oriented Architecture (SOA)

**Services:**

**AgentService**
- Agent CRUD operations
- Search and discovery
- Metadata management
- Stats aggregation

**WalletService**
- ERC-4337 account abstraction
- Smart wallet creation
- User operation handling
- Gas estimation

**ExecutionService**
- Docker container orchestration
- Resource management
- Security isolation
- Log streaming
- Result storage

**Service Structure:**
```
backend/src/
├── index.ts              # Express server
├── routes/               # API route definitions
├── services/             # Business logic
│   ├── AgentService.ts
│   ├── WalletService.ts
│   └── ExecutionService.ts
├── types/                # Type definitions
├── utils/                # Helper functions
└── prisma/               # Database schema
```

### 3. Smart Contract Layer

**Technology Stack:**
- Solidity 0.8.24
- Foundry (testing & deployment)
- OpenZeppelin Contracts v5
- Base L2 (deployment target)

**Contracts:**

**AgentNexusEscrow.sol**
```solidity
// Core Functions
- depositPayment()    // Escrow ETH payment
- releasePayment()    // Release to creator
- refundPayment()     // Refund expired payment
- setPlatformFee()    // Update platform fee
```

**AgentNexusEntitlements.sol**
```solidity
// Core Functions
- mintToken()         // Mint access token
- hasValidToken()     // Check user access
- setTokenExpiry()    // Set expiration
- setTokenURI()       // Update metadata
```

**Security Measures:**
- ReentrancyGuard on all state-changing functions
- Access control (Ownable)
- Input validation
- SafeERC20 for transfers
- Comprehensive testing

### 4. Database Layer

**PostgreSQL Schema:**

```prisma
model User {
  id              String      @id @default(cuid())
  walletAddress   String?     @unique
  walletType      String?
  email           String?     @unique
  username        String?     @unique
  purchases       Purchase[]
  executions      Execution[]
  createdAgents   Agent[]     @relation("AgentCreator")
}

model Agent {
  id              String      @id @default(cuid())
  name            String
  description     String
  category        AgentCategory
  status          AgentStatus
  price           String      // BigInt as string
  version         String
  dockerImage     String
  creatorId       String
  creator         User        @relation("AgentCreator")
  purchases       Purchase[]
  executions      Execution[]
}

model Purchase {
  id              String      @id @default(cuid())
  userId          String
  user            User        @relation(fields: [userId])
  agentId         String
  agent           Agent       @relation(fields: [agentId])
  transactionHash String
  price           String
  purchasedAt     DateTime    @default(now())
}

model Execution {
  id              String      @id @default(cuid())
  userId          String
  user            User        @relation(fields: [userId])
  agentId         String
  agent           Agent       @relation(fields: [agentId])
  purchaseId      String?
  status          ExecutionStatus
  inputData       Json
  outputData      Json?
  logs            String?
  errorMessage    String?
  startTime       DateTime    @default(now())
  endTime         DateTime?
  duration        Int?
}
```

**Indexes:**
- `walletAddress` (unique)
- `agentId` + `userId`
- `status` + `createdAt`
- `category` + `status`

**Extensions:**
- `pgvector` - For semantic search (future)

### 5. Agent Runtime

**Docker-Based Execution:**

```yaml
# Container Configuration
Image: agent-runtime:latest
Memory: 512MB
CPU: 0.5 cores
Network: bridge (restricted)
Timeout: 5 minutes
User: non-root
Filesystem: read-only
```

**Security Isolation:**
- Separate container per execution
- Resource limits enforced
- Network access restricted
- No host filesystem access
- Automatic cleanup

**Execution Flow:**
```
1. Receive execution request
2. Validate user entitlement
3. Pull agent Docker image
4. Create isolated container
5. Stream logs in real-time
6. Capture output
7. Cleanup container
8. Store results
```

## Data Flow

### Purchase Flow

```
User → Frontend → RainbowKit
                     ↓
              Wallet Signature
                     ↓
           Smart Contract (Escrow)
                     ↓
            Transaction Confirmed
                     ↓
           Backend Webhook
                     ↓
      Mint ERC-1155 Token (Entitlements)
                     ↓
            Update Database
                     ↓
         User Can Execute Agent
```

### Execution Flow

```
User → Frontend → Backend API
                     ↓
              Validate Entitlement
                     ↓
            Create Execution Record
                     ↓
         Spawn Docker Container
                     ↓
         Execute Agent Code
                     ↓
         Stream Logs (Real-time)
                     ↓
            Capture Output
                     ↓
        Update Execution Status
                     ↓
      Return Results to User
```

## Scalability Considerations

### Horizontal Scaling

**Frontend:**
- Static asset CDN
- Edge caching
- Multiple deployment regions

**Backend:**
- Stateless API servers
- Load balancer (Round-robin)
- Redis for shared state

**Database:**
- Read replicas
- Connection pooling
- Query optimization

**Agent Runtime:**
- Kubernetes for orchestration
- Auto-scaling based on queue depth
- Distributed container scheduling

### Caching Strategy

**Redis Layers:**
- L1: Agent metadata (5 min TTL)
- L2: User data (1 min TTL)
- L3: Execution logs (30 sec TTL)

**SWR (Stale-While-Revalidate):**
- Instant UI updates
- Background revalidation
- Optimistic updates

## Security Architecture

### Authentication & Authorization

**Wallet-Based Auth:**
1. User connects wallet (RainbowKit)
2. Sign message challenge
3. Backend verifies signature
4. Issue JWT token
5. Token included in API requests

**Access Control:**
- Public: Browse agents
- Authenticated: Purchase & execute
- Creator: Manage own agents
- Admin: Platform management

### Smart Contract Security

**Auditing:**
- Slither static analysis
- Manual review
- Test coverage: 100%

**Best Practices:**
- Checks-Effects-Interactions pattern
- ReentrancyGuard
- SafeMath (built into Solidity 0.8+)
- Input validation

### API Security

**Rate Limiting:**
- IP-based limits
- User-based limits
- Endpoint-specific limits

**Input Validation:**
- Zod schemas
- Sanitization
- Type checking

## Monitoring & Observability

### Metrics

**Frontend:**
- Page load time
- Time to interactive
- Core Web Vitals

**Backend:**
- Request latency
- Error rate
- Throughput

**Smart Contracts:**
- Gas usage
- Transaction success rate
- Contract calls

### Logging

**Structured Logging:**
```json
{
  "timestamp": "2025-01-01T00:00:00Z",
  "level": "info",
  "service": "backend",
  "message": "Execution started",
  "executionId": "exec123",
  "userId": "user123"
}
```

**Log Aggregation:**
- Centralized logging (e.g., Datadog)
- Log retention: 30 days
- Search and analytics

### Alerting

**Alert Rules:**
- Error rate > 1%
- Latency > 1s (p95)
- Container failure rate > 5%
- Smart contract revert rate > 2%

## Deployment Architecture

### Environments

**Development:**
- Local PostgreSQL
- Local Redis
- Base Sepolia testnet

**Staging:**
- Managed PostgreSQL (AWS RDS)
- Managed Redis (AWS ElastiCache)
- Base Sepolia testnet

**Production:**
- Managed PostgreSQL (Multi-AZ)
- Managed Redis (Cluster mode)
- Base L2 mainnet

### CI/CD Pipeline

```
1. Push to GitHub
2. Run tests (Jest, Foundry)
3. Build Docker images
4. Push to registry
5. Deploy to staging
6. Run E2E tests
7. Deploy to production (manual approval)
```

## Technology Decisions

### Why Base L2?

- Low transaction fees
- Fast confirmations (~2 seconds)
- EVM compatibility
- Growing ecosystem
- Coinbase backing

### Why Next.js?

- React framework with SSR
- App Router for modern patterns
- Great developer experience
- Built-in optimization

### Why Prisma?

- Type-safe database access
- Excellent TypeScript integration
- Migration management
- Query optimization

### Why Docker?

- Consistent execution environment
- Security isolation
- Resource management
- Easy deployment

## Future Architecture

### Planned Improvements

**Multi-Chain Support:**
- Abstract chain-specific logic
- Unified contract interface
- Cross-chain messaging

**Decentralized Storage:**
- IPFS for agent metadata
- Arweave for permanent storage

**Advanced Execution:**
- WebAssembly runtime
- GPU support
- Distributed execution

**Real-Time Features:**
- WebSocket for live updates
- Server-sent events for logs
- GraphQL subscriptions

