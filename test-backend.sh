#!/bin/bash

# AgentNexus Backend API Test Script
# Tests all builder endpoints to verify backend is working

API_URL="http://localhost:8200/api"
USER_ID="test_user_123"

echo "🧪 Testing AgentNexus Backend API"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS=0
PASSED=0
FAILED=0

test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    TESTS=$((TESTS + 1))
    echo -n "Testing: $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint")
    else
        response=$(curl -s -X "$method" -H "Content-Type: application/json" -d "$data" -w "\n%{http_code}" "$API_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        if [ -n "$body" ]; then
            echo "   Response: $(echo $body | jq -r '.' 2>/dev/null || echo $body | head -c 100)"
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        FAILED=$((FAILED + 1))
        if [ -n "$body" ]; then
            echo "   Error: $(echo $body | jq -r '.message // .error // .' 2>/dev/null || echo $body)"
        fi
    fi
    echo ""
}

# Health Check
echo "=== Health Check ==="
test_endpoint "GET" "/health" "Health check"
echo ""

# Builder Endpoints
echo "=== Builder Endpoints ==="

# Test 1: Get Templates
test_endpoint "GET" "/builder/templates" "Get all templates"

# Test 2: Get Single Template (assuming first template ID exists)
test_endpoint "GET" "/builder/templates/template_price_tracker" "Get single template"

# Test 3: Get Modules
test_endpoint "GET" "/builder/modules" "Get all modules"

# Test 4: Preview Agent (Template)
preview_data='{
  "buildMethod": "TEMPLATE",
  "name": "Test Price Bot",
  "description": "Testing template preview",
  "category": "CRYPTO",
  "templateId": "template_price_tracker",
  "templateConfig": {
    "symbols": ["ETH", "BTC"],
    "threshold": 5
  }
}'
test_endpoint "POST" "/builder/preview" "Preview template agent" "$preview_data"

# Test 5: Preview Agent (Hybrid)
hybrid_preview='{
  "buildMethod": "HYBRID",
  "name": "Test Hybrid Bot",
  "description": "Testing hybrid preview",
  "category": "SOCIAL",
  "moduleIds": ["module_twitter_api", "module_sentiment_analysis"],
  "moduleConfigs": {
    "module_twitter_api": {
      "keywords": ["crypto"]
    }
  }
}'
test_endpoint "POST" "/builder/preview" "Preview hybrid agent" "$hybrid_preview"

# Test 6: Generate Agent (Template)
generate_data='{
  "buildMethod": "TEMPLATE",
  "name": "My Test Agent",
  "description": "Testing agent generation",
  "category": "CRYPTO",
  "templateId": "template_price_tracker",
  "templateConfig": {
    "symbols": ["ETH"],
    "threshold": 10
  }
}'
test_endpoint "POST" "/builder/generate" "Generate template agent" "$generate_data"

# Test 7: Get User's Custom Agents
test_endpoint "GET" "/builder/my-agents/$USER_ID" "Get user's custom agents"

# Summary
echo ""
echo "=================================="
echo "📊 Test Summary"
echo "=================================="
echo "Total Tests: $TESTS"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi

