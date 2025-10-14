#!/bin/bash

# Update Frontend .env.local with Contract Addresses
# Run this to add your deployed contracts to the frontend

ENV_FILE="/Users/billwilson_home/Desktop/AgentNexus-V1/frontend/.env.local"

echo "🔧 Updating frontend .env.local with contract addresses..."
echo ""

# Check if file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env.local not found at $ENV_FILE"
    exit 1
fi

# Backup existing file
cp "$ENV_FILE" "${ENV_FILE}.backup"
echo "✅ Created backup: ${ENV_FILE}.backup"

# Contract addresses from DEPLOYED_CONTRACTS.md
ESCROW_ADDRESS="0x3c8f32F9cF41Dc255129d6Add447218053743b33"
ENTITLEMENTS_ADDRESS="0x37A7B1f10b87f31ad916Fb3518118f8AA0d8d2fC"
CHAIN_ID="84532"
BASE_RPC="https://sepolia.base.org"

# Remove old contract lines if they exist
sed -i.tmp '/NEXT_PUBLIC_ESCROW_CONTRACT/d' "$ENV_FILE"
sed -i.tmp '/NEXT_PUBLIC_ENTITLEMENTS_CONTRACT/d' "$ENV_FILE"
sed -i.tmp '/NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT/d' "$ENV_FILE"
sed -i.tmp '/NEXT_PUBLIC_CHAIN_ID/d' "$ENV_FILE"
sed -i.tmp '/NEXT_PUBLIC_BASE_RPC/d' "$ENV_FILE"
rm "${ENV_FILE}.tmp"

# Add new contract addresses
echo "" >> "$ENV_FILE"
echo "# Smart Contracts (Base Sepolia) - Added $(date)" >> "$ENV_FILE"
echo "NEXT_PUBLIC_CHAIN_ID=$CHAIN_ID" >> "$ENV_FILE"
echo "NEXT_PUBLIC_BASE_RPC=$BASE_RPC" >> "$ENV_FILE"
echo "NEXT_PUBLIC_ESCROW_CONTRACT=$ESCROW_ADDRESS" >> "$ENV_FILE"
echo "NEXT_PUBLIC_ENTITLEMENTS_CONTRACT=$ENTITLEMENTS_ADDRESS" >> "$ENV_FILE"
echo "NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT=$ENTITLEMENTS_ADDRESS" >> "$ENV_FILE"

echo ""
echo "✅ Updated $ENV_FILE with:"
echo "   - Chain ID: $CHAIN_ID (Base Sepolia)"
echo "   - Base RPC: $BASE_RPC"
echo "   - Escrow: $ESCROW_ADDRESS"
echo "   - Entitlements: $ENTITLEMENTS_ADDRESS"
echo ""
echo "🚀 You're ready to go!"
echo ""
echo "Next steps:"
echo "  cd frontend"
echo "  pnpm dev"
echo "  open http://localhost:3000/builder"
echo ""

