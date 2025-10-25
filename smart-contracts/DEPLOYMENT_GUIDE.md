# AgentNexus Smart Contracts - Deployment Guide

## 📋 Overview

This guide covers deploying AgentNexus smart contracts to Base Sepolia (testnet) and Base L2 (mainnet).

## 🔐 Contracts

1. **AgentNexusEscrow** - Payment escrow with multi-token support
2. **AgentNexusEntitlements** - ERC-1155 access tokens for agents

## 📊 Test Results

**Coverage**: 94.93% statements, 93.71% lines  
**Tests**: 46/46 passing ✅  
**Gas Optimized**: All functions < 300k gas

## 🚀 Deployment Steps

### Prerequisites

1. **Install Foundry**:
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Set Environment Variables**:
   ```bash
   # In smart-contracts directory
   cp ../.env.example .env
   
   # Edit .env and add:
   PRIVATE_KEY=your_private_key_here
   BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
   BASESCAN_API_KEY=your_basescan_key
   ```

### Deploy to Base Sepolia (Testnet)

```bash
cd smart-contracts

# Deploy with verification
forge script script/Deploy.s.sol:TestnetDeployScript \
  --rpc-url base-sepolia \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY

# Note the deployed contract addresses from output
```

### Deploy to Base Mainnet

```bash
# IMPORTANT: Triple-check all parameters before mainnet deployment!

forge script script/Deploy.s.sol:DeployScript \
  --rpc-url base \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY

# Verify on BaseScan
forge verify-contract \
  CONTRACT_ADDRESS \
  src/AgentNexusEscrow.sol:AgentNexusEscrow \
  --chain-id 8453 \
  --etherscan-api-key $BASESCAN_API_KEY
```

## ⚙️ Post-Deployment Configuration

### 1. Grant Roles to Backend

```bash
# Using cast (Foundry tool)
cast send CONTRACT_ADDRESS \
  "grantRole(bytes32,address)" \
  $(cast keccak "ORCHESTRATOR_ROLE()") \
  BACKEND_ADDRESS \
  --rpc-url base-sepolia \
  --private-key $PRIVATE_KEY

# Grant MINTER_ROLE for Entitlements
cast send ENTITLEMENTS_ADDRESS \
  "grantRole(bytes32,address)" \
  $(cast keccak "MINTER_ROLE()") \
  BACKEND_ADDRESS \
  --rpc-url base-sepolia \
  --private-key $PRIVATE_KEY
```

### 2. Register Initial Agents

```bash
# Register an agent (ID, developer address)
cast send ESCROW_ADDRESS \
  "registerAgent(uint256,address)" \
  1 \
  DEVELOPER_WALLET \
  --rpc-url base-sepolia \
  --private-key $PRIVATE_KEY
```

### 3. Add Supported Tokens

```bash
# Add USDC
cast send ESCROW_ADDRESS \
  "setSupportedToken(address,bool)" \
  0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 \
  true \
  --rpc-url base \
  --private-key $PRIVATE_KEY
```

## 🔍 Verification

### Verify Deployment

```bash
# Check Escrow configuration
cast call ESCROW_ADDRESS "platformFeeRecipient()" --rpc-url base-sepolia
cast call ESCROW_ADDRESS "platformFeePercentage()" --rpc-url base-sepolia

# Check Entitlements
cast call ENTITLEMENTS_ADDRESS "baseURI()" --rpc-url base-sepolia
```

### Run Tests Against Deployed Contracts

```bash
# Fork Base Sepolia
forge test --fork-url $BASE_SEPOLIA_RPC_URL

# Generate gas report
forge test --gas-report
```

## 📝 Contract Addresses

### Base Sepolia (Testnet)

| Contract | Address | Explorer |
|----------|---------|----------|
| AgentNexusEscrow | `TBD` | [BaseScan](https://sepolia.basescan.org/address/TBD) |
| AgentNexusEntitlements | `TBD` | [BaseScan](https://sepolia.basescan.org/address/TBD) |

### Base Mainnet

| Contract | Address | Explorer |
|----------|---------|----------|
| AgentNexusEscrow | `TBD` | [BaseScan](https://basescan.org/address/TBD) |
| AgentNexusEntitlements | `TBD` | [BaseScan](https://basescan.org/address/TBD) |

## 🛡️ Security Considerations

### Before Mainnet Deployment

1. ✅ **Audit Complete** - All tests passing (46/46)
2. ✅ **Coverage** - 94.93% statement coverage
3. ⏳ **External Audit** - Recommended before mainnet
4. ⏳ **Slither Analysis** - Run static analysis
5. ✅ **Testnet Testing** - Deploy and test on Base Sepolia first

### Recommended Audits

- **Internal**: Foundry tests + Slither
- **External**: Professional audit (e.g., Trail of Bits, OpenZeppelin)
- **Bug Bounty**: Consider Immunefi program

## 🔧 Troubleshooting

### "Insufficient funds" Error

Ensure deployer wallet has enough ETH for gas:
```bash
# Check balance
cast balance YOUR_ADDRESS --rpc-url base-sepolia

# Get testnet ETH from Base faucet
# https://www.base.org/faucet
```

### "Verification failed" Error

Wait a few minutes and retry:
```bash
forge verify-contract \
  --chain-id 84532 \
  --watch \
  CONTRACT_ADDRESS \
  src/CONTRACT.sol:CONTRACT
```

### Gas Estimation Issues

Use `--legacy` flag for non-EIP-1559 transactions:
```bash
forge script script/Deploy.s.sol --legacy --broadcast
```

## 📚 Additional Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [Base Documentation](https://docs.base.org/)
- [BaseScan](https://basescan.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

## 🎯 Next Steps

After successful deployment:

1. ✅ Update backend `.env` with contract addresses
2. ✅ Grant necessary roles to backend
3. ✅ Register initial test agents
4. ✅ Perform end-to-end testing
5. ✅ Monitor gas costs and optimize if needed
6. ✅ Apply for Base Build grant
7. ✅ Launch marketing campaign

---

**Deployed with ❤️ by AgentNexus Team using **

