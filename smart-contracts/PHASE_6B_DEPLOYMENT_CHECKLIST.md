# Phase 6B: Smart Contract Deployment Checklist ✅

**AgentNexus Project - Base L2 Grant Application**

Date: October 7, 2025  
Phase: 6B - Smart Contract Deployment to Base Sepolia  
Status: 🚀 **IN PROGRESS**

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### 1. Security Audit ✅
- [x] Run Slither static analysis
- [x] Review security findings
- [x] Gas optimization pass
- [x] Test coverage >80%

### 2. Environment Setup
- [ ] Base Sepolia RPC URL configured
- [ ] Deployer wallet funded with ETH
- [ ] Private key in .env file
- [ ] Basescan API key for verification

### 3. Contract Review
- [x] AgentNexusEscrow audited
- [x] AgentNexusEntitlements audited
- [x] Access control configured
- [x] ReentrancyGuard implemented

---

## 🔧 DEPLOYMENT CONFIGURATION

### Network: Base Sepolia
```bash
Chain ID: 84532
RPC URL: https://sepolia.base.org
Block Explorer: https://sepolia.basescan.org
Faucet: https://www.base.org/faucet
```

### Contract Addresses (To Be Filled After Deployment)
```
AgentNexusEscrow: 0x...
AgentNexusEntitlements: 0x...
Platform Fee Recipient: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1
```

### Configuration Parameters
```
Platform Fee: 250 bps (2.5%)
Base URI: https://api.agentnexus.io/metadata/
Testnet USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Setup Environment Variables
```bash
cd smart-contracts

# Create .env file
cat > .env << 'EOF'
PRIVATE_KEY=your_private_key_here
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASESCAN_API_KEY=your_basescan_api_key_here
PLATFORM_FEE_RECIPIENT=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1
EOF
```

### Step 2: Verify Deployer Balance
```bash
# Check balance (need at least 0.1 ETH for deployment + gas)
cast balance <DEPLOYER_ADDRESS> --rpc-url $BASE_SEPOLIA_RPC
```

**Minimum Requirements:**
- 0.05 ETH for contract deployment
- 0.03 ETH for verification
- 0.02 ETH for initial configuration

### Step 3: Deploy Contracts
```bash
# Deploy to Base Sepolia
forge script script/Deploy.s.sol:TestnetDeployScript \
  --rpc-url $BASE_SEPOLIA_RPC \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY \
  -vvvv
```

**Expected Output:**
```
Deploying to Base Sepolia testnet
Deployer: 0x...
Deployed AgentNexusEscrow: 0x...
Deployed AgentNexusEntitlements: 0x...
Added testnet USDC as supported token
```

### Step 4: Verify Contracts on Basescan
```bash
# Manual verification if auto-verify fails
forge verify-contract \
  <ESCROW_ADDRESS> \
  src/AgentNexusEscrow.sol:AgentNexusEscrow \
  --chain-id 84532 \
  --etherscan-api-key $BASESCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,uint256)" $PLATFORM_FEE_RECIPIENT 250)

forge verify-contract \
  <ENTITLEMENTS_ADDRESS> \
  src/AgentNexusEntitlements.sol:AgentNexusEntitlements \
  --chain-id 84532 \
  --etherscan-api-key $BASESCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(string)" "https://api.agentnexus.io/metadata/")
```

---

## ⚙️ POST-DEPLOYMENT CONFIGURATION

### Step 5: Grant Backend Roles
```bash
# Get backend wallet address
BACKEND_WALLET=0x... # Your backend wallet address

# Grant ORCHESTRATOR_ROLE to backend (for escrow operations)
cast send $ESCROW_ADDRESS \
  "grantRole(bytes32,address)" \
  $(cast keccak "ORCHESTRATOR_ROLE") \
  $BACKEND_WALLET \
  --rpc-url $BASE_SEPOLIA_RPC \
  --private-key $PRIVATE_KEY

# Grant MINTER_ROLE to backend (for entitlement minting)
cast send $ENTITLEMENTS_ADDRESS \
  "grantRole(bytes32,address)" \
  $(cast keccak "MINTER_ROLE") \
  $BACKEND_WALLET \
  --rpc-url $BASE_SEPOLIA_RPC \
  --private-key $PRIVATE_KEY

# Grant BURNER_ROLE to backend (for entitlement burning if needed)
cast send $ENTITLEMENTS_ADDRESS \
  "grantRole(bytes32,address)" \
  $(cast keccak "BURNER_ROLE") \
  $BACKEND_WALLET \
  --rpc-url $BASE_SEPOLIA_RPC \
  --private-key $PRIVATE_KEY
```

### Step 6: Configure Backend Environment
```bash
# Update backend/.env.production
cat >> backend/.env.production << EOF

# Smart Contract Addresses (Base Sepolia)
CHAIN_ID=84532
ESCROW_CONTRACT_ADDRESS=<DEPLOYED_ESCROW_ADDRESS>
ENTITLEMENTS_CONTRACT_ADDRESS=<DEPLOYED_ENTITLEMENTS_ADDRESS>
BASE_SEPOLIA_RPC=https://sepolia.base.org
EOF
```

### Step 7: Configure Frontend Environment
```bash
# Update frontend/.env.production
cat >> frontend/.env.production << EOF

# Smart Contract Addresses (Base Sepolia)
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_ESCROW_ADDRESS=<DEPLOYED_ESCROW_ADDRESS>
NEXT_PUBLIC_ENTITLEMENTS_ADDRESS=<DEPLOYED_ENTITLEMENTS_ADDRESS>
NEXT_PUBLIC_BASE_RPC=https://sepolia.base.org
EOF
```

---

## 🧪 INTEGRATION TESTING

### Step 8: Test Deposit Flow
```bash
# Test depositing ETH
cast send $ESCROW_ADDRESS \
  "deposit(string)" \
  "test-agent-id" \
  --value 0.01ether \
  --rpc-url $BASE_SEPOLIA_RPC \
  --private-key $PRIVATE_KEY

# Verify balance
cast call $ESCROW_ADDRESS \
  "getBalance(string,address)" \
  "test-agent-id" \
  $BACKEND_WALLET \
  --rpc-url $BASE_SEPOLIA_RPC
```

### Step 9: Test Entitlement Minting
```bash
# Mint entitlement token
cast send $ENTITLEMENTS_ADDRESS \
  "mint(address,uint256,uint256)" \
  <USER_ADDRESS> \
  1 \
  1 \
  --rpc-url $BASE_SEPOLIA_RPC \
  --private-key $PRIVATE_KEY

# Verify balance
cast call $ENTITLEMENTS_ADDRESS \
  "balanceOf(address,uint256)" \
  <USER_ADDRESS> \
  1 \
  --rpc-url $BASE_SEPOLIA_RPC
```

### Step 10: Test Full Payment Flow
```bash
# 1. User deposits ETH for agent purchase
# 2. Backend mints entitlement token
# 3. User executes agent (backend checks entitlement)
# 4. Backend processes execution
# 5. Verify all events emitted correctly
```

---

## 📊 GAS ANALYSIS

### Deployment Costs (Estimated)
```
AgentNexusEscrow: ~1,500,000 gas (~0.015 ETH @ 10 gwei)
AgentNexusEntitlements: ~2,000,000 gas (~0.020 ETH @ 10 gwei)
Total Deployment: ~0.035 ETH
```

### Operation Costs (Estimated)
```
deposit(): ~50,000 gas (~0.0005 ETH)
mint(): ~80,000 gas (~0.0008 ETH)
burn(): ~45,000 gas (~0.00045 ETH)
withdraw(): ~60,000 gas (~0.0006 ETH)
```

---

## 📄 CONTRACT ABI EXPORT

### Step 11: Export ABIs for Frontend/Backend
```bash
# Export Escrow ABI
cat out/AgentNexusEscrow.sol/AgentNexusEscrow.json | jq '.abi' > backend/src/contracts/AgentNexusEscrow.json
cat out/AgentNexusEscrow.sol/AgentNexusEscrow.json | jq '.abi' > frontend/src/contracts/AgentNexusEscrow.json

# Export Entitlements ABI
cat out/AgentNexusEntitlements.sol/AgentNexusEntitlements.json | jq '.abi' > backend/src/contracts/AgentNexusEntitlements.json
cat out/AgentNexusEntitlements.sol/AgentNexusEntitlements.json | jq '.abi' > frontend/src/contracts/AgentNexusEntitlements.json
```

---

## ✅ SUCCESS CRITERIA

### Deployment Success
- [ ] Both contracts deployed to Base Sepolia
- [ ] Contracts verified on Basescan
- [ ] Source code visible and readable
- [ ] All functions callable on Basescan UI

### Configuration Success
- [ ] Backend wallet has ORCHESTRATOR_ROLE
- [ ] Backend wallet has MINTER_ROLE
- [ ] Backend wallet has BURNER_ROLE
- [ ] USDC token is supported
- [ ] Platform fee recipient configured

### Integration Success
- [ ] Deposit flow works end-to-end
- [ ] Mint entitlement flow works
- [ ] Balance queries work correctly
- [ ] Events emitted correctly
- [ ] Frontend can read contract state
- [ ] Backend can write to contracts

### Documentation Success
- [ ] Contract addresses documented
- [ ] ABIs exported to backend/frontend
- [ ] Gas costs documented
- [ ] Role permissions documented
- [ ] Interaction examples created

---

## 🔍 VERIFICATION CHECKLIST

### Basescan Verification
Visit: `https://sepolia.basescan.org/address/<CONTRACT_ADDRESS>`

**Verify:**
- [ ] Contract source code is visible
- [ ] All functions are visible
- [ ] Read functions work (e.g., getBalance)
- [ ] Write functions work (e.g., deposit)
- [ ] Events are logged correctly
- [ ] Contract is marked as "Verified"

### Functional Verification
```bash
# Test read functions
cast call $ESCROW_ADDRESS "platformFeeRecipient()(address)" --rpc-url $BASE_SEPOLIA_RPC
cast call $ESCROW_ADDRESS "platformFeeBps()(uint256)" --rpc-url $BASE_SEPOLIA_RPC
cast call $ENTITLEMENTS_ADDRESS "uri(uint256)(string)" 1 --rpc-url $BASE_SEPOLIA_RPC

# Test role checks
cast call $ESCROW_ADDRESS "hasRole(bytes32,address)(bool)" $(cast keccak "ORCHESTRATOR_ROLE") $BACKEND_WALLET --rpc-url $BASE_SEPOLIA_RPC
cast call $ENTITLEMENTS_ADDRESS "hasRole(bytes32,address)(bool)" $(cast keccak "MINTER_ROLE") $BACKEND_WALLET --rpc-url $BASE_SEPOLIA_RPC
```

---

## 📚 DOCUMENTATION UPDATES

### Files to Update
1. **backend/README.md** - Add contract addresses
2. **frontend/README.md** - Add contract addresses
3. **smart-contracts/README.md** - Add deployment info
4. **PROJECT_README.md** - Add deployed contract section

### Contract Registry
Create `DEPLOYED_CONTRACTS.md`:
```markdown
# Deployed Contracts - Base Sepolia

## AgentNexus Smart Contracts

### AgentNexusEscrow
- Address: `0x...`
- Network: Base Sepolia (84532)
- Verified: Yes
- Basescan: https://sepolia.basescan.org/address/0x...

### AgentNexusEntitlements
- Address: `0x...`
- Network: Base Sepolia (84532)
- Verified: Yes
- Basescan: https://sepolia.basescan.org/address/0x...

## Configuration
- Platform Fee: 2.5% (250 bps)
- Platform Fee Recipient: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1`
- Base URI: `https://api.agentnexus.io/metadata/`

## Supported Tokens
- Testnet USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

## Deployment Info
- Deployer: `0x...`
- Deployment Date: October 7, 2025
- Gas Used: ~3,500,000
- Total Cost: ~0.035 ETH
```

---

## 🚨 TROUBLESHOOTING

### Issue: Insufficient Balance
```bash
# Get testnet ETH from faucet
# Visit: https://www.base.org/faucet
# Or: https://coinbase.com/faucets/base-ethereum-goerli-faucet
```

### Issue: Verification Failed
```bash
# Retry verification with explicit constructor args
forge verify-contract <ADDRESS> <CONTRACT>:<NAME> \
  --chain-id 84532 \
  --etherscan-api-key $BASESCAN_API_KEY \
  --constructor-args <ENCODED_ARGS> \
  --watch
```

### Issue: Transaction Reverted
```bash
# Check transaction on Basescan
# Common issues:
# - Insufficient gas limit
# - Missing role permissions
# - Invalid parameters
# - Contract not deployed
```

---

## 📈 NEXT STEPS (Phase 6C)

After successful deployment:
1. ✅ Production hardening
2. ✅ Environment configuration
3. ✅ Rate limiting setup
4. ✅ Error monitoring
5. ✅ Performance optimization
6. ✅ Load testing preparation

---

## 🎯 GRANT APPLICATION VALUE

**What This Demonstrates:**
- ✅ Production-ready smart contracts
- ✅ Professional deployment process
- ✅ Comprehensive testing
- ✅ Security-first approach
- ✅ Base L2 integration
- ✅ Verified contracts on Basescan

**Base Team Will See:**
- Deployed, verified contracts on Base Sepolia
- Professional deployment documentation
- Comprehensive testing and validation
- Production-ready infrastructure

---

**Status**: 🚀 READY FOR DEPLOYMENT  
**Estimated Time**: 1-2 hours  
**Prerequisites**: Deployer wallet funded, environment configured

---

*This deployment checklist ensures a smooth, professional deployment process that demonstrates to the Base team our production-ready approach and commitment to quality.*


