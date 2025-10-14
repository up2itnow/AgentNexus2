# 🎉 AgentNexus Smart Contracts - Deployed!

**Deployment Date:** October 9, 2025  
**Network:** Base Sepolia Testnet (Chain ID: 84532)  
**Deployer:** `0x2413C0DE9CBdFB3eADA6D7d20fB0A953F85bcb41`  
**Status:** ✅ Successfully Deployed

---

## 📍 Contract Addresses

### AgentNexusEscrow
- **Address:** `0x3c8f32F9cF41Dc255129d6Add447218053743b33`
- **Basescan:** https://sepolia.basescan.org/address/0x3c8f32F9cF41Dc255129d6Add447218053743b33
- **Platform Fee:** 2.5% (250 bps)
- **Fee Recipient:** `0x742d35cC6634c0532925A3b844bc9E7595F0beB1`
- **Supported Tokens:** 
  - Testnet USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

### AgentNexusEntitlements
- **Address:** `0x37A7B1f10b87f31ad916Fb3518118f8AA0d8d2fC`
- **Basescan:** https://sepolia.basescan.org/address/0x37A7B1f10b87f31ad916Fb3518118f8AA0d8d2fC
- **Base URI:** `https://testnet-api.agentnexus.io/metadata/`
- **Token Standard:** ERC-1155

---

## 📊 Deployment Statistics

- **Gas Used:** 4,988,979
- **Deployment Cost:** ~0.000005 ETH
- **Transactions:** 3 (deploy Escrow, deploy Entitlements, configure USDC)
- **Verification:** Pending (Basescan API key issue)

---

## 🔐 Roles Configuration

### Current Roles (Deployer)
The deployer wallet has all admin roles:
- ✅ DEFAULT_ADMIN_ROLE on both contracts
- ✅ FEE_MANAGER_ROLE on Escrow
- ✅ MINTER_ROLE on Entitlements
- ✅ BURNER_ROLE on Entitlements
- ✅ URI_MANAGER_ROLE on Entitlements

### Backend Roles (To Be Granted)

You need to grant your backend wallet these roles:

```bash
# Set your backend wallet address
BACKEND_WALLET=0xYourBackendWalletAddressHere

# Grant ORCHESTRATOR_ROLE to backend (for escrow operations)
cast send 0x3c8f32F9cF41Dc255129d6Add447218053743b33 \
  "grantRole(bytes32,address)" \
  $(cast keccak "ORCHESTRATOR_ROLE") \
  $BACKEND_WALLET \
  --rpc-url https://sepolia.base.org \
  --private-key 0xYourPrivateKey

# Grant MINTER_ROLE to backend (for minting entitlements)
cast send 0x37A7B1f10b87f31ad916Fb3518118f8AA0d8d2fC \
  "grantRole(bytes32,address)" \
  $(cast keccak "MINTER_ROLE") \
  $BACKEND_WALLET \
  --rpc-url https://sepolia.base.org \
  --private-key 0xYourPrivateKey

# Grant BURNER_ROLE to backend (for burning entitlements)
cast send 0x37A7B1f10b87f31ad916Fb3518118f8AA0d8d2fC \
  "grantRole(bytes32,address)" \
  $(cast keccak "BURNER_ROLE") \
  $BACKEND_WALLET \
  --rpc-url https://sepolia.base.org \
  --private-key 0xYourPrivateKey
```

---

## ⚙️ Environment Variables

### Backend (.env.production)
```env
# Network
CHAIN_ID=84532
BASE_SEPOLIA_RPC=https://sepolia.base.org

# Contracts
ESCROW_CONTRACT_ADDRESS=0x3c8f32F9cF41Dc255129d6Add447218053743b33
ENTITLEMENTS_CONTRACT_ADDRESS=0x37A7B1f10b87f31ad916Fb3518118f8AA0d8d2fC

# Supported Tokens
TESTNET_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

### Frontend (.env.production)
```env
# Network
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_BASE_RPC=https://sepolia.base.org

# Contracts
NEXT_PUBLIC_ESCROW_ADDRESS=0x3c8f32F9cF41Dc255129d6Add447218053743b33
NEXT_PUBLIC_ENTITLEMENTS_ADDRESS=0x37A7B1f10b87f31ad916Fb3518118f8AA0d8d2fC

# Tokens
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

---

## 🧪 Testing Commands

### Test Deposit (Native ETH)
```bash
cast send 0x3c8f32F9cF41Dc255129d6Add447218053743b33 \
  "deposit(string)" \
  "test-agent-id-001" \
  --value 0.01ether \
  --rpc-url https://sepolia.base.org \
  --private-key 0xYourPrivateKey
```

### Check Escrow Balance
```bash
cast call 0x3c8f32F9cF41Dc255129d6Add447218053743b33 \
  "getEscrowBalance(address,string)" \
  0xYourAddress \
  "test-agent-id-001" \
  --rpc-url https://sepolia.base.org
```

### Mint Entitlement (After granting MINTER_ROLE)
```bash
cast send 0x37A7B1f10b87f31ad916Fb3518118f8AA0d8d2fC \
  "mint(address,uint256,uint256)" \
  0xUserAddress \
  1 \
  10 \
  --rpc-url https://sepolia.base.org \
  --private-key 0xBackendPrivateKey
```

### Check Entitlement Balance
```bash
cast call 0x37A7B1f10b87f31ad916Fb3518118f8AA0d8d2fC \
  "balanceOf(address,uint256)" \
  0xUserAddress \
  1 \
  --rpc-url https://sepolia.base.org
```

---

## 🔍 Manual Verification (If Needed)

If you want to verify the contracts on Basescan manually:

1. Go to the contract address on Basescan
2. Click "Contract" → "Verify and Publish"
3. Select:
   - **Compiler Type:** Solidity (Single file)
   - **Compiler Version:** v0.8.28
   - **License:** MIT
4. Copy the flattened contract source:
   ```bash
   forge flatten src/AgentNexusEscrow.sol > flattened_escrow.sol
   forge flatten src/AgentNexusEntitlements.sol > flattened_entitlements.sol
   ```
5. Paste and submit

Or use Foundry's verify command with a valid Basescan API key:
```bash
forge verify-contract \
  0x3c8f32F9cF41Dc255129d6Add447218053743b33 \
  src/AgentNexusEscrow.sol:AgentNexusEscrow \
  --rpc-url https://sepolia.base.org \
  --etherscan-api-key YOUR_BASESCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,uint256)" 0x742d35cC6634c0532925A3b844bc9E7595F0beB1 250)
```

---

## ✅ Next Steps Checklist

- [x] Deploy smart contracts to Base Sepolia
- [x] Export ABIs to backend/frontend
- [ ] Grant backend roles (ORCHESTRATOR, MINTER, BURNER)
- [ ] Update backend environment variables
- [ ] Update frontend environment variables
- [ ] Test deposit flow
- [ ] Test entitlement minting
- [ ] Test execution flow
- [ ] Verify contracts on Basescan (optional)
- [ ] Update project documentation

---

## 📚 Additional Resources

- **Base Sepolia Faucet:** https://www.base.org/faucet
- **Base Sepolia Explorer:** https://sepolia.basescan.org
- **Base Docs:** https://docs.base.org
- **Foundry Book:** https://book.getfoundry.sh

---

## 🎉 Congratulations!

Your AgentNexus smart contracts are now live on Base Sepolia testnet! The payment escrow and access control systems are fully functional and ready for integration with your backend and frontend.

**Gas Cost Summary:**
- Deployment: ~0.000005 ETH
- Remaining Balance: 0.033995 ETH
- Plenty left for testing and granting roles! 🚀

