#!/bin/bash

###############################################################################
# AgentNexus Smart Contract Deployment Script
# Network: Base Sepolia
# Purpose: Automated deployment with verification and configuration
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                                      ║${NC}"
echo -e "${BLUE}║       🚀  AGENTNEXUS SMART CONTRACT DEPLOYMENT  🚀                  ║${NC}"
echo -e "${BLUE}║                 Base Sepolia Testnet                                 ║${NC}"
echo -e "${BLUE}║                                                                      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════╝${NC}"

# Load environment variables
if [ -f "$PROJECT_DIR/.env" ]; then
    echo -e "${GREEN}✓ Loading environment variables from .env${NC}"
    source "$PROJECT_DIR/.env"
else
    echo -e "${RED}✗ Error: .env file not found${NC}"
    echo "Please create a .env file with:"
    echo "  PRIVATE_KEY=your_private_key"
    echo "  BASE_SEPOLIA_RPC=https://sepolia.base.org"
    echo "  ETHERSCAN_API_KEY=your_etherscan_api_key  # BASESCAN_API_KEY also supported"
    exit 1
fi

# Validate required environment variables
if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}✗ Error: PRIVATE_KEY not set in .env${NC}"
    exit 1
fi

if [ -z "$BASE_SEPOLIA_RPC" ]; then
    echo -e "${YELLOW}⚠ Warning: BASE_SEPOLIA_RPC not set, using default${NC}"
    BASE_SEPOLIA_RPC="https://sepolia.base.org"
fi

ETHERSCAN_KEY="${ETHERSCAN_API_KEY:-$BASESCAN_API_KEY}"
if [ -z "$ETHERSCAN_KEY" ]; then
    echo -e "${YELLOW}⚠ Warning: ETHERSCAN_API_KEY/BASESCAN_API_KEY not set; using dummy verification key${NC}"
fi

# Get deployer address
DEPLOYER=$(cast wallet address --private-key $PRIVATE_KEY 2>/dev/null || echo "")
if [ -z "$DEPLOYER" ]; then
    echo -e "${RED}✗ Error: Invalid private key${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}📋 Deployment Configuration${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  Network:           ${YELLOW}Base Sepolia${NC}"
echo -e "  Chain ID:          ${YELLOW}84532${NC}"
echo -e "  RPC URL:           ${YELLOW}$BASE_SEPOLIA_RPC${NC}"
echo -e "  Deployer Address:  ${YELLOW}$DEPLOYER${NC}"
echo ""

# Check deployer balance
echo -e "${BLUE}💰 Checking deployer balance...${NC}"
BALANCE=$(cast balance $DEPLOYER --rpc-url $BASE_SEPOLIA_RPC 2>/dev/null || echo "0")
BALANCE_ETH=$(cast --from-wei $BALANCE ether 2>/dev/null || echo "0")

echo -e "  Balance: ${YELLOW}$BALANCE_ETH ETH${NC}"

# Check if balance is sufficient (need at least 0.0002 ETH for minimal deployment)
REQUIRED_BALANCE="200000000000000"  # 0.0002 ETH in wei
if [ "$BALANCE" -lt "$REQUIRED_BALANCE" ]; then
    echo -e "${RED}✗ Error: Insufficient balance${NC}"
    echo "  Required: 0.0002 ETH minimum"
    echo "  Current:  $BALANCE_ETH ETH"
    echo ""
    echo "Get testnet ETH from: https://www.base.org/faucet"
    exit 1
fi

# Warn if balance is low but still proceed
RECOMMENDED_BALANCE="50000000000000000"  # 0.05 ETH in wei
if [ "$BALANCE" -lt "$RECOMMENDED_BALANCE" ]; then
    echo -e "${YELLOW}⚠️  Warning: Low balance detected${NC}"
    echo "  Recommended: 0.05 ETH for safe deployment"
    echo "  Current:     $BALANCE_ETH ETH"
    echo "  Deployment may fail if gas prices spike"
    echo ""
fi

echo -e "${GREEN}✓ Balance sufficient for deployment${NC}"
echo ""

# Confirm deployment
echo -e "${YELLOW}⚠️  Ready to deploy to Base Sepolia${NC}"
echo "This will:"
echo "  1. Deploy AgentNexusEscrow contract"
echo "  2. Deploy AgentNexusEntitlements contract"
echo "  3. Configure supported tokens"
echo "  4. Verify contracts on Basescan"
echo ""
read -p "Continue with deployment? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  DEPLOYING SMART CONTRACTS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Change to project directory
cd "$PROJECT_DIR"

# Run deployment script
echo -e "${GREEN}🚀 Executing deployment script...${NC}"
echo ""

forge script script/Deploy.s.sol:TestnetDeployScript \
    --rpc-url $BASE_SEPOLIA_RPC \
    --broadcast \
    --verify \
    --etherscan-api-key "${ETHERSCAN_KEY:-dummy}" \
    -vvvv \
    2>&1 | tee deployment.log

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Deployment successful!${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}✗ Deployment failed${NC}"
    echo "Check deployment.log for details"
    exit 1
fi

# Extract contract addresses from deployment log
echo -e "${BLUE}📝 Extracting contract addresses...${NC}"

ESCROW_ADDRESS=$(grep -o "AgentNexusEscrow deployed at: 0x[a-fA-F0-9]\{40\}" deployment.log | head -1 | cut -d' ' -f5 || echo "")
ENTITLEMENTS_ADDRESS=$(grep -o "AgentNexusEntitlements deployed at: 0x[a-fA-F0-9]\{40\}" deployment.log | head -1 | cut -d' ' -f5 || echo "")

if [ -z "$ESCROW_ADDRESS" ] || [ -z "$ENTITLEMENTS_ADDRESS" ]; then
    echo -e "${YELLOW}⚠️  Warning: Could not extract contract addresses from log${NC}"
    echo "Please check deployment.log manually"
else
    echo ""
    echo -e "${GREEN}📍 Deployed Contract Addresses${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "  AgentNexusEscrow:       ${YELLOW}$ESCROW_ADDRESS${NC}"
    echo -e "  AgentNexusEntitlements: ${YELLOW}$ENTITLEMENTS_ADDRESS${NC}"
    echo ""
    echo -e "  Basescan URLs:"
    echo -e "    Escrow:       ${BLUE}https://sepolia.basescan.org/address/$ESCROW_ADDRESS${NC}"
    echo -e "    Entitlements: ${BLUE}https://sepolia.basescan.org/address/$ENTITLEMENTS_ADDRESS${NC}"
    echo ""
    
    # Create deployment info file
    DEPLOYMENT_FILE="$PROJECT_DIR/DEPLOYED_CONTRACTS.md"
    cat > "$DEPLOYMENT_FILE" << EOF
# Deployed Contracts - Base Sepolia

**Deployment Date:** $(date)  
**Network:** Base Sepolia (Chain ID: 84532)  
**Deployer:** $DEPLOYER

---

## Contract Addresses

### AgentNexusEscrow
- **Address:** \`$ESCROW_ADDRESS\`
- **Basescan:** https://sepolia.basescan.org/address/$ESCROW_ADDRESS
- **Platform Fee:** 2.5% (250 bps)
- **Fee Recipient:** \`0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1\`

### AgentNexusEntitlements
- **Address:** \`$ENTITLEMENTS_ADDRESS\`
- **Basescan:** https://sepolia.basescan.org/address/$ENTITLEMENTS_ADDRESS
- **Base URI:** \`https://api.agentnexus.io/metadata/\`

---

## Configuration

### Supported Tokens
- **Testnet USDC:** \`0x036CbD53842c5426634e7929541eC2318f3dCF7e\`

### Backend Roles (To Be Granted)
\`\`\`bash
# Grant ORCHESTRATOR_ROLE to backend
BACKEND_WALLET=your_backend_wallet_address

cast send $ESCROW_ADDRESS \\
  "grantRole(bytes32,address)" \\
  \$(cast keccak "ORCHESTRATOR_ROLE") \\
  \$BACKEND_WALLET \\
  --rpc-url $BASE_SEPOLIA_RPC \\
  --private-key \$PRIVATE_KEY

# Grant MINTER_ROLE to backend
cast send $ENTITLEMENTS_ADDRESS \\
  "grantRole(bytes32,address)" \\
  \$(cast keccak "MINTER_ROLE") \\
  \$BACKEND_WALLET \\
  --rpc-url $BASE_SEPOLIA_RPC \\
  --private-key \$PRIVATE_KEY

# Grant BURNER_ROLE to backend
cast send $ENTITLEMENTS_ADDRESS \\
  "grantRole(bytes32,address)" \\
  \$(cast keccak "BURNER_ROLE") \\
  \$BACKEND_WALLET \\
  --rpc-url $BASE_SEPOLIA_RPC \\
  --private-key \$PRIVATE_KEY
\`\`\`

---

## Environment Variables

### Backend (.env.production)
\`\`\`env
CHAIN_ID=84532
ESCROW_CONTRACT_ADDRESS=$ESCROW_ADDRESS
ENTITLEMENTS_CONTRACT_ADDRESS=$ENTITLEMENTS_ADDRESS
BASE_SEPOLIA_RPC=$BASE_SEPOLIA_RPC
\`\`\`

### Frontend (.env.production)
\`\`\`env
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_ESCROW_ADDRESS=$ESCROW_ADDRESS
NEXT_PUBLIC_ENTITLEMENTS_ADDRESS=$ENTITLEMENTS_ADDRESS
NEXT_PUBLIC_BASE_RPC=$BASE_SEPOLIA_RPC
\`\`\`

---

## Testing

### Test Deposit
\`\`\`bash
cast send $ESCROW_ADDRESS \\
  "deposit(string)" \\
  "test-agent-id" \\
  --value 0.01ether \\
  --rpc-url $BASE_SEPOLIA_RPC \\
  --private-key \$PRIVATE_KEY
\`\`\`

### Test Entitlement Mint
\`\`\`bash
cast send $ENTITLEMENTS_ADDRESS \\
  "mint(address,uint256,uint256)" \\
  <USER_ADDRESS> \\
  1 \\
  1 \\
  --rpc-url $BASE_SEPOLIA_RPC \\
  --private-key \$PRIVATE_KEY
\`\`\`

---

**Next Steps:**
1. Verify contracts on Basescan
2. Grant backend roles
3. Export ABIs to backend/frontend
4. Test full payment flow
5. Update documentation
EOF

    echo -e "${GREEN}✓ Deployment info saved to DEPLOYED_CONTRACTS.md${NC}"
    echo ""
fi

# Next steps
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  NEXT STEPS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "1. ✓ Contracts deployed to Base Sepolia"
echo "2. ⏳ Verify contracts on Basescan (if auto-verify failed)"
echo "3. ⏳ Grant backend roles (ORCHESTRATOR, MINTER, BURNER)"
echo "4. ⏳ Export ABIs to backend/frontend"
echo "5. ⏳ Update environment variables"
echo "6. ⏳ Test full payment flow"
echo "7. ⏳ Update project documentation"
echo ""
echo -e "${GREEN}📚 See PHASE_6B_DEPLOYMENT_CHECKLIST.md for detailed instructions${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""


