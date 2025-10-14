# ⚠️ Known Issues & Limitations

**Version:** 1.0.0  
**Last Updated:** October 10, 2025

This document tracks known issues, limitations, and workarounds for the current version.

---

## 🐛 Known Bugs

### **Critical (Blocks Usage)**
*None currently known*

---

### **Major (Affects Experience)**

#### 1. Backend Health Endpoint Path
**Issue:** Health check may return 404 depending on route configuration  
**Workaround:** Use `/health` instead of `/api/health`  
**Status:** Under investigation  
**Priority:** Medium

#### 2. Smart Contract Calls Simulated
**Issue:** Actual smart contract deployment calls are simulated in `DeployAgentModal`  
**Workaround:** Need to add actual contract ABI and implement write calls  
**Status:** Planned  
**Priority:** High

---

### **Minor (Annoying but Workable)**

#### 1. Code Editor Test Run Simulated
**Issue:** "Test Run" in Advanced Builder doesn't actually execute code  
**Workaround:** Use validation instead, or deploy and test  
**Status:** Needs backend sandbox implementation  
**Priority:** Low

#### 2. Module Connection Lines Not Visual
**Issue:** Modular builder doesn't show visual connection lines between modules  
**Workaround:** Modules are listed in order; dependencies are noted  
**Status:** Enhancement for v2  
**Priority:** Low

#### 3. Port Conflicts
**Issue:** Backend defaults to 8200, frontend to 3000 - may conflict if already running  
**Workaround:** Kill existing processes or use different ports  
**Status:** Normal behavior  
**Priority:** Low

```bash
# Kill port 8200
lsof -ti:8200 | xargs kill -9

# Kill port 3000
lsof -ti:3000 | xargs kill -9
```

---

## 🚧 Limitations

### **Current Limitations**

1. **Testnet Only**
   - Currently deployed to Base Sepolia testnet
   - Mainnet deployment requires contract redeployment
   - Need mainnet API keys

2. **No Auto-Save**
   - Agent builder doesn't auto-save progress
   - Data lost if you refresh or navigate away
   - Workaround: Complete agent creation in one session

3. **No Agent Editing**
   - Can't edit agents after creation
   - Can delete and recreate
   - Edit feature planned for v2

4. **Limited Templates**
   - Only 5 templates available
   - More to be added
   - Custom template creation not yet available

5. **Limited Modules**
   - 13 modules available
   - Some modules may have placeholder configs
   - More modules planned

6. **No Real Execution**
   - Agents can be created but don't actually execute yet
   - Execution service planned for v1.5
   - Docker runtime is in place but not integrated

7. **No Analytics**
   - No usage analytics dashboard
   - Can't see agent performance
   - Planned for v2

8. **Single User**
   - No multi-user auth yet
   - Uses mock user ID
   - Auth system planned

---

## 🔍 Browser Compatibility

### **Tested:**
- ✅ Chrome 118+ (Best support)
- ✅ Firefox 119+ (Good support)
- ✅ Safari 17+ (Good support)
- ✅ Edge 118+ (Good support)

### **Known Issues:**
- Monaco Editor may be slow on older browsers
- Drag-and-drop may lag on Firefox < 115
- Dark mode may flicker on Safari < 16

### **Not Tested:**
- Internet Explorer (not supported)
- Opera (should work)
- Brave (should work)
- Arc (should work)

---

## 📱 Mobile/Tablet Support

### **Status:**
- **Desktop:** ✅ Fully supported
- **Tablet:** ⚠️ Partially supported
- **Mobile:** ⚠️ Limited support

### **Known Issues:**
- Drag-and-drop difficult on touchscreens
- Monaco Editor not optimized for mobile
- Some modals may be cut off
- Touch targets may be too small

### **Recommendation:**
- Use desktop for best experience
- Tablet usable for Template Builder
- Mobile not recommended for Modular/Advanced

---

## ⚙️ Performance Issues

### **Known Performance Bottlenecks:**

1. **Large Agent Lists**
   - My Agents page may slow with 100+ agents
   - No pagination yet
   - Workaround: Use filters/search

2. **Monaco Editor Initial Load**
   - First load of code editor takes 2-3 seconds
   - Lazy loaded to improve page load
   - Normal behavior

3. **Module Library**
   - All modules loaded at once
   - May lag with 50+ modules
   - Current 13 modules perform fine

---

## 🔐 Security Considerations

### **Known Security Items:**

1. **Environment Variables**
   - API keys in .env.local
   - Not committed to git (as expected)
   - Ensure .gitignore is configured

2. **Wallet Security**
   - Uses RainbowKit (secure)
   - Never accesses private keys
   - Always review transactions

3. **Smart Contract Permissions**
   - Backend needs MINTER/BURNER roles
   - Deployer has admin roles
   - Follow principle of least privilege

4. **CORS Configuration**
   - Backend allows frontend URL
   - Update for production domain
   - Don't allow `*` in production

---

## 🛠️ Workarounds

### **Common Workarounds:**

#### Port Already in Use
```bash
# Find process
lsof -ti:8200

# Kill it
lsof -ti:8200 | xargs kill -9

# Or use different port
PORT=8201 pnpm dev
```

#### Can't Connect Wallet
```bash
# 1. Install MetaMask
# 2. Add Base Sepolia:
Network Name: Base Sepolia
RPC URL: https://sepolia.base.org
Chain ID: 84532
Currency: ETH
Explorer: https://sepolia.basescan.org

# 3. Get testnet ETH:
https://www.base.org/faucet
```

#### Agent Won't Create
```bash
# Check backend logs
cd backend
pnpm dev

# Check browser console (F12)
# Look for error messages

# Verify API connection
curl http://localhost:8200/health
```

#### Frontend Won't Load
```bash
# Clear Next.js cache
cd frontend
rm -rf .next
pnpm dev

# Or clear browser cache
# Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

---

## 📋 Testing Checklist

### **Before Reporting a Bug:**

- [ ] Check this document (is it known?)
- [ ] Check browser console for errors
- [ ] Try refreshing the page
- [ ] Try in incognito/private mode
- [ ] Try a different browser
- [ ] Check backend is running
- [ ] Check network tab (F12)

### **Bug Report Should Include:**

1. **What you were doing**
2. **What went wrong**
3. **What you expected**
4. **Browser & version**
5. **Screenshot/video (if possible)**
6. **Console errors (F12)**
7. **Steps to reproduce**

---

## 🎯 Planned Fixes

### **High Priority:**
- [ ] Implement actual smart contract deployment
- [ ] Add real contract ABIs
- [ ] Fix backend health endpoint
- [ ] Add error boundaries
- [ ] Improve error messages

### **Medium Priority:**
- [ ] Add auto-save
- [ ] Add agent editing
- [ ] Add pagination
- [ ] Improve mobile support
- [ ] Add loading skeletons

### **Low Priority:**
- [ ] Add module connection lines
- [ ] Add code editor test execution
- [ ] Add keyboard shortcuts
- [ ] Add undo/redo
- [ ] Add analytics

---

## 🔄 Version History

### **v1.0.0** (October 10, 2025)
- Initial release
- 3 builder methods
- Wallet integration
- Basic deployment

### **Upcoming:**
- v1.1.0: Bug fixes from user testing
- v1.2.0: Agent editing
- v1.5.0: Execution service
- v2.0.0: Full production features

---

## 📝 Notes

### **For Developers:**
- See backend logs for detailed errors
- Check Prisma queries in database
- Verify environment variables
- Test with real wallet first

### **For Testers:**
- Focus on critical paths first
- Try to break things
- Think like a user
- Document everything

### **For Users:**
- Backup important work
- Don't use mainnet yet
- Report any issues
- Be patient with beta

---

## 🆘 Emergency Contacts

**Critical Issues:**
- Check GitHub issues first
- Discord: [server-link]
- Email: support@agentnexus.io

**Non-Critical:**
- Use feedback form
- Create GitHub issue
- Ask in Discord

---

**Last Updated:** October 10, 2025  
**Next Review:** After user testing

*This document will be updated as new issues are discovered.*

