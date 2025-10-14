#!/bin/bash

###############################################################################
# AgentNexus ABI Export Script
# Purpose: Export contract ABIs to backend and frontend
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
CONTRACTS_DIR="$SCRIPT_DIR/../out"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         📦  EXPORTING CONTRACT ABIs  📦                         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create directories if they don't exist
mkdir -p "$PROJECT_DIR/backend/src/contracts"
mkdir -p "$PROJECT_DIR/frontend/src/contracts"

# Export AgentNexusEscrow ABI
echo -e "${GREEN}Exporting AgentNexusEscrow ABI...${NC}"
cat "$CONTRACTS_DIR/AgentNexusEscrow.sol/AgentNexusEscrow.json" | jq '.abi' > "$PROJECT_DIR/backend/src/contracts/AgentNexusEscrow.json"
cat "$CONTRACTS_DIR/AgentNexusEscrow.sol/AgentNexusEscrow.json" | jq '.abi' > "$PROJECT_DIR/frontend/src/contracts/AgentNexusEscrow.json"
echo -e "  ✓ Backend: backend/src/contracts/AgentNexusEscrow.json"
echo -e "  ✓ Frontend: frontend/src/contracts/AgentNexusEscrow.json"
echo ""

# Export AgentNexusEntitlements ABI
echo -e "${GREEN}Exporting AgentNexusEntitlements ABI...${NC}"
cat "$CONTRACTS_DIR/AgentNexusEntitlements.sol/AgentNexusEntitlements.json" | jq '.abi' > "$PROJECT_DIR/backend/src/contracts/AgentNexusEntitlements.json"
cat "$CONTRACTS_DIR/AgentNexusEntitlements.sol/AgentNexusEntitlements.json" | jq '.abi' > "$PROJECT_DIR/frontend/src/contracts/AgentNexusEntitlements.json"
echo -e "  ✓ Backend: backend/src/contracts/AgentNexusEntitlements.json"
echo -e "  ✓ Frontend: frontend/src/contracts/AgentNexusEntitlements.json"
echo ""

echo -e "${GREEN}✓ ABI export complete!${NC}"
echo ""


