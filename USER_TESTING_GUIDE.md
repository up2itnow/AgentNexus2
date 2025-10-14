# 👥 AgentNexus User Testing Guide

**Version:** 1.0.0  
**Date:** October 10, 2025  
**Status:** Ready for Testing

---

## 🎯 Testing Overview

Thank you for testing AgentNexus! This guide will help you test the complete agent builder system and provide valuable feedback.

**App URLs:**
- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:8200

**Estimated Time:** 30-45 minutes for full testing

---

## 📋 Quick Start for Testers

### **Prerequisites**
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Crypto wallet with MetaMask installed (for deployment testing)
- Base Sepolia testnet ETH (free from faucet if needed)

### **What You'll Test**
1. **Template Builder** (Beginner) - ~5 minutes
2. **Modular Builder** (Hybrid) - ~10 minutes
3. **Code Editor** (Advanced) - ~10 minutes
4. **My Agents Dashboard** - ~5 minutes
5. **Wallet Connection & Deployment** - ~10 minutes

---

## 🧪 Test Scenarios

### **Scenario 1: Template Builder (Beginner Path)**

**Goal:** Create an agent using a pre-built template

**Steps:**
1. Open http://localhost:3001/builder
2. Click **"Start"** on the **🟢 BEGINNER** card
3. Browse the template gallery (5 templates)
4. Select **"Price Tracker"** template
5. Fill in the configuration form:
   - Agent Name: "My Test Price Bot"
   - Description: "Testing the template builder"
   - Symbols: "ETH, BTC"
   - Threshold: 5
   - Alert Method: Discord (or Email)
6. Click **"Preview"** button
7. Review the preview modal
8. Click **"Create Agent"**
9. Wait for success message

**Expected Outcome:**
- ✅ Template grid loads smoothly
- ✅ Configuration form is intuitive
- ✅ Preview shows correct information
- ✅ Agent is created successfully
- ✅ Redirected to agent detail page (or success message)

**Questions:**
- [ ] Was the template selection clear?
- [ ] Was the form easy to fill out?
- [ ] Did you understand what each field does?
- [ ] Did the preview help you confirm your choices?
- [ ] Overall difficulty: Easy / Medium / Hard?

---

### **Scenario 2: Modular Builder (Hybrid Path)**

**Goal:** Build a custom agent by combining modules

**Steps:**
1. Go to http://localhost:3001/builder
2. Click **"Start"** on the **🟡 HYBRID** card
3. Fill in basic info at the top:
   - Name: "My Social Sentiment Bot"
   - Description: "Monitors crypto sentiment on Twitter"
   - Category: Social
4. From the left sidebar, **drag** "Twitter API" module to the canvas
5. Click on the Twitter API module to configure it:
   - Keywords: "crypto, bitcoin, ethereum"
   - Limit: 100
6. Drag "Sentiment Analysis" module to canvas
7. Drag "Alert Action" module to canvas
8. Configure the Alert Action module:
   - Channel: Discord
   - Webhook URL: (can be fake for testing)
9. Notice the price updating in the bottom right
10. Click **"Preview"**
11. Review the preview
12. Click **"Create Agent"**

**Expected Outcome:**
- ✅ Drag-and-drop works smoothly
- ✅ Modules snap into place on canvas
- ✅ Configuration panel appears when clicking modules
- ✅ Price updates automatically
- ✅ Preview shows all modules
- ✅ Agent is created successfully

**Questions:**
- [ ] Was drag-and-drop intuitive?
- [ ] Could you easily configure each module?
- [ ] Was the visual layout helpful?
- [ ] Did you understand how modules connect?
- [ ] Overall difficulty: Easy / Medium / Hard?

---

### **Scenario 3: Code Editor (Advanced Path)**

**Goal:** Write custom agent code

**Steps:**
1. Go to http://localhost:3001/builder
2. Click **"Start"** on the **🔴 ADVANCED** card
3. Review the default code in the Monaco editor
4. Modify the code:
   - Change the agent name in the `config` object
   - Change the description
   - Modify the `execute()` function logic (optional)
5. Try inserting a snippet from the left panel:
   - Click on "API Call" snippet
6. Click **"Validate"** to check syntax
7. Review any errors/warnings in the console
8. Click **"Test Run"** (simulated for now)
9. Click **"Preview"**
10. Click **"Create Agent"**

**Expected Outcome:**
- ✅ Code editor loads with syntax highlighting
- ✅ Typing feels smooth (like VS Code)
- ✅ Snippets insert correctly
- ✅ Validation catches errors
- ✅ Test run provides feedback
- ✅ Agent is created successfully

**Questions:**
- [ ] Was the code editor comfortable to use?
- [ ] Were the snippets helpful?
- [ ] Did validation help you?
- [ ] Would you use this for production?
- [ ] Overall difficulty: Easy / Medium / Hard?

---

### **Scenario 4: My Agents Dashboard**

**Goal:** Manage created agents

**Steps:**
1. Go to http://localhost:3001/builder/my-agents
2. View your created agents
3. Try the filters:
   - Filter by status (Draft/Deployed)
   - Filter by build method
   - Use the search box
4. Click **"Edit"** on an agent (should navigate to builder)
5. Go back to My Agents
6. Try to delete an agent (click ✗ icon, confirm)

**Expected Outcome:**
- ✅ All created agents are listed
- ✅ Filters work correctly
- ✅ Search works
- ✅ Edit navigates to correct builder
- ✅ Delete requires confirmation
- ✅ List updates after deletion

**Questions:**
- [ ] Was the dashboard easy to navigate?
- [ ] Were the filters useful?
- [ ] Could you find agents easily?
- [ ] Any missing features?

---

### **Scenario 5: Wallet Connection & Deployment**

**Goal:** Connect wallet and deploy an agent

**Prerequisites:**
- MetaMask installed
- Base Sepolia testnet configured
- Some testnet ETH (get from faucet if needed)

**Steps:**
1. Go to http://localhost:3001/builder/my-agents
2. Find an agent that's not deployed (shows "Draft")
3. Click **"Deploy"** button
4. Review the deployment modal
5. Read the "What happens when you deploy?" section
6. If wallet not connected, click **"Connect Wallet"**
7. Select MetaMask (or your wallet)
8. Approve the connection
9. Ensure you're on Base Sepolia network (Chain ID: 84532)
10. Check the **"I agree to terms"** checkbox
11. Click **"Deploy Now"**
12. Wait for the process to complete

**Expected Outcome:**
- ✅ Deploy modal opens smoothly
- ✅ Wallet connection is clear
- ✅ Network validation works
- ✅ Terms checkbox is required
- ✅ Deployment process is clear
- ✅ Success state shows
- ✅ Agent status updates to "Deployed"

**Questions:**
- [ ] Was wallet connection easy?
- [ ] Did you understand the deployment process?
- [ ] Was network switching clear?
- [ ] Did you feel confident deploying?
- [ ] Any confusing steps?

---

## 🎨 UI/UX Testing

### **General Experience**

Please rate these aspects (1-5 stars):

**Visual Design:**
- [ ] Color scheme is appealing
- [ ] Layout is clean and organized
- [ ] Icons are intuitive
- [ ] Typography is readable
- [ ] Spacing is comfortable

**Navigation:**
- [ ] Easy to find features
- [ ] Back buttons work as expected
- [ ] Breadcrumbs are helpful
- [ ] Menu is intuitive
- [ ] Links are clear

**Responsiveness:**
- [ ] Try on mobile/tablet (if possible)
- [ ] Works on different screen sizes
- [ ] Touch targets are large enough
- [ ] Text is readable on all devices

**Dark Mode:**
- [ ] Toggle dark mode (if system supports)
- [ ] All text is readable
- [ ] Colors are pleasing
- [ ] No glaring white elements

---

## 🐛 Bug Tracking

### **Issues to Watch For**

Please note if you encounter:

**Critical Issues (Prevents Usage):**
- [ ] App crashes or freezes
- [ ] Cannot create agents
- [ ] Cannot save work
- [ ] Buttons don't work
- [ ] Forms don't submit

**Major Issues (Affects Experience):**
- [ ] Slow loading times
- [ ] Confusing error messages
- [ ] Lost data
- [ ] Wallet won't connect
- [ ] Deployment fails

**Minor Issues (Annoying but Workable):**
- [ ] Typos or grammar
- [ ] Alignment issues
- [ ] Missing tooltips
- [ ] Unclear labels
- [ ] Inconsistent styling

**Enhancement Requests:**
- [ ] Features you wish existed
- [ ] Better ways to do things
- [ ] Missing information
- [ ] Confusing workflows

---

## 📝 Feedback Form

### **Overall Experience**

**How would you rate AgentNexus overall?**
- [ ] ⭐⭐⭐⭐⭐ Excellent
- [ ] ⭐⭐⭐⭐ Good
- [ ] ⭐⭐⭐ Average
- [ ] ⭐⭐ Below Average
- [ ] ⭐ Poor

**Would you recommend AgentNexus to others?**
- [ ] Definitely
- [ ] Probably
- [ ] Not sure
- [ ] Probably not
- [ ] Definitely not

**What did you like most?**
```
[Your answer here]
```

**What needs improvement?**
```
[Your answer here]
```

**Any confusing parts?**
```
[Your answer here]
```

**What would you add/change?**
```
[Your answer here]
```

---

## 🎯 Specific Questions

### **Template Builder**
1. Did you find a template that matched your needs?
2. Was the configuration form intuitive?
3. Any fields you didn't understand?
4. Suggestions for improvement?

### **Modular Builder**
1. Was drag-and-drop easy to use?
2. Could you understand how modules work?
3. Was the visual layout helpful?
4. What would make it better?

### **Code Editor**
1. Did the editor feel professional?
2. Were snippets helpful?
3. What other snippets would you want?
4. Any missing features?

### **Deployment**
1. Did you feel confident deploying?
2. Was the wallet connection smooth?
3. Did you understand the cost?
4. Any security concerns?

---

## 🚨 Critical Paths to Test

### **Must Work:**
1. ✅ Can create agent (any method)
2. ✅ Can view created agents
3. ✅ Can connect wallet
4. ✅ Can deploy agent
5. ✅ No data loss
6. ✅ Error messages are clear

### **Should Work:**
1. ✅ Preview before creating
2. ✅ Edit agents
3. ✅ Delete agents
4. ✅ Filter/search agents
5. ✅ Dark mode
6. ✅ Mobile responsive

### **Nice to Have:**
1. Keyboard shortcuts
2. Undo/redo
3. Auto-save
4. Export/import
5. Templates marketplace
6. Agent analytics

---

## 📊 Performance Testing

Please note:

**Load Times:**
- Page load time: _______ seconds
- Create agent time: _______ seconds
- Deploy time: _______ seconds

**Issues:**
- [ ] Slow animations
- [ ] Laggy interactions
- [ ] Long wait times
- [ ] Freezing/stuttering

---

## 🎯 User Personas

### **Which persona are you?**

**Beginner Bob:**
- First time using no-code tools
- Wants simple, guided experience
- Prefers templates
- Concerned about making mistakes

**Hybrid Hannah:**
- Some technical knowledge
- Comfortable with visual tools
- Likes flexibility
- Wants to customize

**Advanced Alex:**
- Professional developer
- Prefers code over UI
- Wants full control
- Values efficiency

**Your persona:** _______________

**Did the app cater to your needs?** _______________

---

## 💬 Contact & Feedback

### **How to Submit Feedback**

**During Testing:**
- Take screenshots of issues
- Note the time of bugs
- Write down questions
- Record suggestions

**After Testing:**
- Fill out this guide
- Send to: [your-email@example.com]
- Or create GitHub issue
- Or direct message

---

## 🎉 Thank You!

Your feedback is invaluable for making AgentNexus better!

**What happens next:**
1. We'll review your feedback
2. Fix critical issues
3. Prioritize improvements
4. Release updates
5. Keep you posted!

---

## 📚 Additional Resources

**For Testers:**
- [START_HERE.md](./START_HERE.md) - Quick start guide
- [DEPLOYED_CONTRACTS.md](./DEPLOYED_CONTRACTS.md) - Contract info
- Base Sepolia Faucet: https://www.base.org/faucet

**Support:**
- Documentation: See project docs/
- Issues: [GitHub Issues]
- Questions: [Discord/Email]

---

**Happy Testing! 🚀**

*Built with ❤️ for AgentNexus*  
*Version 1.0.0 - October 10, 2025*

