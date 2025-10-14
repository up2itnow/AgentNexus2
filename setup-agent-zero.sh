#!/bin/bash
# Agent Zero Integration Setup Script
# Configures environment and prepares for deployment

set -e

echo "======================================"
echo "Agent Zero Integration Setup"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to generate token ID
generate_token_id() {
    local identifier=$1
    echo -n "0x$(echo -n "$identifier" | sha256sum | cut -d' ' -f1)"
}

# Step 1: Generate Token IDs
echo -e "${YELLOW}Step 1: Generating Token IDs...${NC}"
BASIC_TOKEN_ID=$(generate_token_id "agent-zero-basic")
PRO_TOKEN_ID=$(generate_token_id "agent-zero-pro")

echo "Basic Token ID: $BASIC_TOKEN_ID"
echo "Pro Token ID:   $PRO_TOKEN_ID"
echo ""

# Step 2: Update Backend .env
echo -e "${YELLOW}Step 2: Updating backend .env...${NC}"
cd backend

if [ ! -f .env ]; then
    echo -e "${RED}Error: backend/.env not found!${NC}"
    exit 1
fi

# Check if Agent Zero config already exists
if grep -q "AGENT_ZERO_BASIC_TOKEN_ID" .env; then
    echo -e "${YELLOW}Agent Zero config already exists in .env, skipping...${NC}"
else
    cat >> .env <<EOF

# ============================================================================
# AGENT ZERO INTEGRATION
# ============================================================================
AGENT_ZERO_BASIC_TOKEN_ID=$BASIC_TOKEN_ID
AGENT_ZERO_PRO_TOKEN_ID=$PRO_TOKEN_ID
AGENT_ZERO_PRO_PRICE=50000000
AGENT_ZERO_PRO_PRICE_TOKEN=USDC
AGENT_ZERO_QUICK_IMAGE=agentnexus/agent-zero-quick:latest
AGENT_ZERO_FULL_IMAGE=agentnexus/agent-zero-full:latest
AGENT_ZERO_BASIC_RATE_LIMIT=10
AGENT_ZERO_BASIC_TIMEOUT=300000
AGENT_ZERO_PRO_TIMEOUT=1800000
AGENT_ZERO_PRO_MAX_MEMORY=4GB
AGENT_ZERO_PRO_CPU_LIMIT=2.0
EOF
    echo -e "${GREEN}✓ Backend .env updated${NC}"
fi

cd ..

# Step 3: Update Frontend .env.local
echo -e "${YELLOW}Step 3: Updating frontend .env.local...${NC}"
cd frontend

if [ ! -f .env.local ]; then
    echo -e "${YELLOW}Creating frontend/.env.local...${NC}"
    touch .env.local
fi

# Check if Agent Zero config already exists
if grep -q "NEXT_PUBLIC_AGENT_ZERO_BASIC_ID" .env.local; then
    echo -e "${YELLOW}Agent Zero config already exists in .env.local, skipping...${NC}"
else
    cat >> .env.local <<EOF

# ============================================================================
# AGENT ZERO INTEGRATION
# ============================================================================
NEXT_PUBLIC_AGENT_ZERO_BASIC_ID=$BASIC_TOKEN_ID
NEXT_PUBLIC_AGENT_ZERO_PRO_ID=$PRO_TOKEN_ID
NEXT_PUBLIC_AGENT_ZERO_PRO_PRICE=50
NEXT_PUBLIC_AGENT_ZERO_PRO_PRICE_TOKEN=USDC
NEXT_PUBLIC_AGENT_ZERO_ENABLED=true
EOF
    echo -e "${GREEN}✓ Frontend .env.local updated${NC}"
fi

cd ..

# Step 4: Build Docker images (optional)
echo ""
echo -e "${YELLOW}Step 4: Do you want to build Agent Zero Docker images now? (y/n)${NC}"
read -r BUILD_IMAGES

if [ "$BUILD_IMAGES" = "y" ] || [ "$BUILD_IMAGES" = "Y" ]; then
    echo "Building Docker images..."
    
    cd backend/docker
    
    echo "Building agent-zero-quick..."
    docker build -f agent-zero-quick.Dockerfile -t agentnexus/agent-zero-quick:latest .
    
    echo "Building agent-zero-full..."
    docker build -f agent-zero-full.Dockerfile -t agentnexus/agent-zero-full:latest .
    
    cd ../..
    echo -e "${GREEN}✓ Docker images built${NC}"
else
    echo -e "${YELLOW}Skipping Docker image builds${NC}"
fi

# Step 5: Summary
echo ""
echo "======================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Restart your backend server:    cd backend && pnpm dev"
echo "2. Restart your frontend server:   cd frontend && pnpm dev"
echo "3. Visit: http://localhost:3001/marketplace/agent-zero"
echo "4. Test Basic tier execution"
echo "5. Test Pro tier upgrade flow"
echo ""
echo "Token IDs for reference:"
echo "  Basic: $BASIC_TOKEN_ID"
echo "  Pro:   $PRO_TOKEN_ID"
echo ""
echo "Documentation: AGENT_ZERO_IMPLEMENTATION_STATUS.md"
echo ""

