# Agent Zero Integration Guide

**Version:** 1.0.0  
**Last Updated:** October 10, 2025  
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [API Reference](#api-reference)
6. [User Flows](#user-flows)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## Overview

Agent Zero is integrated into AgentNexus as a premium offering using a hybrid approach that provides both quick executions and persistent instances.

### What is Agent Zero?

Agent Zero is an open-source autonomous AI agent framework that can:
- Execute complex multi-step tasks
- Use tools (terminal, code execution, web browsing)
- Deploy subordinate agents for specialized tasks
- Maintain conversation context and memory
- Integrate with external services via MCP servers

**GitHub:** https://github.com/agent0ai/agent-zero  
**Stars:** 12k+  
**License:** Open Source

### Integration Model

**Hybrid Approach:**
- **Quick Execution** (Basic Tier): Stateless, ephemeral containers for simple tasks
- **Persistent Instance** (Pro Tier): Long-running containers with full features

**Tiered Pricing:**
- **Basic Tier**: Free with limitations
- **Pro Tier**: $50/month for unlimited access

---

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                     AgentNexus Frontend                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Marketplace │  │    Execute   │  │   Instance   │     │
│  │     Page     │  │  Interface   │  │  Dashboard   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   AgentNexus Backend API                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              /api/agent-zero Routes                   │  │
│  │  • /execute           • /instance/create              │  │
│  │  • /rate-limit        • /instance/status              │  │
│  │  • /tier              • /instance/start/stop          │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌────────────────┬────────────────┬────────────────────┐  │
│  │  TierService   │    Adapter     │  InstanceManager   │  │
│  │  - Verify tier │  - Quick exec  │  - Persistent      │  │
│  │  - Rate limit  │  - Ephemeral   │  - Start/Stop      │  │
│  │  - Entitlements│  - Basic tier  │  - Pro tier        │  │
│  └────────────────┴────────────────┴────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│   Docker: Quick Mode    │   │  Docker: Full Instance  │
│  ┌──────────────────┐   │   │  ┌──────────────────┐   │
│  │  Agent Zero Core │   │   │  │  Agent Zero Core │   │
│  │  - Limited tools │   │   │  │  - All tools     │   │
│  │  - No WebUI      │   │   │  │  - Full WebUI    │   │
│  │  - 5min timeout  │   │   │  │  - 30min timeout │   │
│  │  - Stateless     │   │   │  │  - Persistent    │   │
│  └──────────────────┘   │   │  └──────────────────┘   │
└─────────────────────────┘   └─────────────────────────┘
```

### Component Breakdown

**Backend Services:**
1. **AgentZeroTierService**: Manages tier verification, rate limiting, and entitlements
2. **AgentZeroAdapter**: Handles quick execution for Basic tier
3. **AgentZeroInstanceManager**: Manages persistent instances for Pro tier
4. **WalletService**: Extended to support Agent Zero entitlement tokens

**Frontend Components:**
1. **TierComparison**: Displays Basic vs Pro features
2. **Marketplace Page**: Marketing and onboarding
3. **Execute Interface**: Quick execution UI (Basic)
4. **Instance Dashboard**: Instance management UI (Pro)

**Database Models:**
1. **AgentZeroInstance**: Tracks persistent containers
2. **AgentZeroExecution**: Logs all executions

---

## Installation

### Prerequisites

- Node.js 20+
- Docker
- PostgreSQL
- pnpm
- Base Sepolia testnet access
- MetaMask wallet

### Step 1: Clone Repository

```bash
# After cloning, navigate into the repository directory
cd <repository-name>
```

### Step 2: Install Dependencies

```bash
# Backend
cd backend
pnpm install

# Frontend
cd ../frontend
pnpm install
```

### Step 3: Database Setup

```bash
cd backend
pnpm prisma migrate dev
pnpm prisma generate
```

The Agent Zero tables are already included in the schema.

### Step 4: Run Setup Script

From the repository root (`<repo-root>`):

```bash
cd <repo-root>
./setup-agent-zero.sh
```

> Replace `<repo-root>` with your cloned path to avoid sharing personal directory details.

This script will:
- Generate token IDs
- Update .env files
- Optionally build Docker images

### Step 5: Start Services

```bash
# Terminal 1: Backend
cd backend
pnpm dev

# Terminal 2: Frontend
cd frontend
pnpm dev
```

---

## Configuration

### Environment Variables

#### Backend (`backend/.env`)

```env
# Agent Zero Token IDs
AGENT_ZERO_BASIC_TOKEN_ID=0x<generated-hash>
AGENT_ZERO_PRO_TOKEN_ID=0x<generated-hash>

# Pricing
AGENT_ZERO_PRO_PRICE=50000000  # 50 USDC (6 decimals)

# Docker Images
AGENT_ZERO_QUICK_IMAGE=agentnexus/agent-zero-quick:latest
AGENT_ZERO_FULL_IMAGE=agentnexus/agent-zero-full:latest

# Rate Limits (Basic Tier)
AGENT_ZERO_BASIC_RATE_LIMIT=10        # per day
AGENT_ZERO_BASIC_TIMEOUT=300000       # 5 minutes

# Pro Tier Limits
AGENT_ZERO_PRO_TIMEOUT=1800000        # 30 minutes
AGENT_ZERO_PRO_MAX_MEMORY=4GB
```

#### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_AGENT_ZERO_BASIC_ID=0x<same-as-backend>
NEXT_PUBLIC_AGENT_ZERO_PRO_ID=0x<same-as-backend>
NEXT_PUBLIC_AGENT_ZERO_PRO_PRICE=50
NEXT_PUBLIC_AGENT_ZERO_ENABLED=true
```

### Token ID Generation

Token IDs are computed from identifiers using SHA256 (proxy for keccak256):

```javascript
const crypto = require('crypto');
const basicId = '0x' + crypto.createHash('sha256')
  .update('agent-zero-basic')
  .digest('hex');
const proId = '0x' + crypto.createHash('sha256')
  .update('agent-zero-pro')
  .digest('hex');
```

---

## API Reference

### Base URL

```
http://localhost:8200/api/agent-zero
```

### Endpoints

#### POST /execute

Quick execution for Basic tier.

**Request:**
```json
{
  "userId": "string",
  "prompt": "string"
}
```

**Response:**
```json
{
  "executionId": "string",
  "status": "completed",
  "response": "string",
  "toolsUsed": ["string"],
  "tokensUsed": 1234,
  "executionTime": 5000
}
```

#### GET /rate-limit

Check rate limit status.

**Query Params:**
- `userId`: string

**Response:**
```json
{
  "limit": 10,
  "current": 3,
  "remaining": 7,
  "resetAt": "2025-10-11T00:00:00Z"
}
```

#### POST /instance/create

Create persistent instance (Pro tier).

**Request:**
```json
{
  "userId": "string"
}
```

**Response:**
```json
{
  "instanceId": "string",
  "containerId": "string",
  "status": "RUNNING",
  "tunnelUrl": "http://localhost:50001"
}
```

#### GET /instance/status

Get instance status.

**Query Params:**
- `userId`: string

**Response:**
```json
{
  "instanceId": "string",
  "status": "RUNNING",
  "tunnelUrl": "http://localhost:50001",
  "tier": "PRO",
  "totalExecutions": 42,
  "lastAccessedAt": "2025-10-10T12:00:00Z",
  "resourceUsage": {
    "cpu": "45%",
    "memory": "2GB",
    "storage": 512000000
  }
}
```

#### POST /instance/start

Start stopped instance.

**Request:**
```json
{
  "userId": "string"
}
```

#### POST /instance/stop

Stop running instance.

**Request:**
```json
{
  "userId": "string"
}
```

#### DELETE /instance

Delete instance permanently.

**Request:**
```json
{
  "userId": "string"
}
```

---

## User Flows

### Basic Tier Flow

1. User visits `/marketplace/agent-zero`
2. Clicks "Try Free Now"
3. Redirected to `/agent-zero/execute`
4. Enters prompt and clicks "Execute"
5. System checks rate limit (10/day)
6. Creates ephemeral Docker container
7. Executes Agent Zero with prompt
8. Returns response
9. Cleans up container
10. Updates rate limit counter

### Pro Tier Flow

1. User visits `/marketplace/agent-zero`
2. Clicks "Upgrade to Pro"
3. Completes payment via smart contract
4. Pro entitlement token minted
5. User navigates to `/agent-zero/instance`
6. Clicks "Create Instance"
7. Persistent Docker container created
8. Tunnel URL generated
9. User clicks "Open Agent Zero WebUI"
10. Full Agent Zero interface opens in new tab

### Upgrade Flow

1. Basic user hits rate limit
2. Sees upgrade prompt
3. Clicks "Upgrade to Pro"
4. Redirected to upgrade page
5. Reviews Pro features
6. Connects wallet (if not connected)
7. Approves USDC payment (50 USDC)
8. Smart contract mints Pro entitlement
9. Backend detects Pro tier
10. User can now create instance

---

## Testing

### Manual Testing

```bash
# Test Basic tier execution
curl -X POST http://localhost:8200/api/agent-zero/execute \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","prompt":"What is 2+2?"}'

# Check rate limit
curl http://localhost:8200/api/agent-zero/rate-limit?userId=test-user

# Test instance creation (Pro tier)
curl -X POST http://localhost:8200/api/agent-zero/instance/create \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user"}'
```

### Automated Testing

Tests to be added in `backend/src/services/agentZero/__tests__/`:

- `AgentZeroTierService.test.ts`
- `AgentZeroAdapter.test.ts`
- `AgentZeroInstanceManager.test.ts`

---

## Deployment

### Docker Image Builds

```bash
cd backend/docker

# Build Quick image
docker build -f agent-zero-quick.Dockerfile \
  -t agentnexus/agent-zero-quick:latest .

# Build Full image
docker build -f agent-zero-full.Dockerfile \
  -t agentnexus/agent-zero-full:latest .

# Push to registry
docker push agentnexus/agent-zero-quick:latest
docker push agentnexus/agent-zero-full:latest
```

### Production Checklist

- [ ] Build and test Docker images
- [ ] Update environment variables for production
- [ ] Configure tunnel service (ngrok/cloudflare)
- [ ] Set up monitoring and alerts
- [ ] Configure auto-pause for idle instances
- [ ] Set up backup for persistent data
- [ ] Test payment flow on mainnet
- [ ] Load test with multiple users
- [ ] Security audit

---

## Troubleshooting

### Common Issues

**Issue:** Container fails to start  
**Solution:** Check Docker logs, ensure image is built correctly

**Issue:** Rate limit not working  
**Solution:** Verify database connection, check `AgentZeroExecution` records

**Issue:** Pro tier not detected  
**Solution:** Verify entitlement token balance on-chain

**Issue:** Tunnel URL not accessible  
**Solution:** Check firewall, verify port forwarding

### Logs

```bash
# Backend logs
cd backend && pnpm dev

# Docker container logs
docker logs <container-id>

# Database queries
cd backend && pnpm prisma studio
```

---

## FAQ

**Q: Can I change the pricing?**  
A: Yes, update `AGENT_ZERO_PRO_PRICE` in backend .env

**Q: How do I add more rate limit?**  
A: Update `AGENT_ZERO_BASIC_RATE_LIMIT` in backend .env

**Q: Can users have multiple instances?**  
A: Currently no, one instance per user. Can be modified in `InstanceManager`

**Q: Is data backed up?**  
A: Persistent volumes should be backed up externally

**Q: Can I use different LLM providers?**  
A: Yes, Agent Zero supports multiple providers via environment variables

---

## Support

- **Documentation:** This file
- **Status:** See `AGENT_ZERO_IMPLEMENTATION_STATUS.md`
- **Issues:** GitHub Issues
- **Community:** Discord

---

**Last Updated:** October 10, 2025  
**Version:** 1.0.0

