# 🚀 AgentNexus Deployment Guide

**Complete guide for deploying AgentNexus to production**

---

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ Vercel account (or other hosting platform)
- ✅ Backend server deployed (or ready to deploy)
- ✅ PostgreSQL database (Vercel Postgres, Railway, or similar)
- ✅ Alchemy API key with Account Abstraction enabled
- ✅ WalletConnect project ID
- ✅ Smart contracts deployed to target network

---

## 🎯 Deployment Checklist

### **Phase 1: Backend Deployment**

#### **1.1 Database Setup**

```bash
# Using Vercel Postgres
vercel postgres create agentnexus-db

# Or Railway
railway add

# Run migrations
pnpm prisma migrate deploy

# Seed database
pnpm prisma db seed
```

#### **1.2 Backend Environment Variables**

Create `.env.production`:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/agentnexus

# Server
PORT=8200
NODE_ENV=production
FRONTEND_URL=https://agentnexus.vercel.app

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Alchemy
ALCHEMY_API_KEY=your_alchemy_api_key
ALCHEMY_GAS_POLICY_ID=your_gas_policy_id

# Smart Contracts
AGENT_REGISTRY_CONTRACT=0x...
ESCROW_CONTRACT=0x...
ENTITLEMENTS_CONTRACT=0x...
```

#### **1.3 Deploy Backend**

**Option A: Railway**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and init
railway login
railway init

# Link to project
railway link

# Deploy
railway up
```

**Option B: Render**
```bash
# Create render.yaml in backend/
services:
  - type: web
    name: agentnexus-backend
    env: node
    buildCommand: pnpm install && pnpm build
    startCommand: pnpm start
```

**Option C: Docker + AWS/GCP**
```bash
# Build
docker build -t agentnexus-backend .

# Push to registry
docker tag agentnexus-backend:latest your-registry/agentnexus-backend
docker push your-registry/agentnexus-backend

# Deploy to ECS/Cloud Run
```

---

### **Phase 2: Frontend Deployment**

#### **2.1 Environment Variables**

Set in Vercel dashboard or `.env.production`:

```bash
NEXT_PUBLIC_API_URL=https://api.agentnexus.com
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID=your_gas_policy
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_wc_project_id
NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT=0x...
NEXT_PUBLIC_ESCROW_CONTRACT=0x...
NEXT_PUBLIC_ENTITLEMENTS_CONTRACT=0x...
```

#### **2.2 Deploy to Vercel**

**Method 1: CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend
cd frontend

# Deploy
vercel --prod
```

**Method 2: GitHub Integration**
1. Push code to GitHub
2. Connect repository to Vercel
3. Configure build settings:
   - **Framework:** Next.js
   - **Build Command:** `pnpm build`
   - **Output Directory:** `.next`
   - **Install Command:** `pnpm install`
4. Add environment variables
5. Deploy

**Method 3: Vercel Dashboard**
1. Go to vercel.com
2. Click "Add New Project"
3. Import from Git repository
4. Configure settings
5. Add environment variables
6. Deploy

---

### **Phase 3: Smart Contract Deployment**

#### **3.1 Deploy Contracts**

```bash
cd smart-contracts

# Set up environment
cp .env.example .env
# Edit .env with your private key and RPC URL

# Deploy to testnet first
forge script script/Deploy.s.sol:DeployScript --rpc-url sepolia --broadcast --verify

# Verify deployment
forge verify-contract <contract-address> src/AgentNexusRegistry.sol:AgentNexusRegistry --chain sepolia

# Deploy to mainnet
forge script script/Deploy.s.sol:DeployScript --rpc-url mainnet --broadcast --verify
```

#### **3.2 Update Contract Addresses**

Update in both frontend and backend `.env`:

```bash
NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT=0xABC...
NEXT_PUBLIC_ESCROW_CONTRACT=0xDEF...
NEXT_PUBLIC_ENTITLEMENTS_CONTRACT=0xGHI...
```

---

### **Phase 4: Post-Deployment Setup**

#### **4.1 Configure Alchemy**

1. Go to Alchemy Dashboard
2. Create new app for mainnet/testnet
3. Enable Account Abstraction
4. Create Gas Manager policy:
   - Set spending limits
   - Configure allowed contracts
   - Enable paymaster

#### **4.2 Set Up Monitoring**

**Vercel Analytics**
```bash
# Already included in Next.js
# View at https://vercel.com/dashboard/analytics
```

**Sentry (Error Tracking)**
```bash
# Install
pnpm add @sentry/nextjs

# Initialize
npx @sentry/wizard@latest -i nextjs

# Configure in sentry.client.config.js and sentry.server.config.js
```

**Uptime Monitoring**
- Set up UptimeRobot or similar
- Monitor endpoints:
  - Frontend: `https://agentnexus.com`
  - Backend: `https://api.agentnexus.com/health`

#### **4.3 Custom Domain**

**Vercel**
```bash
# Add domain in Vercel dashboard
# Update DNS records:
# A record: @ → 76.76.21.21
# CNAME: www → cname.vercel-dns.com

# Or use Vercel CLI
vercel domains add agentnexus.com
```

---

## 🔧 Configuration Files

### **1. vercel.json** (Already created)

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

### **2. .env.example** (Already created)

Ready for developers to copy and configure.

### **3. Backend Dockerfile** (If using Docker)

```dockerfile
# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm build

# Expose port
EXPOSE 8200

# Start
CMD ["pnpm", "start"]
```

---

## 🧪 Testing Deployment

### **1. Pre-deployment Tests**

```bash
# Frontend
cd frontend
pnpm build
pnpm start

# Backend
cd backend
pnpm build
pnpm start

# Test API endpoints
curl http://localhost:8200/api/health
curl http://localhost:8200/api/builder/templates
```

### **2. Post-deployment Tests**

```bash
# Frontend
curl https://agentnexus.com

# Backend health check
curl https://api.agentnexus.com/health

# Test API
curl https://api.agentnexus.com/api/builder/templates
```

### **3. E2E Tests**

```bash
# Run Playwright tests against production
pnpm playwright test --config=playwright.config.production.ts
```

---

## 📊 Performance Optimization

### **Frontend Optimizations**

1. **Enable Next.js Image Optimization**
   ```js
   // next.config.js
   module.exports = {
     images: {
       domains: ['your-image-domain.com'],
       formats: ['image/avif', 'image/webp'],
     },
   };
   ```

2. **Enable Static Generation**
   - Templates page: ISR with 60s revalidation
   - Landing page: Static generation
   - Agent details: ISR with 300s revalidation

3. **Code Splitting**
   - Already handled by Next.js
   - Use dynamic imports for heavy components:
     ```tsx
     const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
       ssr: false,
       loading: () => <LoadingSpinner />,
     });
     ```

### **Backend Optimizations**

1. **Database Connection Pooling**
   ```ts
   // prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     connectionLimit = 10
   }
   ```

2. **Redis Caching**
   ```ts
   // Cache templates for 5 minutes
   await redis.set('templates', JSON.stringify(templates), 'EX', 300);
   ```

3. **API Rate Limiting**
   ```ts
   app.use(rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   }));
   ```

---

## 🔐 Security Checklist

- [ ] Environment variables secured (not in git)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Helmet middleware active
- [ ] JWT secrets strong and unique
- [ ] Database credentials secure
- [ ] API keys rotated regularly
- [ ] HTTPS enforced
- [ ] Content Security Policy configured
- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS prevention (React escaping)

---

## 🚨 Rollback Plan

If deployment fails:

1. **Vercel Rollback**
   ```bash
   vercel rollback
   # Or via dashboard
   ```

2. **Backend Rollback**
   ```bash
   # Railway
   railway rollback

   # Docker
   docker pull your-registry/agentnexus-backend:previous-tag
   ```

3. **Database Rollback**
   ```bash
   # Prisma migration rollback
   pnpm prisma migrate reset
   ```

---

## 📝 Post-Launch Checklist

- [ ] Monitor error rates (Sentry)
- [ ] Check performance (Vercel Analytics)
- [ ] Verify all API endpoints working
- [ ] Test wallet connection
- [ ] Test agent creation flow (all 3 methods)
- [ ] Test agent deployment
- [ ] Verify smart contract interactions
- [ ] Check database connections
- [ ] Monitor server resources
- [ ] Set up alerts for downtime
- [ ] Document any issues
- [ ] Communicate with team

---

## 🔗 Useful Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Alchemy Dashboard:** https://dashboard.alchemy.com
- **Railway Dashboard:** https://railway.app/dashboard
- **Sentry Dashboard:** https://sentry.io
- **WalletConnect:** https://cloud.walletconnect.com

---

## 📞 Support

If you encounter issues:

1. Check logs:
   - Vercel: Dashboard → Project → Logs
   - Backend: Server logs
   - Browser: DevTools Console

2. Common issues:
   - **CORS errors:** Check `FRONTEND_URL` in backend
   - **API connection:** Verify `NEXT_PUBLIC_API_URL`
   - **Wallet not connecting:** Check WalletConnect Project ID
   - **Smart contract errors:** Verify contract addresses

3. Rollback if needed and investigate

---

**Deployment Complete! 🎉**

Your AgentNexus platform is now live and ready to serve users!

---

**Last Updated:** October 10, 2025  
**Version:** 1.0.0

