# 🚀 Quick Start for Testers

**Welcome to AgentNexus Testing!**

This is a **5-minute quick start** to get you testing immediately.

---

## ⚡ Super Quick Start

### **1. Open the App**
```
http://localhost:3001/builder
```

### **2. Click the Green Card**
Click **"Start"** on the **🟢 BEGINNER** card

### **3. Pick a Template**
Click **"Select"** on any template

### **4. Fill the Form**
- Enter a name
- Fill in the fields
- Click **"Create Agent"**

### **5. Done!**
You just created your first agent! 🎉

---

## 📋 Full Testing (30 minutes)

### **Test 1: Template Builder** (5 min)
```
1. Go to: http://localhost:3001/builder
2. Click: 🟢 BEGINNER
3. Select any template
4. Fill out form
5. Click: Create Agent
```

### **Test 2: Modular Builder** (10 min)
```
1. Go to: http://localhost:3001/builder
2. Click: 🟡 HYBRID
3. Drag modules to canvas
4. Configure each module
5. Click: Create Agent
```

### **Test 3: Code Editor** (10 min)
```
1. Go to: http://localhost:3001/builder
2. Click: 🔴 ADVANCED
3. Edit the code
4. Click: Validate
5. Click: Create Agent
```

### **Test 4: View & Deploy** (5 min)
```
1. Go to: http://localhost:3001/builder/my-agents
2. See your created agents
3. Click: Deploy
4. Connect wallet (MetaMask)
5. Confirm deployment
```

---

## 🎯 What to Test

### **Must Test:**
- [ ] Can you create an agent?
- [ ] Can you see your agents?
- [ ] Can you connect a wallet?
- [ ] Does everything load quickly?
- [ ] Are there any errors?

### **Should Test:**
- [ ] Try all 3 builder methods
- [ ] Edit an agent
- [ ] Delete an agent
- [ ] Filter/search agents
- [ ] Dark mode (if available)

### **Nice to Test:**
- [ ] Try on mobile
- [ ] Try different browsers
- [ ] Test with slow internet
- [ ] Stress test (create many agents)

---

## 🐛 Report Bugs

### **Found a bug?**

**Quick report format:**
```
Where: [Which page/feature]
What: [What happened]
Expected: [What should happen]
Steps: [How to reproduce]
```

**Example:**
```
Where: Template Builder
What: Create button doesn't work
Expected: Should create agent
Steps: 
  1. Select template
  2. Fill form
  3. Click Create
  4. Nothing happens
```

---

## 💡 Give Feedback

### **Quick feedback:**
- **Liked:** What worked well?
- **Disliked:** What was frustrating?
- **Confused:** What was unclear?
- **Missing:** What's missing?
- **Suggestion:** What would you change?

---

## 🆘 Need Help?

### **Common Issues:**

**Can't connect wallet?**
- Install MetaMask
- Switch to Base Sepolia network
- Get testnet ETH from faucet

**App won't load?**
- Check URL: http://localhost:3001
- Try refreshing (Cmd+R or Ctrl+R)
- Clear cache and reload

**Button doesn't work?**
- Check browser console (F12)
- Take a screenshot
- Note what you clicked

---

## 📊 Test Checklist

Quick checklist for complete testing:

```
🟢 Template Builder
[ ] Load page
[ ] Select template
[ ] Fill form
[ ] Preview
[ ] Create agent
[ ] Success message

🟡 Modular Builder
[ ] Load page
[ ] See modules
[ ] Drag to canvas
[ ] Configure module
[ ] See price update
[ ] Create agent

🔴 Code Editor
[ ] Load editor
[ ] Edit code
[ ] Insert snippet
[ ] Validate
[ ] Create agent

📊 My Agents
[ ] View list
[ ] Filter agents
[ ] Search agents
[ ] Edit agent
[ ] Delete agent

🔐 Deployment
[ ] Open deploy modal
[ ] Connect wallet
[ ] See network
[ ] Agree to terms
[ ] Deploy agent
```

---

## ⏱️ Time Estimates

| Task | Time | Priority |
|------|------|----------|
| Template Builder | 5 min | HIGH |
| Modular Builder | 10 min | HIGH |
| Code Editor | 10 min | MEDIUM |
| My Agents | 5 min | HIGH |
| Wallet & Deploy | 10 min | MEDIUM |
| **Total** | **40 min** | |

---

## 🎉 You're Ready!

**Open:** http://localhost:3001/builder

**Start building!** 🚀

---

**Questions?** See [USER_TESTING_GUIDE.md](./USER_TESTING_GUIDE.md) for details.

**Feedback?** Use [FEEDBACK_TEMPLATE.md](./FEEDBACK_TEMPLATE.md).

