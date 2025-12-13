# Sprint 1 Acceptance Checklist

## Exit Criteria for "Operational Proof"

Complete all items below to truthfully claim:
> "AgentNexus is live on Base mainnet with AA-enabled agent execution."

---

## 1. Contract Deployment ✅

### Verification Commands
```bash
# Check contract deployment on BaseScan
# Replace with your deployed addresses
ESCROW_ADDRESS="0x..."
ENTITLEMENTS_ADDRESS="0x..."

# Verify on BaseScan
echo "https://basescan.org/address/$ESCROW_ADDRESS"
echo "https://basescan.org/address/$ENTITLEMENTS_ADDRESS"
```

### Checklist
- [ ] `AgentNexusEscrow` deployed to Base mainnet
- [ ] `AgentNexusEntitlements` deployed to Base mainnet
- [ ] Both contracts verified on BaseScan
- [ ] USDC added as supported token
- [ ] Summarizer agent (ID: 1) registered

### Evidence Required
- Transaction hash for deployment
- Contract addresses on BaseScan
- Verified source code visible

---

## 2. Account Abstraction ✅

### Verification Commands
```bash
# Run AA happy path test
cd backend
pnpm ts-node scripts/aa-happy-path.ts
```

### Checklist
- [ ] Smart wallet created from email (no MetaMask)
- [ ] Wallet address is deterministic
- [ ] Paymaster configuration present
- [ ] Transaction calldata generated

### Evidence Required
- Screenshot of wallet creation output
- Smart account address

---

## 3. Gas Sponsorship ✅

### Checklist
- [ ] Paymaster policy ID configured (or simulated)
- [ ] User operation prepares without ETH balance check
- [ ] "Gas will be sponsored" message displayed

### Evidence Required
- Paymaster configuration in logs
- Zero balance warning handled

---

## 4. Agent Execution ✅

### Verification Commands
```bash
# Build and test summarizer agent
cd agents/summarizer
docker build -t agentnexus-summarizer .
docker run --rm agentnexus-summarizer python main.py
```

### Checklist
- [ ] Docker container builds successfully
- [ ] Agent runs with demo input
- [ ] Output includes summary + confidence
- [ ] Container runs as non-root user

### Evidence Required
- Docker build success output
- Agent execution JSON response

---

## 5. Payment Settlement ✅

### Checklist
- [ ] Escrow contract can receive deposits
- [ ] Platform fee (2.5%) configured correctly
- [ ] Developer can receive released payments

### Evidence Required
- Platform fee shown in contract (250 bps)
- USDC whitelist confirmed

---

## 6. Demo Recording ✅

### Checklist
- [ ] 2-3 minute video recorded
- [ ] All demo script scenes included
- [ ] "Not a demo environment" line spoken
- [ ] Real transaction hash shown
- [ ] No sensitive information visible

### Evidence Required
- Video file or link (MP4/WebM)

---

## Sprint 1 Completion Summary

### Contract Addresses (Fill After Deploy)
```
Network: Base Mainnet (Chain ID: 8453)
Deployment Date: _______________

AgentNexusEscrow: 0x...
AgentNexusEntitlements: 0x...
Deployment TX: 0x...

Platform Fee: 2.5% (250 bps)
Fee Recipient: 0x...
```

### Grant Language Unlocked
After completing all items, you can truthfully state:

1. **"Core payment contracts are deployed and verified on Base mainnet."**
2. **"AA wallet created via email, gas sponsored."**
3. **"Agents execute in constrained, sandboxed runtimes."**

---

## Quick Verification Script

```bash
#!/bin/bash
# sprint1-verify.sh

echo "=== Sprint 1 Verification ==="

# 1. Check contract deployment
echo "1. Checking contracts..."
cast call $ESCROW_ADDRESS "platformFeePercentage()" --rpc-url base

# 2. Check USDC support
echo "2. Checking USDC support..."
cast call $ESCROW_ADDRESS "supportedTokens(address)(bool)" 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 --rpc-url base

# 3. Check agent registration
echo "3. Checking agent registration..."
cast call $ESCROW_ADDRESS "agentDevelopers(uint256)(address)" 1 --rpc-url base

echo "=== Verification Complete ==="
```
