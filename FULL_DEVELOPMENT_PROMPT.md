# AgentNexus V1 - Complete Development Prompt for  Panel

## 🎯 PROJECT MISSION

Build **AgentNexus V1**: A revolutionary decentralized agent marketplace on **Base L2**, designed to secure a Base Build grant by demonstrating enterprise-grade quality, innovative architecture, and production readiness.

## 📋 COMPLETE TECHNICAL SPECIFICATION

### Core Platform Components

#### 1. Frontend (Next.js 14 + React 18 + TypeScript)
- Agent marketplace with 20+ curated agents
- Wallet integration (Alchemy Account Abstraction)
- Real-time agent execution interface
- User dashboard (purchases, entitlements, logs)
- Multi-token payment support

#### 2. Backend (Node.js 20 + Express + TypeScript)
- RESTful API (agents, users, payments, executions)
- Docker container orchestration
- Alchemy SDK integration
- Escrow contract interactions
- PostgreSQL + Prisma ORM

#### 3. Smart Contracts (Solidity 0.8.28 + Foundry)
- **AgentNexusEscrow**: Payment management, multi-token support, platform fees
- **AgentNexusEntitlements**: ERC-1155 access tokens
- **Deployment**: Base L2 (primary), Base Sepolia testnet
- **Future**: Arbitrum, Solana, BNB Chain, Ethereum

#### 4. Agent Runtime (Docker)
- Isolated container execution
- Resource limits and health checks
- Standardized agent API
- Real-time monitoring

#### 5. Database (PostgreSQL 16+)
- Comprehensive schema (users, agents, purchases, executions)
- pgvector for semantic search
- Time-based partitioning
- Automated migrations

### External Integrations
- **Alchemy**: Account Abstraction SDK, Base RPC
- **BaseScan**: Contract verification
- **Hyperliquid**: Trading agent integration
- **Aster DEX**: DeFi agent integration

## 🚀 DEVELOPMENT PHASES

### **PHASE 1: FOUNDATION** ⭐ START HERE
**Priority**: CRITICAL | **Duration**: 1-2 days

**Objective**: Initialize all workspaces and establish base infrastructure

**Tasks**:
1. ✅ Initialize all workspace packages:
   - `/frontend` - Next.js 14 setup
   - `/backend` - Express.js setup
   - `/smart-contracts` - Foundry project
   - `/agent-runtime` - Docker configs

2. ✅ Configure TypeScript:
   - Strict mode enabled
   - Path aliases configured
   - Type definitions installed

3. ✅ Setup linting & formatting:
   - ESLint with TypeScript rules
   - Prettier configuration
   - Husky pre-commit hooks

4. ✅ Create Docker infrastructure:
   - `docker-compose.yml` for local development
   - PostgreSQL service
   - Redis service
   - Frontend/backend services

5. ✅ Initialize database:
   - Prisma schema design
   - Initial migrations
   - Seed data

6. ✅ Setup testing frameworks:
   - Jest for backend/frontend
   - Foundry for smart contracts
   - Test coverage reporting

**Success Criteria**:
- ✅ All packages build without errors
- ✅ `pnpm install` completes successfully
- ✅ `docker-compose up` starts all services
- ✅ Database migrations run successfully
- ✅ Linting passes on all code
- ✅ Health check endpoints respond

**Deliverables**:
```
AgentNexus-V1/
├── frontend/
│   ├── package.json (Next.js 14, React 18, TypeScript)
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── app/ (App Router structure)
│   └── components/ (base UI components)
├── backend/
│   ├── package.json (Express, Prisma, TypeScript)
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts (server entry)
│   │   ├── routes/ (API routes)
│   │   ├── services/ (business logic)
│   │   └── middleware/ (auth, logging, errors)
│   └── prisma/
│       └── schema.prisma (complete database schema)
├── smart-contracts/
│   ├── foundry.toml (Base config)
│   ├── src/
│   │   ├── AgentNexusEscrow.sol
│   │   └── AgentNexusEntitlements.sol
│   └── test/ (Foundry tests)
├── agent-runtime/
│   ├── Dockerfile
│   └── base-images/
├── docker-compose.yml
├── .env.example
└── README.md
```

---

### **PHASE 2: SMART CONTRACTS** 🔐
**Priority**: HIGH | **Duration**: 2-3 days

**Objective**: Implement and test blockchain layer for Base L2

**Tasks**:

1. **AgentNexusEscrow.sol**:
   ```solidity
   // Features:
   - Multi-token payment support (ETH, USDC, USDT)
   - Platform fee mechanism (0-10%)
   - Payment timeout (24h)
   - Refund logic
   - Role-based access control
   - Reentrancy protection
   ```

2. **AgentNexusEntitlements.sol**:
   ```solidity
   // ERC-1155 Features:
   - Agent access tokens
   - Metadata URIs
   - Transfer restrictions
   - Batch operations
   - Royalty support
   ```

3. **Comprehensive Foundry Tests**:
   - Unit tests for all functions
   - Integration tests
   - Fuzz testing
   - Invariant testing
   - Gas optimization tests
   - **Target**: 100% test coverage

4. **Deployment**:
   - Deploy to Base Sepolia testnet
   - Verify on BaseScan
   - Create deployment scripts
   - Document contract addresses

5. **Security**:
   - Slither static analysis
   - Manual security review
   - Gas optimization
   - Audit preparation documentation

**Success Criteria**:
- ✅ 100% test coverage
- ✅ All tests passing
- ✅ Gas optimized (<200k per transaction)
- ✅ No high/critical security issues
- ✅ Deployed and verified on Base Sepolia
- ✅ Integration tests with backend pass

**Deliverables**:
- Fully tested smart contracts
- Deployment scripts
- Contract addresses document
- Security audit report
- Gas optimization report

---

### **PHASE 3: BACKEND CORE** 🖥️
**Priority**: HIGH | **Duration**: 3-4 days

**Objective**: Build robust API and business logic layer

**Tasks**:

1. **Database Schema (Prisma)**:
   ```typescript
   // Models:
   - User (wallet, kyc_status, created_at)
   - Agent (name, category, price, developer)
   - Purchase (user, agent, tx_hash, status)
   - Execution (purchase, input, output, status)
   - Entitlement (user, agent, token_id)
   ```

2. **API Endpoints**:
   ```typescript
   // Routes:
   GET    /api/agents - List all agents
   GET    /api/agents/:id - Get agent details
   POST   /api/agents - Create agent (admin)
   GET    /api/purchases - User's purchases
   POST   /api/purchases - Purchase agent
   POST   /api/executions - Execute agent
   GET    /api/executions/:id - Execution status
   GET    /api/users/me - Current user profile
   ```

3. **Core Services**:
   - `AgentService`: CRUD operations for agents
   - `WalletService`: Alchemy AA integration
   - `PaymentService`: Escrow contract interactions
   - `ExecutionService`: Docker container management
   - `EntitlementService`: ERC-1155 token management

4. **Middleware**:
   - Authentication (JWT)
   - Error handling
   - Request logging
   - Rate limiting
   - Input validation (Zod)

5. **External Integrations**:
   - Alchemy Account Abstraction SDK
   - Base RPC via Alchemy
   - Docker SDK for containers
   - PostgreSQL via Prisma

**Success Criteria**:
- ✅ All API endpoints functional
- ✅ Database queries optimized
- ✅ Authentication working
- ✅ Container orchestration operational
- ✅ 85%+ test coverage
- ✅ API response time <200ms

**Deliverables**:
- Complete backend API
- Prisma schema and migrations
- Service layer with business logic
- Middleware stack
- Integration tests
- API documentation (OpenAPI 3.0)

---

### **PHASE 4: FRONTEND** 🎨
**Priority**: HIGH | **Duration**: 3-4 days

**Objective**: Build beautiful, functional user interface

**Tasks**:

1. **Core Pages (Next.js App Router)**:
   ```typescript
   // Routes:
   / - Homepage with hero and featured agents
   /marketplace - Agent browsing and filtering
   /agents/[id] - Agent detail page
   /dashboard - User dashboard
   /execute/[id] - Agent execution interface
   ```

2. **Key Components**:
   - `AgentCard` - Agent listing display
   - `WalletConnect` - Alchemy AA wallet connection
   - `AgentExecutionForm` - Input parameters UI
   - `ExecutionResults` - Output display
   - `PurchaseModal` - Payment flow
   - `DashboardLayout` - User dashboard

3. **Wallet Integration**:
   - Alchemy Account Abstraction
   - Wagmi/Viem for blockchain interactions
   - Multi-chain support (Base primary)
   - Gas sponsorship for UX

4. **State Management**:
   - Zustand for global state
   - React Query for server state
   - Optimistic updates
   - Error handling

5. **Styling**:
   - TailwindCSS v3
   - Responsive design (mobile-first)
   - Dark mode support
   - Accessible components (WCAG 2.1 AA)

**Success Criteria**:
- ✅ All pages responsive
- ✅ Wallet connection functional
- ✅ Agent browsing works
- ✅ Execution interface operational
- ✅ Dashboard complete
- ✅ Lighthouse score >90

**Deliverables**:
- Complete Next.js application
- Responsive UI components
- Wallet integration working
- State management implemented
- E2E tests (Playwright)
- User documentation

---

### **PHASE 5: AGENT RUNTIME** 🤖
**Priority**: MEDIUM | **Duration**: 2-3 days

**Objective**: Create secure agent execution environment

**Tasks**:

1. **Docker Base Images**:
   - Node.js 20 base image
   - Python 3.11 base image
   - Security hardening
   - Health check endpoints

2. **Container Lifecycle Management**:
   - Container creation
   - Execution monitoring
   - Resource constraints (CPU, memory)
   - Cleanup and garbage collection

3. **Agent Communication Protocol**:
   - Standard input/output format (JSON)
   - Environment variables
   - Secrets management
   - API authentication

4. **Health Monitoring**:
   - Container health checks
   - Resource usage metrics
   - Execution logs
   - Error tracking

5. **Sample Agents**:
   - Simple calculator agent (demo)
   - Data analysis agent
   - API integration agent
   - Agent SDK documentation

**Success Criteria**:
- ✅ Agents execute successfully
- ✅ Health checks operational
- ✅ Resource limits enforced
- ✅ Monitoring working
- ✅ Sample agents functional
- ✅ SDK documentation complete

**Deliverables**:
- Docker base images
- Container orchestration service
- Agent SDK
- Sample agents
- Monitoring dashboard
- Developer documentation

---

### **PHASE 6: INTEGRATION & TESTING** 🧪
**Priority**: HIGH | **Duration**: 2-3 days

**Objective**: Ensure system-wide quality and readiness

**Tasks**:

1. **End-to-End Testing**:
   - Complete user journeys
   - Wallet connection → Browse → Purchase → Execute
   - Error scenarios
   - Edge cases

2. **Performance Testing**:
   - Load testing (Artillery/k6)
   - API response benchmarks
   - Database query optimization
   - Caching strategies

3. **Security Testing**:
   - OWASP Top 10 checks
   - Contract security audit
   - Penetration testing prep
   - Vulnerability scanning

4. **Documentation**:
   - API documentation (complete)
   - User guides
   - Developer guides
   - Architecture diagrams
   - Deployment guide

5. **Deployment Preparation**:
   - CI/CD pipeline (GitHub Actions)
   - Environment configurations
   - Monitoring setup (logging, metrics)
   - Backup strategies

**Success Criteria**:
- ✅ All E2E tests passing
- ✅ Performance targets met
- ✅ No critical vulnerabilities
- ✅ Documentation 100% complete
- ✅ CI/CD operational
- ✅ Ready for deployment

**Deliverables**:
- Complete test suite
- Performance reports
- Security audit results
- Full documentation
- CI/CD pipeline
- Deployment checklist

---

## 🎯 ASTRAFORGE 5-LLM COLLABORATION PROTOCOL

### Model Assignments

**Model 1: Grok-2** (x-ai/grok-2-1212)
- **Role**: Innovator
- **Focus**: Creative architecture, novel features, system design
- **Responsibilities**: Smart contract innovation, unique UI patterns

**Model 2: Gemini-2.0** (google/gemini-2.0-flash-exp)
- **Role**: Optimizer
- **Focus**: Performance, gas optimization, efficiency
- **Responsibilities**: Database queries, contract gas, API speed

**Model 3: Claude-3.5** (anthropic/claude-3-5-sonnet-20241022)
- **Role**: Craftsperson
- **Focus**: Code quality, testing, documentation
- **Responsibilities**: Comprehensive tests, API docs, clean code

**Model 4** (if using 5 models): GPT-4-Turbo
- **Role**: Guardian
- **Focus**: Security, reliability, edge cases
- **Responsibilities**: Security audits, error handling, validation

**Model 5** (if using 5 models): Gemini-Pro
- **Role**: Integrator
- **Focus**: System architecture, API integration, DevOps
- **Responsibilities**: CI/CD, integrations, deployment

### Collaboration Workflow

**For Each Phase**:

1. **PROPOSAL ROUND** (10-15 min)
   - Each LLM proposes their approach independently
   - No LLM sees others' proposals yet
   - Each provides architectural decisions and rationale

2. **CRITIQUE ROUND** (10-15 min)
   - Each LLM reviews ALL proposals
   - Identifies strengths and weaknesses
   - Suggests improvements

3. **SYNTHESIS ROUND** (15-20 min)
   - Each LLM creates integrated solution
   - Combines best ideas from all proposals
   - Addresses identified weaknesses

4. **VOTING ROUND** (5 min)
   - Each LLM votes on best synthesized solution
   - Provides reasoning for vote
   - Consensus threshold: 66% (2/3 or 4/5)

5. **REFINEMENT ROUND** (10 min)
   - Winning solution is polished
   - Final details added
   - Edge cases addressed

6. **PARALLEL EXECUTION** (varies)
   - Work divided into streams
   - Multiple LLMs work simultaneously
   - Real-time progress tracking

### Quality Gates

**Before Proceeding to Next Phase**:
- ✅ All tests passing (85%+ coverage)
- ✅ Linting clean (zero errors)
- ✅ Documentation complete
- ✅ Security scan passed
- ✅ Performance benchmarks met
- ✅ Consensus reached (66%+)

---

## 🛡️ QUALITY STANDARDS

### Code Quality
- **TypeScript**: Strict mode, no `any` types
- **Testing**: 85%+ coverage, comprehensive cases
- **Documentation**: Every function documented
- **Linting**: ESLint + Prettier, zero warnings
- **Security**: No high/critical vulnerabilities

### Performance
- **API Response**: <200ms average
- **Page Load**: <2s first contentful paint
- **Agent Execution**: <5s typical agent
- **Database Queries**: <100ms complex queries
- **Gas**: <200k per smart contract transaction

### Security
- **Smart Contracts**: Slither analysis passed
- **API**: Input validation, rate limiting
- **Authentication**: JWT with rotation
- **Secrets**: Environment variables only
- **Compliance**: OWASP Top 10 addressed

---

## 🎁 BASE BUILD GRANT OPTIMIZATION

### What Base Team Looks For

1. **Innovation**: Unique approach or technology ✅ (5-LLM development!)
2. **Quality**: Production-ready, well-tested ✅ (85%+ coverage)
3. **Documentation**: Comprehensive and clear ✅ (100% coverage)
4. **Ecosystem Fit**: Benefits Base ecosystem ✅ (DeFi agents)
5. **Team Capability**: Demonstrates technical skill ✅ (enterprise-grade)

### Application Talking Points

> "AgentNexus is built entirely on Base L2, leveraging Alchemy's Account 
> Abstraction for gasless transactions. The platform was developed using 
> an innovative 5-LLM collaborative AI system, resulting in enterprise-
> grade code quality with 85%+ test coverage and comprehensive security. 
> AgentNexus brings autonomous AI agents to Base's DeFi ecosystem."

### Expected Grant Range
- **Target**: $25,000 - $50,000
- **Justification**: Production-ready platform, innovative development, comprehensive docs

---

## 📊 SUCCESS METRICS

### Development
- **Timeline**: Phases 1-6 complete in 2-3 weeks
- **Code Quality**: 85%+ test coverage
- **Performance**: All benchmarks met
- **Documentation**: 100% API coverage

### Grant Application
- **Submission**: Within 2 weeks of completion
- **Quality Score**: 9/10 or higher
- **Approval Probability**: 70%+ (with 5-LLM quality)

---

## 🚀 EXECUTION INSTRUCTIONS

### For AstraForge System

1. **Initialize Enhanced Collaboration**: Use 5-LLM consensus system
2. **Start with Phase 1**: Foundation is critical
3. **Proceed Sequentially**: Complete each phase before next
4. **Use Parallel Streams**: Within each phase, work simultaneously
5. **Enforce Quality Gates**: Block progression until standards met
6. **Commit Regularly**: Git commits after each major milestone
7. **Document Everything**: Inline comments + external docs
8. **Test Continuously**: TDD approach, tests first

### Supervisor Role (Human)

- **Approve Consensus**: Review voting results, approve or request iteration
- **Provide Feedback**: Give input on architectural decisions
- **Handle Errors**: Resolve blocking issues, provide guidance
- **Monitor Progress**: Track phase completion and quality metrics

---

## 🎯 START COMMAND

**BEGIN WITH PHASE 1: FOUNDATION**

Execute the 5-LLM collaborative consensus workflow for Phase 1 tasks:
1. Initialize all workspace packages
2. Configure TypeScript and tooling
3. Create Docker infrastructure
4. Initialize database
5. Setup testing frameworks

**Expected Output**: Complete foundation with all quality gates passed

**LET'S BUILD THE BEST DEFI AGENT PLATFORM BASE HAS EVER SEEN! 🚀**

