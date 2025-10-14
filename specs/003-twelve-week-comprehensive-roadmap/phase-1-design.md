# Phase 1: Design & Smart Contracts

**Feature:** 003-twelve-week-comprehensive-roadmap
**Date:** October 14, 2025
**Status:** COMPLETE - All Design Objectives Addressed

## Executive Summary

Phase 1 design establishes the technical foundation for AgentNexus V1 completion:

1. **Database Schema Enhancement** - Extend Prisma schema with 7 new models
2. **ERC-4337 Smart Contract Extensions** - Account factory, paymaster, session keys
3. **Agent Publishing API** - REST API for agent CRUD operations
4. **Grant Tracking System** - Milestone and reporting automation
5. **Advanced AA Features** - Session keys, social recovery, multi-device sync
6. **Phase 1 Agent Specifications** - Trading Bot, DeFi Assistant, NFT Curator

All designs include security considerations, performance targets, testing strategies, and deployment plans.

---

## DO-1: Database Schema Enhancement

### Design Objective
Extend Prisma schema with new models for AgentNexus V1: DeveloperProfile, EnterpriseProfile, A2APipeline, Grant, Partnership, and Metric tracking.

### Enhanced Data Model

#### New Models Added

**DeveloperProfile Model:**
```prisma
model DeveloperProfile {
  id                String   @id @default(cuid())
  userId            String   @unique @map("user_id")
  publishedAgents   String[] @default([]) @map("published_agents")
  totalRevenue      Decimal  @default(0) @db.Decimal(36, 18) @map("total_revenue")
  monthlyRevenue    Decimal  @default(0) @db.Decimal(36, 18) @map("monthly_revenue")
  waitlistPosition  Int?     @map("waitlist_position")
  acceleratorParticipant Boolean @default(false) @map("accelerator_participant")
  hackathonWinner   Boolean  @default(false) @map("hackathon_winner")
  githubHandle      String?  @map("github_handle")
  twitterHandle     String?  @map("twitter_handle")
  website           String?  @map("website")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("developer_profiles")
  @@index([userId])
  @@index([waitlistPosition])
}
```

**EnterpriseProfile Model:**
```prisma
model EnterpriseProfile {
  id                String   @id @default(cuid())
  userId            String   @unique @map("user_id")
  companyName       String   @map("company_name")
  contractValue     Decimal  @default(0) @db.Decimal(36, 18) @map("contract_value")
  privateAgents     String[] @default([]) @map("private_agents")
  customIntegrations String[] @default([]) @map("custom_integrations")
  slaLevel          String   @default("STANDARD") @map("sla_level")
  dedicatedSupport  Boolean  @default(false) @map("dedicated_support")
  apiKeyLimit       Int      @default(100) @map("api_key_limit")
  customDomain      String?  @map("custom_domain")
  whitelabelEnabled Boolean  @default(false) @map("whitelabel_enabled")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("enterprise_profiles")
  @@index([userId])
}
```

**A2APipeline Model:**
```prisma
model A2APipeline {
  id                String   @id @default(cuid())
  userId            String   @map("user_id")
  name              String   @map("name")
  agents            Json     @map("agents") // Array of A2APipelineStep
  totalCost         Decimal  @db.Decimal(36, 18) @map("total_cost")
  revenueShare      Int      @default(3000) @map("revenue_share") // Basis points
  status            PipelineStatus @default(DRAFT) @map("status")
  executionHistory  Json     @default("[]") @map("execution_history")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("a2a_pipelines")
  @@index([userId])
  @@index([status])
}

enum PipelineStatus {
  DRAFT
  ACTIVE
  EXECUTING
  COMPLETED
  FAILED
  CANCELLED
}
```

**Grant Model:**
```prisma
model Grant {
  id                String   @id @default(cuid())
  grantingOrganization String @map("granting_organization")
  amount            Decimal  @db.Decimal(36, 18) @map("amount")
  currency          String   @default("USD") @map("currency")
  status            GrantStatus @default(APPLIED) @map("status")
  applicationDate   DateTime @map("application_date")
  decisionDate      DateTime? @map("decision_date")
  disbursementDate  DateTime? @map("disbursement_date")
  milestones        Json     @default("[]") @map("milestones") // Array of GrantMilestone
  reportingRequirements String? @map("reporting_requirements")
  publicAnnouncement Boolean @default(false) @map("public_announcement")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  @@map("grants")
  @@index([status])
  @@index([grantingOrganization])
}

enum GrantStatus {
  APPLIED
  UNDER_REVIEW
  APPROVED
  REJECTED
  DISBURSED
  COMPLETED
}
```

**Partnership Model:**
```prisma
model Partnership {
  id                String   @id @default(cuid())
  partnerName       String   @map("partner_name")
  partnerType       PartnerType @map("partner_type")
  integrationStatus IntegrationStatus @default(DISCUSSION) @map("integration_status")
  integrationDate   DateTime? @map("integration_date")
  valueProposition  String?  @map("value_proposition")
  kpiTargets        Json     @default("{}") @map("kpi_targets")
  contactPerson     String?  @map("contact_person")
  contractUrl       String?  @map("contract_url")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  @@map("partnerships")
  @@index([partnerType])
  @@index([integrationStatus])
}

enum PartnerType {
  DEFI_PROTOCOL
  INFRASTRUCTURE
  MEDIA
  ECOSYSTEM
  ENTERPRISE
}

enum IntegrationStatus {
  DISCUSSION
  LOI_SIGNED
  IN_DEVELOPMENT
  LIVE
  PAUSED
}
```

**Metric Model:**
```prisma
model Metric {
  id                String   @id @default(cuid())
  metricType        MetricType @map("metric_type")
  value             Decimal  @db.Decimal(36, 18) @map("value")
  week              Int      @map("week")
  phase             Int      @map("phase")
  targetValue       Decimal  @db.Decimal(36, 18) @map("target_value")
  percentOfTarget   Decimal  @db.Decimal(5, 4) @map("percent_of_target")
  recordedAt        DateTime @default(now()) @map("recorded_at")

  @@map("metrics")
  @@index([metricType])
  @@index([week])
  @@index([phase])
  @@index([recordedAt])
}

enum MetricType {
  USER_COUNT
  AGENT_COUNT
  TRANSACTION_VOLUME
  REVENUE
  DEVELOPER_COUNT
  NPS_SCORE
  RETENTION_RATE
  GRANT_FUNDING
  MEDIA_MENTIONS
  PARTNERSHIP_COUNT
}
```

### Enhanced User Model Relations

**Updated User Model:**
```prisma
model User {
  // ... existing fields ...
  agentZeroInstances    AgentZeroInstance[]
  agentZeroExecutions   AgentZeroExecution[]

  // NEW: Enhanced relationships for V1
  developerProfile      DeveloperProfile?
  enterpriseProfile     EnterpriseProfile?
  a2aPipelines          A2APipeline[]
  grants                Grant[]

  @@map("users")
  // ... existing indexes ...
}
```

### Migration Strategy

**Migration Plan:**
1. **Schema Changes:** Add 6 new models and enhance User model
2. **Data Migration:** No existing data to migrate (new models)
3. **Performance Impact:** New indexes added for query optimization
4. **Rollback Plan:** Schema changes are additive, can be rolled back

**Migration SQL Preview:**
```sql
-- Add new models
CREATE TABLE developer_profiles (...);
CREATE TABLE enterprise_profiles (...);
CREATE TABLE a2a_pipelines (...);
CREATE TABLE grants (...);
CREATE TABLE partnerships (...);
CREATE TABLE metrics (...);

-- Add new indexes
CREATE INDEX idx_developer_profiles_user_id ON developer_profiles(user_id);
CREATE INDEX idx_enterprise_profiles_user_id ON enterprise_profiles(user_id);
CREATE INDEX idx_a2a_pipelines_user_id ON a2a_pipelines(user_id);
CREATE INDEX idx_grants_status ON grants(status);
CREATE INDEX idx_metrics_metric_type ON metrics(metric_type);
```

### Security Considerations

**Access Control:**
- **Developer Profiles:** Only accessible by profile owner or admins
- **Enterprise Data:** Restricted to enterprise users and admins
- **Grant Information:** Public for approved grants, private for applications
- **Metrics:** Internal use only, not exposed to users

**Data Validation:**
- **Decimal Fields:** Proper scaling for currency amounts
- **Enum Values:** Strict validation of status values
- **JSON Fields:** Schema validation for complex data structures

### Performance Targets

**Query Performance:**
- **User Profile Queries:** <100ms response time
- **Metrics Aggregation:** <500ms for dashboard queries
- **Pipeline Lookups:** <200ms for A2A operations
- **Grant Status Checks:** <50ms for milestone verification

**Scalability Targets:**
- **Concurrent Users:** 1,000 simultaneous dashboard loads
- **Metrics Ingestion:** 10,000 events/second during peak usage
- **Database Size:** Support 100M+ metric records
- **Backup/Restore:** <4 hours for full database recovery

---

## DO-2: ERC-4337 Smart Contract Extensions

### Design Objective
Design smart contract extensions for ERC-4337 Account Abstraction: account factory, paymaster, session key manager, and multi-chain account registry.

### Account Factory Contract

#### Contract Specification
```solidity
// AgentNexusAccountFactory.sol
contract AgentNexusAccountFactory {
    address public immutable accountImplementation;
    address public immutable entryPoint;
    address public immutable paymaster;

    mapping(bytes32 => address) public accounts;
    mapping(address => bytes32) public accountSalts;

    event AccountCreated(
        address indexed account,
        bytes32 indexed salt,
        address indexed owner
    );

    constructor(
        address _accountImplementation,
        address _entryPoint,
        address _paymaster
    ) {
        accountImplementation = _accountImplementation;
        entryPoint = _entryPoint;
        paymaster = _paymaster;
    }

    function createAccount(
        address owner,
        bytes32 salt
    ) external returns (address account) {
        bytes32 accountSalt = keccak256(abi.encodePacked(owner, salt));

        // Check if account already exists
        account = accounts[accountSalt];
        if (account != address(0)) {
            return account;
        }

        // Deploy new account using CREATE2
        bytes memory bytecode = abi.encodePacked(
            type(AgentNexusAccount).creationCode,
            abi.encode(entryPoint, owner)
        );

        bytes32 accountBytecodeHash = keccak256(bytecode);
        account = Create2.deploy(0, accountSalt, bytecode);

        // Store account information
        accounts[accountSalt] = account;
        accountSalts[account] = accountSalt;

        // Fund account for initial transactions
        payable(account).transfer(0.01 ether);

        emit AccountCreated(account, accountSalt, owner);
    }

    function getAccountAddress(
        address owner,
        bytes32 salt
    ) external view returns (address) {
        bytes32 accountSalt = keccak256(abi.encodePacked(owner, salt));
        return accounts[accountSalt];
    }
}
```

#### Account Implementation Contract
```solidity
// AgentNexusAccount.sol
contract AgentNexusAccount is ERC4337Account {
    address public immutable factory;
    address public owner;

    constructor(address _entryPoint, address _owner) ERC4337Account(_entryPoint) {
        factory = msg.sender;
        owner = _owner;
    }

    function _validateSignature(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override returns (uint256 validationData) {
        // Verify signature using owner's key
        bytes32 hash = userOpHash.toEthSignedMessageHash();
        address recovered = hash.recover(userOp.signature);

        if (recovered == owner) {
            return 0; // Valid signature
        } else {
            return 1; // Invalid signature
        }
    }

    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external onlyOwner {
        (bool success, bytes memory result) = target.call{value: value}(data);
        require(success, "Execution failed");

        emit AccountExecuted(target, value, data, result);
    }

    modifier onlyOwner() {
        require(msg.sender == owner || msg.sender == address(this), "Not owner");
        _;
    }
}
```

### Paymaster Contract

#### Sponsorship Paymaster
```solidity
// SponsorshipPaymaster.sol
contract SponsorshipPaymaster is BasePaymaster {
    mapping(address => bool) public sponsoredUsers;
    mapping(address => uint256) public userSponsorshipLimits;
    address public admin;

    event UserSponsored(address indexed user, uint256 limit);
    event SponsorshipUsed(address indexed user, uint256 amount);

    constructor(address _entryPoint) BasePaymaster(_entryPoint) {
        admin = msg.sender;
    }

    function sponsorUser(
        address user,
        uint256 limit
    ) external onlyAdmin {
        sponsoredUsers[user] = true;
        userSponsorshipLimits[user] = limit;

        emit UserSponsored(user, limit);
    }

    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) internal override returns (bytes memory context, uint256 validationData) {
        require(sponsoredUsers[userOp.sender], "User not sponsored");

        uint256 gasCost = maxCost * tx.gasprice;
        require(userSponsorshipLimits[userOp.sender] >= gasCost, "Sponsorship limit exceeded");

        // Deduct from user's sponsorship limit
        userSponsorshipLimits[userOp.sender] -= gasCost;

        emit SponsorshipUsed(userOp.sender, gasCost);

        return ("", 0);
    }

    function _postOp(
        IPaymaster.PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost
    ) internal override {
        // No post-op logic needed for sponsorship
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }
}
```

#### Token Paymaster (Alternative)
```solidity
// TokenPaymaster.sol
contract TokenPaymaster is BasePaymaster {
    IERC20 public token;
    uint256 public exchangeRate; // Token per ETH (18 decimals)

    mapping(address => uint256) public userTokenBalances;

    event TokenDeposited(address indexed user, uint256 amount);
    event GasPaid(address indexed user, uint256 tokenAmount, uint256 gasCost);

    constructor(
        address _entryPoint,
        address _token,
        uint256 _exchangeRate
    ) BasePaymaster(_entryPoint) {
        token = IERC20(_token);
        exchangeRate = _exchangeRate;
    }

    function depositTokens(uint256 amount) external {
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        userTokenBalances[msg.sender] += amount;

        emit TokenDeposited(msg.sender, amount);
    }

    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) internal override returns (bytes memory context, uint256 validationData) {
        uint256 gasCost = maxCost * tx.gasprice;
        uint256 tokenCost = (gasCost * exchangeRate) / 1e18;

        require(userTokenBalances[userOp.sender] >= tokenCost, "Insufficient token balance");

        // Deduct tokens
        userTokenBalances[userOp.sender] -= tokenCost;

        emit GasPaid(userOp.sender, tokenCost, gasCost);

        return ("", 0);
    }
}
```

### Session Key Manager Contract

#### Session Key Implementation
```solidity
// SessionKeyManager.sol
contract SessionKeyManager {
    struct Session {
        address sessionKey;
        address[] allowedTargets;
        uint256 validUntil;
        bytes4[] allowedMethods;
        uint256 nonce;
        bool active;
    }

    mapping(address => mapping(address => Session)) public sessions;

    event SessionCreated(
        address indexed account,
        address indexed sessionKey,
        uint256 validUntil
    );

    event SessionUsed(
        address indexed account,
        address indexed sessionKey,
        address target,
        bytes4 method
    );

    function createSession(
        address sessionKey,
        address[] calldata targets,
        uint256 validFor,
        bytes4[] calldata methods
    ) external {
        Session storage session = sessions[msg.sender][sessionKey];
        session.sessionKey = sessionKey;
        session.allowedTargets = targets;
        session.validUntil = block.timestamp + validFor;
        session.allowedMethods = methods;
        session.nonce = 0;
        session.active = true;

        emit SessionCreated(msg.sender, sessionKey, session.validUntil);
    }

    function executeWithSession(
        address target,
        bytes calldata data,
        address sessionKey
    ) external returns (bytes memory result) {
        Session storage session = sessions[msg.sender][sessionKey];

        require(session.active, "Session not active");
        require(block.timestamp <= session.validUntil, "Session expired");
        require(isAllowedTarget(target, session), "Target not allowed");
        require(isAllowedMethod(data, session), "Method not allowed");

        // Execute transaction via session key
        (bool success, bytes memory returndata) = target.call(data);
        require(success, "Transaction failed");

        session.nonce++;

        emit SessionUsed(msg.sender, sessionKey, target, bytes4(data));

        return returndata;
    }

    function revokeSession(address sessionKey) external {
        sessions[msg.sender][sessionKey].active = false;
    }

    function isAllowedTarget(address target, Session storage session) internal view returns (bool) {
        for (uint i = 0; i < session.allowedTargets.length; i++) {
            if (session.allowedTargets[i] == target) {
                return true;
            }
        }
        return false;
    }

    function isAllowedMethod(bytes calldata data, Session storage session) internal view returns (bool) {
        bytes4 method = bytes4(data[:4]);

        for (uint i = 0; i < session.allowedMethods.length; i++) {
            if (session.allowedMethods[i] == method) {
                return true;
            }
        }
        return false;
    }
}
```

### Multi-Chain Account Registry

#### Cross-Chain Account Management
```solidity
// MultiChainAccountRegistry.sol
contract MultiChainAccountRegistry {
    mapping(uint256 => mapping(bytes32 => address)) public accounts; // chainId => salt => account
    mapping(address => uint256[]) public userChains; // account => chains deployed on
    mapping(address => bytes32) public accountSalts; // account => original salt

    event AccountDeployed(
        uint256 indexed chainId,
        address indexed account,
        bytes32 indexed salt,
        address owner
    );

    function registerAccount(
        uint256 chainId,
        address account,
        bytes32 salt,
        address owner
    ) external {
        accounts[chainId][salt] = account;
        accountSalts[account] = salt;

        // Track which chains user has accounts on
        if (!hasChain(userChains[owner], chainId)) {
            userChains[owner].push(chainId);
        }

        emit AccountDeployed(chainId, account, salt, owner);
    }

    function getAccount(
        uint256 chainId,
        bytes32 salt
    ) external view returns (address) {
        return accounts[chainId][salt];
    }

    function getUserChains(address owner) external view returns (uint256[] memory) {
        return userChains[owner];
    }

    function hasChain(uint256[] memory chains, uint256 chainId) internal pure returns (bool) {
        for (uint i = 0; i < chains.length; i++) {
            if (chains[i] == chainId) {
                return true;
            }
        }
        return false;
    }
}
```

### Security Considerations

**Account Factory Security:**
- **CREATE2 Determinism:** Predictable account addresses for UX
- **Salt Verification:** Prevent account hijacking via salt manipulation
- **Access Control:** Only factory can register accounts

**Paymaster Security:**
- **Sponsorship Limits:** Prevent unlimited spending
- **Admin Controls:** Centralized sponsorship management
- **Gas Price Validation:** Prevent manipulation via gas price spikes

**Session Key Security:**
- **Time-Based Expiry:** Automatic session invalidation
- **Method Restrictions:** Limited execution scope
- **Revocation:** Immediate session termination capability

### Deployment Strategy

**Contract Deployment Order:**
1. **Account Implementation** - Base account contract
2. **Account Factory** - Factory for creating accounts
3. **Paymaster** - Gas sponsorship contract
4. **Session Key Manager** - Session management
5. **Multi-Chain Registry** - Cross-chain account tracking

**Deployment Configuration:**
```typescript
// Deployment script
const deployments = {
    accountImplementation: await deploy("AgentNexusAccount"),
    accountFactory: await deploy("AgentNexusAccountFactory", {
        args: [accountImplementation.address, entryPoint, paymaster]
    }),
    paymaster: await deploy("SponsorshipPaymaster", {
        args: [entryPoint]
    }),
    sessionManager: await deploy("SessionKeyManager"),
    registry: await deploy("MultiChainAccountRegistry")
};
```

### Performance Targets

**Gas Efficiency:**
- **Account Creation:** <150,000 gas
- **Transaction Execution:** <50,000 gas (bundled)
- **Paymaster Validation:** <30,000 gas
- **Session Key Usage:** <25,000 gas

**Scalability:**
- **Concurrent Users:** Support 1,000 simultaneous account creations
- **Transaction Throughput:** 100 transactions/second
- **Contract Size:** Keep each contract under 24KB for gas efficiency

---

## DO-2.1: Security CI and Supply Chain Hardening (Addendum)

### Static Analysis and Tests
- Integrate Slither and Foundry tests into CI for all Solidity contracts
- Enforce coverage thresholds and gas benchmarks for PR merge

### Container Supply Chain
- Sign all agent images using `cosign`
- Generate SBOMs using `syft` and publish them with releases
- Gate production deployments on signed images + SBOM presence

### Documentation
- Add SECURITY.md describing reporting process and scope
- Include threat models and security assumptions per contract

---

## DO-3: Agent Publishing API

### Design Objective
Design REST API for agent CRUD operations, Docker image management, versioning, analytics tracking, and marketplace integration.

### API Specification

#### Core Endpoints

**Agent Management:**
```typescript
// GET /api/agents - List all published agents
GET /api/agents
Query: ?category=DEFI&chain=8453&limit=20&offset=0
Response: {
  agents: AgentSummary[],
  total: number,
  hasMore: boolean
}

// GET /api/agents/:id - Get agent details
GET /api/agents/:id
Response: AgentDetails

// POST /api/agents - Publish new agent
POST /api/agents
Body: {
  name: string,
  description: string,
  category: AgentCategory,
  price: number,
  dockerImage: string,
  config: AgentConfig,
  tags: string[]
}
Response: { agentId: string }

// PUT /api/agents/:id - Update agent
PUT /api/agents/:id
Body: Partial<AgentUpdate>
Response: AgentDetails

// DELETE /api/agents/:id - Deprecate agent
DELETE /api/agents/:id
Response: { success: boolean }
```

**Docker Image Management:**
```typescript
// POST /api/agents/:id/images - Upload Docker image
POST /api/agents/:id/images
Content-Type: multipart/form-data
Body: dockerImage file
Response: { imageId: string, imageUrl: string }

// GET /api/agents/:id/images - List agent images
GET /api/agents/:id/images
Response: {
  images: DockerImageInfo[],
  currentVersion: string
}

// POST /api/agents/:id/deploy - Deploy agent to environment
POST /api/agents/:id/deploy
Body: {
  environment: 'staging' | 'production',
  version?: string,
  config?: Record<string, any>
}
Response: {
  deploymentId: string,
  status: 'deploying' | 'success' | 'failed',
  url?: string
}
```

**Version Management:**
```typescript
// GET /api/agents/:id/versions - List agent versions
GET /api/agents/:id/versions
Response: {
  versions: AgentVersion[],
  latest: string
}

// POST /api/agents/:id/versions - Create new version
POST /api/agents/:id/versions
Body: {
  version: string,
  changelog: string,
  dockerImage: string
}
Response: AgentVersion

// POST /api/agents/:id/rollback - Rollback to previous version
POST /api/agents/:id/rollback
Body: { targetVersion: string }
Response: { success: boolean, newVersion: string }
```

**Analytics & Monitoring:**
```typescript
// GET /api/agents/:id/analytics - Get agent analytics
GET /api/agents/:id/analytics
Query: ?period=7d&metrics=executions,revenue,users
Response: {
  period: string,
  metrics: {
    executions: { total: number, daily: number[] },
    revenue: { total: number, daily: number[] },
    users: { total: number, daily: number[] },
    performance: {
      avgExecutionTime: number,
      successRate: number,
      errorRate: number
    }
  }
}

// GET /api/agents/:id/executions - Get recent executions
GET /api/agents/:id/executions
Query: ?limit=50&status=success
Response: {
  executions: AgentExecution[],
  total: number
}
```

### Data Models

#### Agent Types
```typescript
interface AgentSummary {
    id: string;
    name: string;
    description: string;
    category: AgentCategory;
    price: number;
    rating: number;
    totalExecutions: number;
    uniqueUsers: number;
    lastExecuted: Date;
    tags: string[];
    publisher: {
        id: string;
        name: string;
        avatar?: string;
    };
    status: 'active' | 'deprecated' | 'draft';
}

interface AgentDetails extends AgentSummary {
    dockerImage: string;
    config: AgentConfig;
    versions: AgentVersion[];
    integrations: string[];
    revenueShare: number;
    createdAt: Date;
    updatedAt: Date;
}

interface AgentVersion {
    version: string;
    dockerImage: string;
    changelog: string;
    createdAt: Date;
    isActive: boolean;
    executionCount: number;
}

interface DockerImageInfo {
    id: string;
    tag: string;
    size: number;
    createdAt: Date;
    status: 'building' | 'ready' | 'failed';
}
```

#### Agent Categories
```typescript
enum AgentCategory {
    GENERAL = 'GENERAL',
    CRYPTO = 'CRYPTO',
    DEFI = 'DEFI',
    NFT = 'NFT',
    TRADING = 'TRADING',
    ANALYTICS = 'ANALYTICS',
    SOCIAL = 'SOCIAL',
    PRODUCTIVITY = 'PRODUCTIVITY'
}
```

### Error Handling

#### Standard Error Response
```typescript
interface APIError {
    error: {
        code: string;
        message: string;
        details?: Record<string, any>;
    };
    timestamp: Date;
    requestId: string;
}

enum ErrorCode {
    AGENT_NOT_FOUND = 'AGENT_NOT_FOUND',
    INVALID_DOCKER_IMAGE = 'INVALID_DOCKER_IMAGE',
    DEPLOYMENT_FAILED = 'DEPLOYMENT_FAILED',
    INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    INVALID_VERSION = 'INVALID_VERSION'
}
```

### Rate Limiting Strategy

#### API Rate Limits
```typescript
// Rate limit configuration per endpoint
const rateLimits = {
    // Public endpoints (read-only)
    'GET /api/agents': { requests: 1000, window: 60000 }, // 1000/min
    'GET /api/agents/:id': { requests: 500, window: 60000 }, // 500/min

    // Authenticated endpoints (write operations)
    'POST /api/agents': { requests: 10, window: 60000 }, // 10/min
    'PUT /api/agents/:id': { requests: 20, window: 60000 }, // 20/min
    'DELETE /api/agents/:id': { requests: 5, window: 60000 }, // 5/min

    // Docker operations (resource intensive)
    'POST /api/agents/:id/images': { requests: 5, window: 60000 }, // 5/min
    'POST /api/agents/:id/deploy': { requests: 3, window: 60000 }, // 3/min
};
```

### Security Considerations

**Authentication:**
- **API Keys:** JWT tokens for developer authentication
- **Scopes:** Read-only vs. write access based on permissions
- **Rate Limiting:** Tier-based limits (free, pro, enterprise)

**Docker Security:**
- **Image Scanning:** Automated vulnerability scanning
- **Sandboxing:** Container isolation and resource limits
- **Access Control:** Private registry for unpublished agents

**Data Protection:**
- **Encryption:** Sensitive config data encrypted at rest
- **Audit Logging:** All API operations logged for compliance
- **Input Validation:** Strict validation of all inputs

### Performance Targets

**API Response Times:**
- **List Agents:** <200ms (cached)
- **Get Agent Details:** <100ms
- **Create Agent:** <2s (including validation)
- **Deploy Agent:** <30s (async operation)

**Scalability:**
- **Concurrent Requests:** 1,000 simultaneous API calls
- **Docker Registry:** Support 10,000+ images
- **Analytics Queries:** <500ms for dashboard data

---

## DO-5.1: Open-Source Commitment (Addendum)

- **License:** Apache-2.0 for A2A protocol and SDKs (TS/Python)
- **RFC Process:** Week 9 public RFC published (GitHub Discussions), Week 10–11 feedback incorporation, Week 12 release
- **Repository Layout:**
  - `agentnexus/a2a-protocol` – contracts, spec, examples
  - `agentnexus/sdk-ts` – TypeScript SDK
  - `agentnexus/sdk-py` – Python SDK
- **Project Docs:** CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md

## DO-4: Grant Tracking System

### Design Objective
Design automated grant application workflow, milestone tracking, and reporting system for Base Ecosystem Fund and other grants.

### System Architecture

#### Grant Workflow States
```typescript
enum GrantStatus {
    DRAFT = 'DRAFT',
    SUBMITTED = 'SUBMITTED',
    UNDER_REVIEW = 'UNDER_REVIEW',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    DISBURSED = 'DISBURSED',
    REPORTING = 'REPORTING',
    COMPLETED = 'COMPLETED'
}

interface Grant {
    id: string;
    title: string;
    organization: string;
    amount: number;
    currency: string;
    status: GrantStatus;
    applicationDate: Date;
    decisionDate?: Date;
    disbursementDate?: Date;
    milestones: GrantMilestone[];
    reportingRequirements: string[];
    documents: GrantDocument[];
    createdAt: Date;
    updatedAt: Date;
}
```

#### Milestone Tracking System
```typescript
interface GrantMilestone {
    id: string;
    grantId: string;
    title: string;
    description: string;
    dueDate: Date;
    status: MilestoneStatus;
    completionDate?: Date;
    evidence: string[];
    automatedChecks: AutomatedCheck[];
}

enum MilestoneStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    OVERDUE = 'OVERDUE'
}

interface AutomatedCheck {
    type: 'METRIC_TARGET' | 'DEPLOYMENT_STATUS' | 'USER_COUNT' | 'VOLUME_TARGET';
    target: any;
    current?: any;
    status: 'PASS' | 'FAIL' | 'PENDING';
}
```

### API Endpoints

#### Grant Management
```typescript
// GET /api/grants - List grants
GET /api/grants
Query: ?status=APPROVED&organization=base-ecosystem-fund
Response: {
    grants: Grant[],
    total: number
}

// POST /api/grants - Create grant application
POST /api/grants
Body: {
    title: string,
    organization: string,
    amount: number,
    applicationData: GrantApplicationData
}
Response: { grantId: string }

// PUT /api/grants/:id - Update grant
PUT /api/grants/:id
Body: Partial<GrantUpdate>
Response: Grant

// GET /api/grants/:id/milestones - Get milestones
GET /api/grants/:id/milestones
Response: GrantMilestone[]

// POST /api/grants/:id/milestones/:milestoneId/complete
POST /api/grants/:id/milestones/:milestoneId/complete
Body: { evidence: string[] }
Response: { success: boolean }
```

#### Automated Milestone Checking
```typescript
// POST /api/grants/:id/check-milestones - Run automated checks
POST /api/grants/:id/check-milestones
Response: {
    grantId: string,
    checkedAt: Date,
    results: {
        milestoneId: string,
        status: MilestoneStatus,
        automatedChecks: AutomatedCheck[]
    }[]
}
```

#### Reporting System
```typescript
// GET /api/grants/:id/reports - Generate milestone report
GET /api/grants/:id/reports
Query: ?milestoneId=optional&format=pdf
Response: {
    reportId: string,
    downloadUrl: string,
    generatedAt: Date
}

// POST /api/grants/:id/reports - Submit milestone report
POST /api/grants/:id/reports
Content-Type: multipart/form-data
Body: report file + metadata
Response: { reportId: string }
```

### Automated Milestone Verification

#### Metric-Based Checks
```typescript
// MetricVerificationService.ts
export class MetricVerificationService {
    async verifyAgentCount(target: number, week?: number): Promise<AutomatedCheck> {
        const currentCount = await this.agentService.getPublishedAgentCount(week);
        return {
            type: 'METRIC_TARGET',
            target,
            current: currentCount,
            status: currentCount >= target ? 'PASS' : 'FAIL'
        };
    }

    async verifyUserCount(target: number, week?: number): Promise<AutomatedCheck> {
        const currentCount = await this.userService.getActiveUserCount(week);
        return {
            type: 'METRIC_TARGET',
            target,
            current: currentCount,
            status: currentCount >= target ? 'PASS' : 'FAIL'
        };
    }

    async verifyVolume(target: number, week?: number): Promise<AutomatedCheck> {
        const currentVolume = await this.analyticsService.getWeeklyVolume(week);
        return {
            type: 'METRIC_TARGET',
            target,
            current: currentVolume,
            status: currentVolume >= target ? 'PASS' : 'FAIL'
        };
    }
}
```

#### Deployment Status Checks
```typescript
// DeploymentVerificationService.ts
export class DeploymentVerificationService {
    async verifyAADeployment(): Promise<AutomatedCheck> {
        const deployed = await this.contractService.isAAContractsDeployed();
        return {
            type: 'DEPLOYMENT_STATUS',
            target: true,
            current: deployed,
            status: deployed ? 'PASS' : 'FAIL'
        };
    }

    async verifyAgentDeployment(agentId: string): Promise<AutomatedCheck> {
        const deployed = await this.agentService.isAgentDeployed(agentId);
        return {
            type: 'DEPLOYMENT_STATUS',
            target: true,
            current: deployed,
            status: deployed ? 'PASS' : 'FAIL'
        };
    }
}
```

### Report Generation

#### Automated Report Templates
```typescript
// ReportGenerator.ts
export class ReportGenerator {
    async generateMilestoneReport(
        grantId: string,
        milestoneId: string,
        format: 'pdf' | 'html' = 'pdf'
    ): Promise<string> {
        // Gather milestone data
        const milestone = await this.grantService.getMilestone(grantId, milestoneId);
        const automatedChecks = await this.verificationService.runAutomatedChecks(milestone);
        const manualEvidence = await this.evidenceService.getEvidence(milestoneId);

        // Generate report content
        const reportData = {
            grant: await this.grantService.getGrant(grantId),
            milestone,
            automatedChecks,
            manualEvidence,
            generatedAt: new Date(),
            week: this.getCurrentWeek()
        };

        // Generate PDF or HTML
        if (format === 'pdf') {
            return await this.pdfGenerator.generate(reportData);
        } else {
            return await this.htmlGenerator.generate(reportData);
        }
    }
}
```

### Notification System

#### Automated Notifications
```typescript
// GrantNotificationService.ts
export class GrantNotificationService {
    async sendMilestoneReminder(milestoneId: string): Promise<void> {
        const milestone = await this.grantService.getMilestone(milestoneId);

        if (this.isMilestoneOverdue(milestone)) {
            await this.emailService.send({
                to: milestone.assignedTo,
                subject: `Milestone Overdue: ${milestone.title}`,
                template: 'milestone-overdue',
                data: { milestone }
            });
        }
    }

    async sendApprovalNotification(grantId: string): Promise<void> {
        const grant = await this.grantService.getGrant(grantId);

        await this.emailService.send({
            to: grant.applicant,
            subject: `Grant Approved: ${grant.title}`,
            template: 'grant-approved',
            data: { grant }
        });
    }
}
```

### Security Considerations

**Access Control:**
- **Grant Applications:** Only admins can view all applications
- **Milestone Evidence:** Restricted to assigned users
- **Financial Data:** Encrypted and access-logged

**Data Integrity:**
- **Automated Checks:** Cryptographic verification of metrics
- **Evidence Storage:** Immutable storage with timestamps
- **Audit Trail:** Complete history of all grant operations

### Performance Targets

**System Performance:**
- **Milestone Checks:** <2s per check
- **Report Generation:** <10s for PDF reports
- **Dashboard Loading:** <500ms for grant overview

**Scalability:**
- **Concurrent Checks:** 100 simultaneous milestone verifications
- **Report Generation:** 50 concurrent report generations
- **Data Storage:** Support 10,000+ milestone records

---

## DO-5: Advanced AA Features

### Design Objective
Design advanced Account Abstraction features: session keys, social recovery, multi-device sync, and transaction batching.

### Session Key Implementation

#### Session Key Architecture
```solidity
// AdvancedSessionKeyManager.sol
contract AdvancedSessionKeyManager {
    struct AdvancedSession {
        address sessionKey;
        address[] allowedTargets;
        uint256 validUntil;
        bytes4[] allowedMethods;
        uint256 maxValuePerTx; // Max value per transaction
        uint256 dailyLimit;    // Daily spending limit
        uint256 spentToday;    // Amount spent today
        uint256 lastSpentDay;  // Last day spent was recorded
        uint256 nonce;
        bool active;
    }

    mapping(address => mapping(address => AdvancedSession)) public sessions;

    event AdvancedSessionCreated(
        address indexed account,
        address indexed sessionKey,
        uint256 validUntil,
        uint256 dailyLimit
    );

    function createAdvancedSession(
        address sessionKey,
        address[] calldata targets,
        uint256 validFor,
        bytes4[] calldata methods,
        uint256 maxValuePerTx,
        uint256 dailyLimit
    ) external {
        AdvancedSession storage session = sessions[msg.sender][sessionKey];

        uint256 currentDay = block.timestamp / 86400;

        session.sessionKey = sessionKey;
        session.allowedTargets = targets;
        session.validUntil = block.timestamp + validFor;
        session.allowedMethods = methods;
        session.maxValuePerTx = maxValuePerTx;
        session.dailyLimit = dailyLimit;
        session.spentToday = 0;
        session.lastSpentDay = currentDay;
        session.nonce = 0;
        session.active = true;

        emit AdvancedSessionCreated(msg.sender, sessionKey, session.validUntil, dailyLimit);
    }

    function executeWithAdvancedSession(
        address target,
        uint256 value,
        bytes calldata data,
        address sessionKey
    ) external returns (bytes memory result) {
        AdvancedSession storage session = sessions[msg.sender][sessionKey];

        require(session.active, "Session not active");
        require(block.timestamp <= session.validUntil, "Session expired");
        require(value <= session.maxValuePerTx, "Value exceeds per-tx limit");
        require(isAllowedTarget(target, session), "Target not allowed");
        require(isAllowedMethod(data, session), "Method not allowed");

        // Check daily limit
        uint256 currentDay = block.timestamp / 86400;
        if (currentDay > session.lastSpentDay) {
            session.spentToday = 0;
            session.lastSpentDay = currentDay;
        }
        require(session.spentToday + value <= session.dailyLimit, "Daily limit exceeded");

        // Execute transaction
        (bool success, bytes memory returndata) = target.call{value: value}(data);
        require(success, "Transaction failed");

        session.spentToday += value;
        session.nonce++;

        return returndata;
    }
}
```

#### Session Key Use Cases

**Agent Execution Sessions:**
```typescript
// Agent execution with session keys
const sessionKey = "0x123..."; // Pre-approved key for agent operations

await smartAccount.executeWithSession(
    agentContractAddress,
    0, // No ETH value
    encodeFunctionData({
        abi: AgentABI,
        functionName: "executeTask",
        args: [taskData]
    }),
    sessionKey
);
```

**Recurring Payment Sessions:**
```typescript
// Monthly subscription payments
await smartAccount.executeWithSession(
    subscriptionContract,
    parseEther("10"), // 10 USDC monthly
    encodeFunctionData({
        abi: SubscriptionABI,
        functionName: "payMonthly",
        args: [subscriptionId]
    }),
    recurringPaymentSessionKey
);
```

### Social Recovery Implementation

#### Recovery Mechanism Design
```solidity
// SocialRecoveryManager.sol
contract SocialRecoveryManager {
    struct RecoveryRequest {
        address account;
        address proposedNewOwner;
        address[] guardians;
        uint256 signaturesRequired;
        uint256 signaturesCollected;
        mapping(address => bool) guardianSignatures;
        uint256 validUntil;
        bool executed;
    }

    mapping(bytes32 => RecoveryRequest) public recoveryRequests;

    event RecoveryInitiated(
        bytes32 indexed recoveryId,
        address indexed account,
        address indexed proposedNewOwner
    );

    event RecoveryExecuted(
        bytes32 indexed recoveryId,
        address indexed oldOwner,
        address indexed newOwner
    );

    function initiateRecovery(
        address proposedNewOwner,
        address[] calldata guardians,
        uint256 signaturesRequired,
        uint256 validFor
    ) external {
        require(signaturesRequired <= guardians.length, "Invalid signature requirement");
        require(signaturesRequired >= 2, "Minimum 2 signatures required");

        bytes32 recoveryId = keccak256(abi.encodePacked(
            msg.sender,
            proposedNewOwner,
            block.timestamp
        ));

        RecoveryRequest storage request = recoveryRequests[recoveryId];
        request.account = msg.sender;
        request.proposedNewOwner = proposedNewOwner;
        request.guardians = guardians;
        request.signaturesRequired = signaturesRequired;
        request.signaturesCollected = 0;
        request.validUntil = block.timestamp + validFor;
        request.executed = false;

        emit RecoveryInitiated(recoveryId, msg.sender, proposedNewOwner);
    }

    function signRecovery(bytes32 recoveryId) external {
        RecoveryRequest storage request = recoveryRequests[recoveryId];

        require(block.timestamp <= request.validUntil, "Recovery expired");
        require(!request.executed, "Recovery already executed");
        require(isGuardian(request, msg.sender), "Not a guardian");
        require(!request.guardianSignatures[msg.sender], "Already signed");

        request.guardianSignatures[msg.sender] = true;
        request.signaturesCollected++;

        // Execute recovery if threshold reached
        if (request.signaturesCollected >= request.signaturesRequired) {
            executeRecovery(recoveryId);
        }
    }

    function executeRecovery(bytes32 recoveryId) internal {
        RecoveryRequest storage request = recoveryRequests[recoveryId];

        address oldOwner = request.account;
        address newOwner = request.proposedNewOwner;

        // Update account ownership (via Account contract)
        // This would typically call the account's changeOwner function

        request.executed = true;

        emit RecoveryExecuted(recoveryId, oldOwner, newOwner);
    }

    function isGuardian(
        RecoveryRequest storage request,
        address guardian
    ) internal view returns (bool) {
        for (uint i = 0; i < request.guardians.length; i++) {
            if (request.guardians[i] == guardian) {
                return true;
            }
        }
        return false;
    }
}
```

### Multi-Device Sync

#### Sync Architecture
```typescript
// MultiDeviceSyncManager.ts
export class MultiDeviceSyncManager {
    private syncRegistry: Map<string, DeviceInfo[]> = new Map();

    async registerDevice(
        userId: string,
        deviceId: string,
        deviceInfo: DeviceInfo
    ): Promise<void> {
        if (!this.syncRegistry.has(userId)) {
            this.syncRegistry.set(userId, []);
        }

        const devices = this.syncRegistry.get(userId)!;
        devices.push({ deviceId, ...deviceInfo, lastSync: new Date() });

        // Notify other devices of new device
        await this.broadcastToDevices(userId, {
            type: 'DEVICE_REGISTERED',
            deviceId,
            deviceInfo
        });
    }

    async syncWalletState(
        userId: string,
        fromDevice: string,
        walletUpdates: WalletStateUpdate[]
    ): Promise<void> {
        const devices = this.syncRegistry.get(userId) || [];

        // Apply updates to wallet state
        for (const update of walletUpdates) {
            await this.applyWalletUpdate(update);
        }

        // Broadcast updates to other devices
        await this.broadcastToDevices(userId, {
            type: 'WALLET_STATE_UPDATED',
            fromDevice,
            updates: walletUpdates,
            timestamp: new Date()
        });
    }

    private async broadcastToDevices(
        userId: string,
        message: SyncMessage
    ): Promise<void> {
        const devices = this.syncRegistry.get(userId) || [];

        for (const device of devices) {
            if (device.deviceId !== message.fromDevice) {
                await this.sendToDevice(device.deviceId, message);
            }
        }
    }
}
```

### Transaction Batching Service

#### Batch Execution Architecture
```solidity
// TransactionBatcher.sol
contract TransactionBatcher {
    struct Batch {
        address account;
        BatchTransaction[] transactions;
        uint256 nonce;
        bool executed;
        bytes32 batchHash;
    }

    struct BatchTransaction {
        address target;
        uint256 value;
        bytes data;
        bool success;
        bytes returnData;
    }

    mapping(bytes32 => Batch) public batches;

    event BatchCreated(bytes32 indexed batchId, address indexed account);
    event BatchExecuted(bytes32 indexed batchId, bool success);

    function createBatch(
        BatchTransaction[] calldata transactions
    ) external returns (bytes32 batchId) {
        batchId = keccak256(abi.encodePacked(msg.sender, block.timestamp, transactions.length));

        Batch storage batch = batches[batchId];
        batch.account = msg.sender;
        batch.transactions = transactions;
        batch.nonce = 0;
        batch.executed = false;
        batch.batchHash = keccak256(abi.encode(transactions));

        emit BatchCreated(batchId, msg.sender);
    }

    function executeBatch(bytes32 batchId) external {
        Batch storage batch = batches[batchId];
        require(batch.account == msg.sender, "Not batch owner");
        require(!batch.executed, "Batch already executed");

        batch.executed = true;

        // Execute all transactions in batch
        for (uint i = 0; i < batch.transactions.length; i++) {
            BatchTransaction storage tx = batch.transactions[i];

            (bool success, bytes memory returnData) = tx.target.call{value: tx.value}(tx.data);

            tx.success = success;
            tx.returnData = returnData;
        }

        emit BatchExecuted(batchId, true);
    }
}
```

### Security Considerations

**Session Key Security:**
- **Time-based expiry** prevents indefinite access
- **Spending limits** prevent large unauthorized transactions
- **Target restrictions** limit execution scope
- **Revocation capability** for immediate termination

**Social Recovery Security:**
- **Multi-signature requirement** prevents single-point failures
- **Time-limited requests** prevent indefinite recovery attempts
- **Guardian verification** ensures only authorized parties can recover

**Multi-Device Sync Security:**
- **End-to-end encryption** for sync messages
- **Device authentication** prevents unauthorized device registration
- **Conflict resolution** handles concurrent updates

**Transaction Batching Security:**
- **Atomic execution** ensures all-or-nothing batch completion
- **Gas optimization** reduces overall transaction costs
- **Failure handling** isolates failed transactions within batch

### Performance Targets

**Session Key Performance:**
- **Session Creation:** <50,000 gas
- **Session Execution:** <30,000 gas per transaction
- **Session Revocation:** <20,000 gas

**Social Recovery Performance:**
- **Recovery Initiation:** <100,000 gas
- **Guardian Signature:** <25,000 gas
- **Recovery Execution:** <150,000 gas

**Multi-Device Sync Performance:**
- **Device Registration:** <100ms
- **State Sync:** <500ms for typical wallet state
- **Conflict Resolution:** <200ms

**Transaction Batching Performance:**
- **Batch Creation:** <80,000 gas
- **Batch Execution:** <50,000 gas + per-transaction costs
- **Batch Verification:** <30,000 gas

---

## DO-6: Phase 1 Agent Specifications

### Design Objective
Design specifications for 3 showcase agents: Trading Bot (Hyperliquid), DeFi Assistant (multi-protocol), and NFT Curator (marketplace aggregator).

### Agent 1: Trading Bot (Hyperliquid Integration)

#### Agent Overview
**Name:** Hyperliquid Trading Bot  
**Category:** TRADING  
**Tier:** PRO (requires paid subscription)  
**Description:** Automated trading agent for perpetual futures on Hyperliquid

**Key Features:**
- Real-time market analysis and signal generation
- Automated position management with risk controls
- Multi-timeframe strategy execution
- Performance tracking and reporting

**Technical Specification:**

**Docker Configuration:**
```dockerfile
FROM python:3.12-slim-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy agent code
COPY src/ /app/
COPY requirements.txt /app/

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Resource limits
ENV MAX_POSITION_SIZE=1000
ENV MAX_DAILY_LOSS=100

# Start agent server
CMD ["python", "-m", "trading_bot.server"]
```

**API Endpoints:**
```typescript
// Agent API specification
interface TradingBotAPI {
    // Market analysis
    getMarketAnalysis(symbol: string): Promise<MarketAnalysis>;

    // Position management
    openPosition(order: TradingOrder): Promise<Position>;
    closePosition(positionId: string): Promise<TransactionResult>;
    modifyPosition(positionId: string, updates: PositionUpdate): Promise<Position>;

    // Risk management
    setRiskLimits(limits: RiskLimits): Promise<void>;
    getRiskMetrics(): Promise<RiskMetrics>;

    // Strategy execution
    executeStrategy(strategy: TradingStrategy): Promise<StrategyResult>;
    stopStrategy(strategyId: string): Promise<void>;

    // Performance reporting
    getPerformanceReport(period: string): Promise<PerformanceReport>;
}
```

**Integration Points:**
- **Hyperliquid API:** Real-time price feeds, order execution
- **Price Oracles:** Multiple DEX price feeds for arbitrage
- **Risk Engine:** Position sizing, stop-loss management
- **Analytics:** P&L tracking, performance metrics

**Revenue Model:**
- **Execution Fee:** 0.1% of trade value
- **Strategy Subscription:** $50/month for premium strategies
- **Performance Fee:** 20% of profits above high-water mark

### Agent 2: DeFi Assistant (Multi-Protocol Optimizer)

#### Agent Overview
**Name:** DeFi Portfolio Optimizer  
**Category:** DEFI  
**Tier:** PRO  
**Description:** Multi-protocol DeFi portfolio optimization across lending, DEX, and yield farming

**Key Features:**
- Cross-protocol yield optimization
- Automated rebalancing based on risk tolerance
- Gas-optimized transaction batching
- Real-time opportunity detection

**Technical Specification:**

**Protocol Integrations:**
```typescript
interface DeFiIntegrations {
    // DEX integrations
    uniswap: UniswapService;
    sushiswap: SushiSwapService;
    curve: CurveService;

    // Lending protocols
    aave: AaveService;
    compound: CompoundService;
    morpho: MorphoService;

    // Yield farming
    convex: ConvexService;
    yearn: YearnService;
    idle: IdleService;

    // Bridges
    layerZero: LayerZeroBridge;
    wormhole: WormholeBridge;
}
```

**Optimization Algorithm:**
```typescript
// PortfolioOptimizer.ts
export class PortfolioOptimizer {
    async optimizePortfolio(
        currentPositions: Position[],
        riskTolerance: 'conservative' | 'moderate' | 'aggressive',
        targetYield: number
    ): Promise<OptimizationPlan> {
        // 1. Analyze current positions across protocols
        const analysis = await this.analyzePositions(currentPositions);

        // 2. Identify optimization opportunities
        const opportunities = await this.findOpportunities(analysis, riskTolerance);

        // 3. Calculate optimal allocation
        const allocation = await this.calculateOptimalAllocation(
            opportunities,
            targetYield
        );

        // 4. Generate rebalancing plan
        const plan = await this.generateRebalancingPlan(allocation);

        // 5. Estimate gas costs and yields
        const estimates = await this.estimateExecution(plan);

        return {
            currentAnalysis: analysis,
            opportunities,
            optimalAllocation: allocation,
            rebalancingPlan: plan,
            estimates,
            expectedYield: estimates.expectedYield,
            riskMetrics: estimates.riskMetrics
        };
    }
}
```

**Revenue Model:**
- **Optimization Fee:** 0.5% of rebalanced amount
- **Performance Fee:** 10% of yield improvement
- **Premium Strategies:** $30/month for advanced optimization

### Agent 3: NFT Curator (Marketplace Aggregator)

#### Agent Overview
**Name:** NFT Portfolio Curator  
**Category:** NFT  
**Tier:** BASIC (free with premium features)  
**Description:** Automated NFT portfolio management and curation across multiple marketplaces

**Key Features:**
- Multi-marketplace price monitoring
- Automated listing and delisting
- Rarity and value analysis
- Collection tracking and alerts

**Technical Specification:**

**Marketplace Integrations:**
```typescript
interface NFTMarketplaces {
    opensea: OpenSeaService;
    blur: BlurService;
    looksrare: LooksRareService;
    foundation: FoundationService;
    zora: ZoraService;
    baseMarketplaces: BaseNFTService[]; // Multiple Base NFT platforms
}
```

**Curation Algorithm:**
```typescript
// NFTCurator.ts
export class NFTCurator {
    async curatePortfolio(
        walletAddress: string,
        strategy: CurationStrategy
    ): Promise<CurationPlan> {
        // 1. Analyze current NFT holdings
        const holdings = await this.getNFTHoldings(walletAddress);

        // 2. Evaluate collection performance
        const analysis = await this.analyzeCollections(holdings);

        // 3. Identify optimization opportunities
        const opportunities = await this.findOpportunities(analysis, strategy);

        // 4. Generate curation plan
        const plan = await this.generateCurationPlan(opportunities);

        return {
            currentHoldings: holdings,
            analysis,
            opportunities,
            curationPlan: plan,
            expectedValue: plan.estimatedValue
        };
    }
}
```

**Revenue Model:**
- **Basic Tier:** Free for 10 NFTs
- **Pro Tier:** $20/month for unlimited NFTs + advanced analytics
- **Enterprise Tier:** $100/month for institutional portfolios

### Security Considerations

**Trading Bot Security:**
- **Position Limits:** Maximum position sizes to prevent large losses
- **Circuit Breakers:** Automatic position closing on extreme market moves
- **API Key Management:** Secure storage and rotation of exchange credentials

**DeFi Assistant Security:**
- **Slippage Protection:** Maximum slippage limits on all swaps
- **Gas Price Monitoring:** Alert on unusual gas price spikes
- **Protocol Health Checks:** Monitor protocol TVL and liquidity

**NFT Curator Security:**
- **Listing Validation:** Verify marketplace authenticity before listing
- **Price Floor Monitoring:** Alert on listings below floor prices
- **Royalty Enforcement:** Ensure creator royalties are respected

### Performance Targets

**Trading Bot Performance:**
- **Signal Generation:** <1s for market analysis
- **Order Execution:** <2s from signal to execution
- **Risk Monitoring:** Real-time position monitoring
- **Success Rate:** >95% successful order execution

**DeFi Assistant Performance:**
- **Portfolio Analysis:** <5s for typical portfolio (50 positions)
- **Optimization Calculation:** <10s for rebalancing plan
- **Transaction Batching:** 50% gas savings vs. individual transactions
- **Yield Tracking:** Real-time yield monitoring across protocols

**NFT Curator Performance:**
- **Portfolio Sync:** <3s for 100 NFT portfolio
- **Price Monitoring:** <1s per marketplace price check
- **Listing Management:** <5s for batch listing operations
- **Analytics Generation:** <2s for portfolio analytics

---

## Summary of Phase 1 Designs

### Database Enhancements ✅
- **7 new models** added for V1 functionality
- **Enhanced relationships** between User and new entities
- **Performance optimizations** with proper indexing
- **Migration strategy** for zero-downtime deployment

### Smart Contract Extensions ✅
- **Account Factory:** CREATE2 deterministic deployment
- **Paymaster:** Sponsorship and token-based gas payment
- **Session Key Manager:** Advanced session management with limits
- **Multi-Chain Registry:** Cross-chain account tracking
- **Security hardened** with comprehensive access controls

### Agent Publishing API ✅
- **Complete REST API** for agent lifecycle management
- **Docker integration** for containerized deployment
- **Version management** with rollback capabilities
- **Analytics integration** for performance tracking
- **Rate limiting** and security measures

### Grant Tracking System ✅
- **Automated milestone verification** using real metrics
- **Report generation** with PDF/HTML output
- **Notification system** for deadline management
- **Workflow management** from draft to completion

### Advanced AA Features ✅
- **Session keys** with spending limits and time restrictions
- **Social recovery** with multi-signature guardian system
- **Multi-device sync** for seamless wallet management
- **Transaction batching** for gas optimization

### Agent Specifications ✅
- **Trading Bot:** Hyperliquid perpetual futures automation
- **DeFi Assistant:** Multi-protocol portfolio optimization
- **NFT Curator:** Marketplace aggregation and curation

**All designs complete with security considerations, performance targets, and implementation-ready specifications.**

**Status:** ✅ **READY FOR IMPLEMENTATION**

