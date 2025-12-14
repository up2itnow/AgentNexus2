#!/bin/bash

# Update Frontend .env.local with Contract Addresses
# Run this to add your deployed contracts to the frontend

set -euo pipefail

PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
DEPLOYMENTS_FILE="${PROJECT_ROOT}/smart-contracts/deployments/deployments.json"
ENV_FILE="${ENV_FILE:-"${PROJECT_ROOT}/frontend/.env.local"}"
REL_ENV_FILE=$(realpath --relative-to="$PROJECT_ROOT" "$ENV_FILE" 2>/dev/null || echo "$ENV_FILE")
NETWORK=""

usage() {
    cat <<EOF
Usage: $(basename "$0") [--network <name-or-chain-id>] [--env-file <path>]

Options:
  -n, --network   Network name (e.g., base, base-sepolia) or chain ID (e.g., 8453).
                  Defaults to the first deployed network in deployments.json.
  -e, --env-file  Path to the frontend env file (defaults to frontend/.env.local).
  -h, --help      Show this help message.
EOF
}

normalize_key() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g' | sed -E 's/^-+|-+$//g'
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        -n|--network)
            NETWORK="${2:-}"
            shift 2
            ;;
        -e|--env-file)
            ENV_FILE="${2:-}"
            REL_ENV_FILE=$(realpath --relative-to="$PROJECT_ROOT" "$ENV_FILE" 2>/dev/null || echo "$ENV_FILE")
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $1" >&2
            usage
            exit 1
            ;;
    esac
done

echo "🔧 Updating frontend .env.local with contract addresses..."
echo ""

if ! command -v jq >/dev/null 2>&1; then
    echo "❌ Error: jq is required to read deployments. Install jq and try again."
    exit 1
fi

if [ ! -f "$DEPLOYMENTS_FILE" ]; then
    echo "❌ Error: Deployments file not found at $DEPLOYMENTS_FILE"
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env.local not found at $REL_ENV_FILE"
    exit 1
fi

DEFAULT_CHAIN_ID=""
DEFAULT_CHAIN_ID=$(jq -r '.chains | to_entries[] | select(.value.status == "deployed") | .key' "$DEPLOYMENTS_FILE" | head -n 1)
if [ -z "$DEFAULT_CHAIN_ID" ] || [ "$DEFAULT_CHAIN_ID" = "null" ]; then
    DEFAULT_CHAIN_ID=$(jq -r '.chains | keys[]' "$DEPLOYMENTS_FILE" | head -n 1)
fi

NETWORK_KEY="$(normalize_key "$NETWORK")"
CHAIN_ID=""
if [ -z "$NETWORK_KEY" ]; then
    CHAIN_ID="$DEFAULT_CHAIN_ID"
elif [[ "$NETWORK_KEY" =~ ^[0-9]+$ ]]; then
    CHAIN_ID="$NETWORK_KEY"
else
    CHAIN_ID=$(jq -r --arg key "$NETWORK_KEY" '.chains | to_entries[] | select((.key == $key) or ((.value.name // "" | ascii_downcase | gsub("[^a-z0-9]+"; "-") ) == $key)) | .key' "$DEPLOYMENTS_FILE" | head -n 1)
fi

if [ -z "$CHAIN_ID" ] || [ "$CHAIN_ID" = "null" ]; then
    echo "❌ Error: Could not resolve network '$NETWORK'." >&2
    exit 1
fi

CHAIN_NAME=$(jq -r --arg id "$CHAIN_ID" '.chains[$id].name // $id' "$DEPLOYMENTS_FILE")
CHAIN_STATUS=$(jq -r --arg id "$CHAIN_ID" '.chains[$id].status // ""' "$DEPLOYMENTS_FILE")
CHAIN_DEPLOYMENTS=$(jq -r --arg id "$CHAIN_ID" '.chains[$id].contracts // {}' "$DEPLOYMENTS_FILE")

if [ "$CHAIN_DEPLOYMENTS" = "null" ] || [ "$CHAIN_DEPLOYMENTS" = "{}" ]; then
    echo "❌ Error: No contract deployments found for chain $CHAIN_ID." >&2
    exit 1
fi

ESCROW_ADDRESS=$(jq -r --arg id "$CHAIN_ID" '.chains[$id].contracts.AgentNexusEscrow // empty' "$DEPLOYMENTS_FILE")
ENTITLEMENTS_ADDRESS=$(jq -r --arg id "$CHAIN_ID" '.chains[$id].contracts.AgentNexusEntitlements // empty' "$DEPLOYMENTS_FILE")
AGENT_REGISTRY_ADDRESS=$(jq -r --arg id "$CHAIN_ID" '.chains[$id].contracts.AgentRegistry // empty' "$DEPLOYMENTS_FILE")

DEFAULT_RPC=""
case "$CHAIN_ID" in
    8453)
        DEFAULT_RPC="https://mainnet.base.org"
        ;;
    84532)
        DEFAULT_RPC="https://sepolia.base.org"
        ;;
esac

BASE_RPC="${BASE_RPC:-${DEFAULT_RPC}}"
if [ -z "$BASE_RPC" ]; then
    echo "⚠️  Warning: No RPC URL configured for $CHAIN_NAME. Set BASE_RPC or rerun with BASE_RPC set." >&2
fi

cp "$ENV_FILE" "${ENV_FILE}.backup"
echo "✅ Created backup: ${REL_ENV_FILE}.backup"

sed -i.tmp '/NEXT_PUBLIC_ESCROW_CONTRACT/d' "$ENV_FILE"
sed -i.tmp '/NEXT_PUBLIC_ENTITLEMENTS_CONTRACT/d' "$ENV_FILE"
sed -i.tmp '/NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT/d' "$ENV_FILE"
sed -i.tmp '/NEXT_PUBLIC_CHAIN_ID/d' "$ENV_FILE"
sed -i.tmp '/NEXT_PUBLIC_BASE_RPC/d' "$ENV_FILE"
rm -f "${ENV_FILE}.tmp"

echo "" >> "$ENV_FILE"
echo "# Smart Contracts ($CHAIN_NAME) - Added $(date)" >> "$ENV_FILE"
echo "NEXT_PUBLIC_CHAIN_ID=$CHAIN_ID" >> "$ENV_FILE"
if [ -n "$BASE_RPC" ]; then
    echo "NEXT_PUBLIC_BASE_RPC=$BASE_RPC" >> "$ENV_FILE"
fi

append_env_var() {
    local key="$1"
    local value="$2"
    if [ -n "$value" ]; then
        echo "$key=$value" >> "$ENV_FILE"
    else
        echo "# $key=<set for $CHAIN_NAME>" >> "$ENV_FILE"
    fi
}

append_env_var "NEXT_PUBLIC_ESCROW_CONTRACT" "$ESCROW_ADDRESS"
append_env_var "NEXT_PUBLIC_ENTITLEMENTS_CONTRACT" "$ENTITLEMENTS_ADDRESS"
append_env_var "NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT" "$AGENT_REGISTRY_ADDRESS"

echo ""
echo "✅ Updated $REL_ENV_FILE with:"
echo "   - Chain ID: $CHAIN_ID ($CHAIN_NAME)"
if [ -n "$BASE_RPC" ]; then
    echo "   - Base RPC: $BASE_RPC"
else
    echo "   - Base RPC: <not set>"
fi
echo "   - Escrow: ${ESCROW_ADDRESS:-<not set>}"
echo "   - Entitlements: ${ENTITLEMENTS_ADDRESS:-<not set>}"
echo "   - Agent Registry: ${AGENT_REGISTRY_ADDRESS:-<not set>}"

if [ "$CHAIN_STATUS" != "deployed" ]; then
    echo ""
    echo "⚠️  Warning: Chain $CHAIN_ID is marked '$CHAIN_STATUS' in deployments.json."
fi

echo ""
echo "🚀 You're ready to go!"
echo ""
echo "Next steps:"
echo "  cd frontend"
echo "  pnpm dev"
echo "  open http://localhost:3000/builder"
echo ""

