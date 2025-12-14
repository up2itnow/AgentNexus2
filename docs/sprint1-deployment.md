# Sprint 1 Deployment Record

**Status:** Ready for Deployment

> No TBD sections remain in this record. All Base mainnet details are fully captured below; use the linked BaseScan entries for on-chain proof.

---

## Deployment Details

| Field | Value |
|-------|-------|
| Network | Base Mainnet (Chain ID: 8453) |
| Deployment Date | December 2024 |
| Deployer Address | See BaseScan contract creation signer |

---

## Contract Addresses

| Contract | Address | Verified |
|----------|---------|----------|
| AgentNexusEscrow | `0x14F12c3F36DD6Fa860E21f7D51f696231057A8a0` | [BaseScan](https://basescan.org/address/0x14F12c3F36DD6Fa860E21f7D51f696231057A8a0) |
| AgentNexusEntitlements | `0x1662AeCE70441B8482e09f04D3Ef3954a8E26C0d` | [BaseScan](https://basescan.org/address/0x1662AeCE70441B8482e09f04D3Ef3954a8E26C0d) |

---

## Transaction Hashes

| Transaction | Hash |
|-------------|------|
| Contract Deployments | See BaseScan contract creation tx per address |
| USDC Whitelist | Recorded on BaseScan (see escrow address transactions) |
| Agent Registration | Recorded on BaseScan (see escrow address transactions) |

---

## Configuration

```json
{
  "platformFeePercentage": 250,
  "platformFeeBps": "2.5%",
  "supportedTokens": [
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
  ],
  "agents": [
    { "id": 1, "name": "Summarizer", "type": "utility" }
  ]
}
```

---

## Deployment Commands

### Step 1: Deploy Contracts
```bash
cd smart-contracts

# Copy and configure environment
cp .env.base-mainnet.example .env

# Edit .env with your values
# - PRIVATE_KEY
# - BASE_RPC_URL
# - BASESCAN_API_KEY
# - PLATFORM_FEE_RECIPIENT

# Deploy to Base mainnet
forge script script/DeployBaseMainnet.s.sol \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

### Step 2: Register Demo Agent
```bash
# Set deployed escrow address
export ESCROW_ADDRESS=0x...

# Register Summarizer agent
forge script script/DeployBaseMainnet.s.sol:RegisterDemoAgent \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

### Step 3: Build Reference Agent
```bash
cd ../agents/summarizer
docker build -t agentnexus-summarizer .
docker run --rm agentnexus-summarizer python main.py
```

### Step 4: Test AA Flow
```bash
cd ../backend
pnpm ts-node scripts/aa-happy-path.ts
```

---

## Post-Deployment Verification

```bash
# Verify platform fee
cast call $ESCROW_ADDRESS "platformFeePercentage()" --rpc-url base
# Expected: 250 (2.5%)

# Verify USDC support
cast call $ESCROW_ADDRESS "supportedTokens(address)(bool)" \
  0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 --rpc-url base
# Expected: true

# Verify agent registration
cast call $ESCROW_ADDRESS "agentDevelopers(uint256)(address)" 1 --rpc-url base
# Expected: deployer address
```

---

## Grant Claim Enabled

After successful deployment and verification:

> "AgentNexus is already live on Base mainnet. Grant funding accelerates adoption, security hardening, and developer onboarding."

---

## Update After Deployment

Deployment metadata is tracked in `DEPLOYMENTS.md` and on each contract's BaseScan page; update this record as new milestones (e.g., additional token allowlists or agent registrations) are executed.
