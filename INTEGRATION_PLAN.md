# 🚀 Frontend & Backend Integration Plan

**Date:** October 9, 2025  
**Status:** Starting  
**Goal:** Integrate deployed smart contracts with backend and frontend

---

## 📊 Current Status

### ✅ Completed
- Smart contracts deployed to Base Sepolia
- ABIs exported to backend/frontend
- Backend roles granted
- Environment variables configured
- Test agents and entitlements created

### ⏳ To Do
- Backend database setup
- Backend server configuration
- Frontend wallet integration
- Full integration testing

---

## 🎯 Phase 1: Backend Integration (30 min)

### 1.1 Database Setup
- [ ] Install PostgreSQL (or use existing)
- [ ] Create AgentNexus database
- [ ] Run Prisma migrations
- [ ] Verify database connection

### 1.2 Backend Configuration
- [ ] Install/update dependencies
- [ ] Configure contract ABIs
- [ ] Set up blockchain provider
- [ ] Configure wallet service
- [ ] Test contract connections

### 1.3 Start Backend Server
- [ ] Start Express server
- [ ] Test health endpoints
- [ ] Test API routes
- [ ] Verify WebSocket connection

---

## 🎯 Phase 2: Frontend Integration (20 min)

### 2.1 Frontend Setup
- [ ] Install/update dependencies
- [ ] Configure wagmi + RainbowKit
- [ ] Set up contract instances
- [ ] Configure Base Sepolia network

### 2.2 Wallet Integration
- [ ] Test wallet connection
- [ ] Test contract reads
- [ ] Test contract writes
- [ ] Verify transaction signing

### 2.3 Start Frontend Server
- [ ] Start Next.js dev server
- [ ] Test homepage
- [ ] Test agent marketplace
- [ ] Test wallet connection flow

---

## 🎯 Phase 3: Integration Testing (20 min)

### 3.1 End-to-End Flow
- [ ] Browse agents
- [ ] Connect wallet
- [ ] Purchase agent execution
- [ ] Execute agent
- [ ] View results

### 3.2 Contract Integration
- [ ] Test deposit payment
- [ ] Test mint entitlement
- [ ] Test release payment
- [ ] Test role permissions

### 3.3 Real-Time Features
- [ ] Test WebSocket streaming
- [ ] Test log updates
- [ ] Test status updates
- [ ] Test error handling

---

## 📋 Prerequisites

### Backend
```bash
# Required
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

# Environment Variables (already configured)
✅ CHAIN_ID=84532
✅ BASE_SEPOLIA_RPC=https://sepolia.base.org
✅ ESCROW_CONTRACT_ADDRESS=0x3c8f32F9cF41Dc255129d6Add447218053743b33
✅ ENTITLEMENTS_CONTRACT_ADDRESS=0x37A7B1f10b87f31ad916Fb3518118f8AA0d8d2fC
✅ BACKEND_WALLET_ADDRESS=0x2413C0DE9CBdFB3eADA6D7d20fB0A953F85bcb41
```

### Frontend
```bash
# Required
- Node.js 18+
- npm or yarn

# Environment Variables (already configured)
✅ NEXT_PUBLIC_CHAIN_ID=84532
✅ NEXT_PUBLIC_BASE_RPC=https://sepolia.base.org
✅ NEXT_PUBLIC_ESCROW_ADDRESS=0x3c8f32F9cF41Dc255129d6Add447218053743b33
✅ NEXT_PUBLIC_ENTITLEMENTS_ADDRESS=0x37A7B1f10b87f31ad916Fb3518118f8AA0d8d2fC
```

---

## 🛠️ Commands to Run

### Backend Setup
```bash
cd /Users/billwilson_home/Desktop/AgentNexus-V1/backend

# 1. Install dependencies
npm install

# 2. Set up database (if needed)
# Option A: Use existing PostgreSQL
# Option B: Use Docker PostgreSQL
# Option C: Use SQLite for quick start

# 3. Run Prisma migrations
npx prisma generate
npx prisma migrate dev

# 4. Start server
npm run dev
```

### Frontend Setup
```bash
cd /Users/billwilson_home/Desktop/AgentNexus-V1/frontend

# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```

---

## 🔍 Testing Checklist

### Backend API Tests
- [ ] GET /health - Server health check
- [ ] GET /api/agents - List all agents
- [ ] POST /api/agents - Create new agent
- [ ] POST /api/executions - Start execution
- [ ] WS /ws - WebSocket connection

### Frontend Tests
- [ ] Homepage loads
- [ ] Agent marketplace displays
- [ ] Wallet connection works
- [ ] Contract reads work
- [ ] Transaction signing works

### Integration Tests
- [ ] Full agent lifecycle
- [ ] Payment flow
- [ ] Execution flow
- [ ] Real-time updates

---

## 🚨 Common Issues & Solutions

### Database Connection
```
Error: Can't reach database
Solution: Check PostgreSQL is running, check .env DATABASE_URL
```

### Contract Connection
```
Error: Contract not found
Solution: Verify contract addresses in .env, check network
```

### Wallet Connection
```
Error: No provider found
Solution: Install MetaMask, switch to Base Sepolia network
```

---

## 📚 Key Files

### Backend
- `backend/.env` - Environment configuration ✅
- `backend/prisma/schema.prisma` - Database schema
- `backend/src/contracts/` - Contract ABIs ✅
- `backend/src/services/` - Services for blockchain interaction

### Frontend
- `frontend/.env.local` - Environment configuration ✅
- `frontend/src/contracts/` - Contract ABIs ✅
- `frontend/src/wagmi.ts` - Wagmi configuration
- `frontend/src/app/` - Next.js pages

---

## 🎯 Success Criteria

- [ ] Backend server running on port 3001
- [ ] Frontend dev server running on port 3000
- [ ] Database connected and migrated
- [ ] Contracts accessible from backend
- [ ] Wallet connects from frontend
- [ ] Can read from contracts
- [ ] Can write to contracts (with gas)
- [ ] WebSocket streaming works
- [ ] End-to-end flow completes

---

## 📊 Progress Tracking

**Started:** October 9, 2025  
**Current Phase:** Phase 1 - Backend Integration  
**Next Milestone:** Backend server running  

---

**Let's begin!** 🚀

