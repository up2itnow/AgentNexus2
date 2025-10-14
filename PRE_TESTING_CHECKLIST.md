# ✅ Pre-Testing Checklist

**Date:** October 10, 2025  
**Version:** 1.0.0

This checklist ensures everything is ready for user testing.

---

## 🚀 System Status

### **Services Running**
- [x] Backend API (port 8200)
- [x] Frontend Dev Server (port 3001)
- [x] Database (PostgreSQL)
- [x] Docker (if using containers)

**Verify:**
```bash
# Check backend
curl http://localhost:8200/health

# Check frontend
open http://localhost:3001

# Check database
cd backend && pnpm prisma studio
```

---

## 🔧 Configuration

### **Environment Variables**

#### Frontend (.env.local)
- [x] `NEXT_PUBLIC_API_URL=http://localhost:8200`
- [x] `NEXT_PUBLIC_ALCHEMY_API_KEY=[set]`
- [x] `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=[set]`
- [x] `NEXT_PUBLIC_ESCROW_CONTRACT=[set]`
- [x] `NEXT_PUBLIC_ENTITLEMENTS_CONTRACT=[set]`
- [x] `NEXT_PUBLIC_CHAIN_ID=84532`
- [x] `NEXT_PUBLIC_RPC_URL=[set]`

#### Backend (.env)
- [x] `DATABASE_URL=[set]`
- [x] `ALCHEMY_API_KEY=[set]`
- [x] `ESCROW_CONTRACT_ADDRESS=[set]`
- [x] `ENTITLEMENTS_CONTRACT_ADDRESS=[set]`
- [x] `CHAIN_ID=84532`
- [x] `RPC_URL=[set]`
- [x] `PRIVATE_KEY=[set]`

**Verify:**
```bash
# Frontend
cat frontend/.env.local | grep -v "^#" | grep "="

# Backend
cat backend/.env | grep -v "^#" | grep "="
```

---

## 📦 Dependencies

### **Frontend**
- [x] `pnpm install` completed
- [x] No vulnerabilities
- [x] TypeScript compiles
- [x] Build succeeds

**Verify:**
```bash
cd frontend
pnpm install
pnpm build
```

### **Backend**
- [x] `pnpm install` completed
- [x] No vulnerabilities
- [x] TypeScript compiles
- [x] Database migrated

**Verify:**
```bash
cd backend
pnpm install
pnpm prisma migrate dev
pnpm build
```

---

## 🗄️ Database

### **Schema**
- [x] Prisma schema up to date
- [x] Migrations applied
- [x] Seed data (if needed)
- [x] Can connect

**Verify:**
```bash
cd backend
pnpm prisma studio
# Should open browser with database
```

### **Test Data**
- [ ] Sample templates exist (optional)
- [ ] Sample modules exist (optional)
- [ ] Test user exists (optional)

---

## 🔐 Smart Contracts

### **Deployed Contracts**
- [x] AgentNexusEscrow deployed
- [x] AgentNexusEntitlements deployed
- [x] Addresses in .env files
- [x] Contracts verified on explorer (optional)

**Addresses:**
```
Escrow: 0x6E89D01e79d4dB50B9B70bd2e5D3e5e9e5c4e3d2
Entitlements: 0x7F89E02f79e5eC60C9C81be3f6e4d4f0f6d5f4e3
Network: Base Sepolia (84532)
```

### **Permissions**
- [x] Backend has MINTER_ROLE
- [x] Backend has BURNER_ROLE
- [x] Deployer has ADMIN_ROLE

**Verify:**
```bash
# Check on BaseScan Sepolia
# Or use cast/ethers to verify roles
```

---

## 🌐 Network

### **Base Sepolia Testnet**
- [x] RPC URL configured
- [x] Chain ID is 84532
- [x] Explorer: https://sepolia.basescan.org
- [x] Faucet available

**Test Connection:**
```bash
curl https://sepolia.base.org \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

---

## 🎨 Frontend Features

### **Pages Exist**
- [x] /builder (method selection)
- [x] /builder/template (template grid)
- [x] /builder/template/[id] (template config)
- [x] /builder/modular (module builder)
- [x] /builder/advanced (code editor)
- [x] /builder/my-agents (dashboard)

### **Components Work**
- [x] ConnectWalletModal
- [x] DeployAgentModal
- [x] Agent cards render
- [x] Forms validate
- [x] Modals open/close

**Test:**
```bash
# Navigate to each page
http://localhost:3001/builder
http://localhost:3001/builder/template
http://localhost:3001/builder/modular
http://localhost:3001/builder/advanced
http://localhost:3001/builder/my-agents
```

---

## 🔌 API Endpoints

### **Backend Routes Working**
- [x] GET /health
- [x] GET /api/builder/templates
- [x] GET /api/builder/templates/:id
- [x] GET /api/builder/modules
- [x] POST /api/builder/generate
- [x] POST /api/builder/preview
- [x] GET /api/builder/my-agents
- [x] DELETE /api/builder/agents/:id

**Test:**
```bash
# Health
curl http://localhost:8200/health

# Templates
curl http://localhost:8200/api/builder/templates

# Modules
curl http://localhost:8200/api/builder/modules
```

---

## 🔍 Browser Testing

### **Browsers to Test**
- [ ] Chrome (primary)
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### **Browser DevTools**
- [x] Console has no critical errors
- [x] Network tab shows successful requests
- [x] No CORS errors
- [x] No 404s for resources

---

## 📱 Responsive Design

### **Screen Sizes**
- [ ] Desktop (1920x1080)
- [ ] Laptop (1440x900)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

**Test:**
```
Open DevTools > Toggle Device Toolbar
Try different screen sizes
```

---

## 🎯 Critical User Flows

### **Flow 1: Create Agent via Template**
1. [ ] Navigate to /builder
2. [ ] Click BEGINNER
3. [ ] See template grid
4. [ ] Select template
5. [ ] Fill form
6. [ ] Preview works
7. [ ] Create succeeds
8. [ ] Redirected to success/my-agents

### **Flow 2: Create Agent via Modules**
1. [ ] Navigate to /builder
2. [ ] Click HYBRID
3. [ ] See module library
4. [ ] Drag module to canvas
5. [ ] Configure module
6. [ ] Price updates
7. [ ] Create succeeds

### **Flow 3: Create Agent via Code**
1. [ ] Navigate to /builder
2. [ ] Click ADVANCED
3. [ ] See code editor
4. [ ] Edit code
5. [ ] Validate works
6. [ ] Create succeeds

### **Flow 4: View My Agents**
1. [ ] Navigate to /builder/my-agents
2. [ ] See agent list
3. [ ] Filters work
4. [ ] Search works
5. [ ] Can delete

### **Flow 5: Deploy Agent**
1. [ ] Click Deploy on agent
2. [ ] Modal opens
3. [ ] Connect Wallet button works
4. [ ] Wallet connects (MetaMask)
5. [ ] Network is Base Sepolia
6. [ ] Terms checkbox required
7. [ ] Deploy initiates
8. [ ] Success state shows
9. [ ] Agent status updates

---

## 🐛 Known Issues Documented

- [x] Created KNOWN_ISSUES.md
- [x] Listed all known bugs
- [x] Documented workarounds
- [x] Set priorities

---

## 📚 Documentation Ready

### **For Testers**
- [x] USER_TESTING_GUIDE.md (comprehensive)
- [x] TESTER_QUICK_START.md (5-minute guide)
- [x] FEEDBACK_TEMPLATE.md (structured feedback)
- [x] KNOWN_ISSUES.md (current limitations)

### **For Developers**
- [x] START_HERE.md (project overview)
- [x] DEPLOYMENT_GUIDE.md (how to deploy)
- [x] PRODUCTION_READY.md (production checklist)
- [x] DEPLOYED_CONTRACTS.md (contract info)

### **API Documentation**
- [ ] Swagger/OpenAPI (optional for v1)
- [x] Inline JSDoc comments
- [x] TypeScript types

---

## 🔐 Security

### **Before Testing**
- [x] No secrets in git
- [x] .env files in .gitignore
- [x] API keys are valid
- [x] Wallet has testnet ETH
- [x] CORS configured correctly

### **Wallet Setup**
- [x] MetaMask installed
- [x] Base Sepolia network added
- [x] Test ETH available
- [x] Contract addresses correct

---

## ⚡ Performance

### **Load Times**
- [ ] Homepage < 2s
- [ ] Builder pages < 3s
- [ ] API responses < 500ms
- [ ] Agent creation < 2s

### **Monitoring**
- [ ] Browser console clean
- [ ] No memory leaks
- [ ] No infinite loops
- [ ] Reasonable bundle size

---

## 🧪 Pre-Test Scenarios

### **Run These Before Testers Arrive**

#### Scenario A: Quick Test
```bash
# 1. Create agent via template
# 2. View in my-agents
# 3. Delete agent
# Total time: 2 minutes
```

#### Scenario B: Full Flow
```bash
# 1. Create template agent
# 2. Create modular agent
# 3. Create code agent
# 4. View all in dashboard
# 5. Deploy one agent
# Total time: 10 minutes
```

#### Scenario C: Error Testing
```bash
# 1. Submit empty form (should fail)
# 2. Try to deploy without wallet (should prompt)
# 3. Try to deploy on wrong network (should warn)
# 4. Cancel deployment (should work)
# Total time: 5 minutes
```

---

## 📊 Metrics to Track

### **During Testing**
- Number of testers
- Completion rate per flow
- Time to complete each flow
- Number of bugs found
- Severity of bugs
- User satisfaction scores

### **After Testing**
- Critical bugs (must fix)
- Major bugs (should fix)
- Minor bugs (nice to fix)
- Feature requests
- UX improvements

---

## 🎯 Success Criteria

### **Testing is successful if:**
- [ ] 80%+ testers complete all flows
- [ ] No critical bugs found
- [ ] Average satisfaction ≥ 4/5 stars
- [ ] Users understand the features
- [ ] Deployment works reliably
- [ ] No data loss

### **Ready to launch if:**
- [ ] All critical bugs fixed
- [ ] Major bugs have workarounds
- [ ] Documentation complete
- [ ] User feedback positive
- [ ] Performance acceptable

---

## 🚦 Go/No-Go Decision

### **GO if:**
✅ All critical paths work  
✅ No data loss  
✅ Wallet integration works  
✅ Documentation complete  
✅ Testers are positive  

### **NO-GO if:**
❌ Critical bugs exist  
❌ Data loss possible  
❌ Wallet doesn't work  
❌ Major confusion  
❌ Security concerns  

---

## 📋 Final Checks

### **Right Before Testing**

**5 Minutes Before:**
- [ ] Restart both servers
- [ ] Clear browser cache
- [ ] Test quick flow yourself
- [ ] Check for console errors
- [ ] Verify wallet has testnet ETH

**At Start:**
- [ ] Share testing guide link
- [ ] Share app URL
- [ ] Be available for questions
- [ ] Monitor for issues
- [ ] Take notes

**During Testing:**
- [ ] Watch over shoulder (if possible)
- [ ] Note confusion points
- [ ] Answer questions
- [ ] Don't lead testers
- [ ] Record feedback

**After Testing:**
- [ ] Collect feedback forms
- [ ] Review notes
- [ ] Prioritize issues
- [ ] Thank testers
- [ ] Plan next steps

---

## 🎉 You're Ready!

### **To Start Testing:**

1. **Verify everything is running:**
   ```bash
   curl http://localhost:8200/health
   open http://localhost:3001
   ```

2. **Send testers this link:**
   ```
   http://localhost:3001/builder
   ```

3. **Give them this guide:**
   ```
   TESTER_QUICK_START.md
   ```

4. **Sit back and observe!** 👀

---

## 📝 Notes

- Keep this checklist updated
- Check off items as you verify them
- Add items if you find gaps
- Share with team

---

**Status:** ✅ READY FOR TESTING  
**Next:** Begin user testing session  
**Good luck!** 🚀


