#!/bin/bash

# Mission Control Backend API Test Script
# Tests all endpoints with real Gateway

set -e

BASE_URL="http://localhost:8080"

echo "🧪 Mission Control Backend API Test"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

test_endpoint() {
  local name=$1
  local endpoint=$2
  local expected_field=$3
  
  echo -n "Testing $name... "
  
  response=$(curl -s "$BASE_URL$endpoint")
  
  if echo "$response" | jq -e ".$expected_field" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    return 0
  else
    echo -e "${RED}✗${NC}"
    echo "Response: $response"
    return 1
  fi
}

# Test health endpoint
test_endpoint "Health Check" "/health" "status"

# Test agents list
test_endpoint "List Agents" "/api/agents" "success"

# Get first agent ID
AGENT_ID=$(curl -s "$BASE_URL/api/agents" | jq -r '.data.agents[0].session_id')

if [ -n "$AGENT_ID" ] && [ "$AGENT_ID" != "null" ]; then
  # Test agent detail
  test_endpoint "Agent Detail" "/api/agents/$AGENT_ID" "success"
else
  echo -e "Testing Agent Detail... ${RED}✗${NC} (No agents found)"
fi

echo ""
echo "📊 Summary"
echo "=========="

# Get agent stats
AGENT_COUNT=$(curl -s "$BASE_URL/api/agents" | jq -r '.data.count')
ONLINE_COUNT=$(curl -s "$BASE_URL/api/agents" | jq -r '[.data.agents[] | select(.status == "online")] | length')
BUSY_COUNT=$(curl -s "$BASE_URL/api/agents" | jq -r '[.data.agents[] | select(.status == "busy")] | length')
OFFLINE_COUNT=$(curl -s "$BASE_URL/api/agents" | jq -r '[.data.agents[] | select(.status == "offline")] | length')
ERROR_COUNT=$(curl -s "$BASE_URL/api/agents" | jq -r '[.data.agents[] | select(.status == "error")] | length')

echo "Total agents: $AGENT_COUNT"
echo "  - Online: $ONLINE_COUNT"
echo "  - Busy: $BUSY_COUNT"
echo "  - Offline: $OFFLINE_COUNT"
echo "  - Error: $ERROR_COUNT"

echo ""
echo "✅ All tests passed!"
