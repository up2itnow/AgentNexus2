#!/usr/bin/env bash
set -euo pipefail

DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
ROOT="$DIR/.."
cd "$ROOT"

if [ -f env/.env.base ]; then
  set -o allexport; source env/.env.base; set +o allexport
else
  echo "Provide env/.env.base based on env/.env.base.example"; exit 1
fi

if ! command -v forge >/dev/null 2>&1; then
  echo "Foundry forge not installed"; exit 1
fi

echo "Deploying contracts to chain $CHAIN_ID via $RPC_URL"

# Deploy Escrow and Entitlements (adjust names if contracts path differs)
forge script script/Deploy.s.sol \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --private-key "$PRIVATE_KEY" \
  -vvvv

