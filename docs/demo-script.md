# AgentNexus Sprint 1 Demo Script

## 2-3 Minute Recording Guide

### Overview
This demo proves the **complete flow** from email signup to agent execution on Base mainnet.

**Key Message (Use This Exact Line):**
> "This is not a demo environment. This transaction is settling on Base mainnet."

---

## Recording Setup

### Prerequisites
- [ ] Terminal with colored output
- [ ] Browser open to BaseScan
- [ ] Screen recording software (OBS/Loom)
- [ ] Contracts deployed to Base mainnet

### Environment
```bash
# Verify environment
echo "Node version: $(node --version)"
echo "Network: Base Mainnet (Chain ID: 8453)"
echo "Escrow: $ESCROW_ADDRESS"
```

---

## Demo Flow (Follow Exactly)

### Scene 1: Introduction (15 seconds)
**Show:** Terminal or homepage
**Say:**
> "I'm going to show you AgentNexus executing a real AI agent with payment settlement on Base mainnet."

---

### Scene 2: Email Signup (30 seconds)
**Show:** Smart wallet creation
**Action:**
```bash
# Run the AA happy path script
cd backend
pnpm ts-node scripts/aa-happy-path.ts
```
**Say:**
> "I enter an email address. No MetaMask, no seed phrases. The smart wallet is created automatically."

**Highlight:**
- Wallet address generated
- "No MetaMask required" message

---

### Scene 3: Gas Sponsorship (20 seconds)
**Show:** Transaction preparation
**Say:**
> "Notice there's no gas prompt. The platform sponsors transaction fees for a frictionless experience."

**Highlight:**
- Paymaster configuration
- "Gas will be sponsored" message

---

### Scene 4: Agent Purchase (30 seconds)
**Show:** Escrow deposit preparation
**Say:**
> "The user purchases access to the Summarizer agent. Payment goes into escrow - protected for both parties."

**Highlight:**
- Payment ID
- 1 USDC amount
- Escrow contract interaction

---

### Scene 5: Agent Execution (30 seconds)
**Show:** Agent container running
**Action:**
```bash
# Run the summarizer agent
docker run --rm agentnexus-summarizer python main.py
```
**Say:**
> "The agent executes in a sandboxed container. No network access, resource limits enforced."

**Highlight:**
- Execution output
- Confidence score (0.99)

---

### Scene 6: Payment Settlement (20 seconds)
**Show:** BaseScan transaction
**Say (CRITICAL LINE):**
> "This is not a demo environment. This transaction is settling on Base mainnet."

**Highlight:**
- Real transaction hash
- Contract address on BaseScan

---

### Scene 7: Closing (15 seconds)
**Show:** Summary screen or contracts on BaseScan
**Say:**
> "AgentNexus: Trustless AI agent execution with account abstraction. Live on Base mainnet today."

---

## Do's and Don'ts

### ✅ Do
- Use the exact "not a demo environment" line
- Show real transaction hashes
- Emphasize "no MetaMask" and "no gas prompt"
- Keep energy confident but not rushed

### ❌ Don't
- Show private keys or sensitive config
- Skip steps or cut important moments
- Apologize for anything
- Mention features not yet built

---

## Post-Recording Checklist

- [ ] Video is 2-3 minutes long
- [ ] All 6 scenes are included
- [ ] "Not a demo environment" line is clear
- [ ] Transaction hash is visible
- [ ] No sensitive information shown
