#!/bin/bash
# Test script for Phase 2 Agent Control Endpoints

set -e

BASE_URL="http://localhost:8080"

echo "========================================="
echo "Mission Control Backend - Phase 2 Tests"
echo "Agent Control Actions API"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function
test_endpoint() {
  local name="$1"
  local method="$2"
  local url="$3"
  local data="$4"
  
  echo -e "${BLUE}Test: ${name}${NC}"
  echo "Method: ${method}"
  echo "URL: ${url}"
  
  if [ -n "$data" ]; then
    echo "Data: ${data}"
    response=$(curl -s -X "${method}" "${url}" -H "Content-Type: application/json" -d "${data}")
  else
    response=$(curl -s -X "${method}" "${url}")
  fi
  
  echo "Response:"
  echo "${response}" | jq '.'
  
  # Check if successful
  success=$(echo "${response}" | jq -r '.success')
  if [ "$success" = "true" ]; then
    echo -e "${GREEN}✓ Success${NC}"
  else
    echo "✗ Failed"
  fi
  
  echo ""
  echo "---"
  echo ""
}

# Get first agent ID for testing
echo "Getting agent list..."
AGENT_ID=$(curl -s "${BASE_URL}/api/agents" | jq -r '.data.agents[0].id')
SESSION_ID=$(curl -s "${BASE_URL}/api/agents" | jq -r '.data.agents[0].session_id')
AGENT_NAME=$(curl -s "${BASE_URL}/api/agents" | jq -r '.data.agents[0].name')

echo "Test Agent:"
echo "  Name: ${AGENT_NAME}"
echo "  ID: ${AGENT_ID}"
echo "  Session ID: ${SESSION_ID}"
echo ""
echo "========================================="
echo ""

# Test 1: Health Check
test_endpoint \
  "Health Check" \
  "GET" \
  "${BASE_URL}/health"

# Test 2: List Agents
test_endpoint \
  "List All Agents" \
  "GET" \
  "${BASE_URL}/api/agents"

# Test 3: Get Agent Details
test_endpoint \
  "Get Agent Details" \
  "GET" \
  "${BASE_URL}/api/agents/${AGENT_ID}"

# Test 4: Check Stop Status
test_endpoint \
  "Check Agent Stop Status (Heartbeat)" \
  "POST" \
  "${BASE_URL}/api/agents/${AGENT_ID}/stop"

# Test 5: Check Restart Status
test_endpoint \
  "Check Agent Restart Status (Heartbeat)" \
  "POST" \
  "${BASE_URL}/api/agents/${AGENT_ID}/restart"

# Test 6: Get Agent Settings
test_endpoint \
  "Get Agent Settings" \
  "GET" \
  "${BASE_URL}/api/agents/${AGENT_ID}/settings"

# Test 7: Send Message (with confirmation)
echo ""
echo "========================================="
echo "Message Test"
echo "========================================="
echo ""
echo "This test will send a message to the agent session."
echo "Agent: ${AGENT_NAME}"
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  test_endpoint \
    "Send Message to Agent" \
    "POST" \
    "${BASE_URL}/api/agents/${SESSION_ID}/message" \
    '{"message":"Test message from control endpoints API test script"}'
else
  echo "Skipped message test"
  echo ""
fi

echo "========================================="
echo "All Tests Complete!"
echo "========================================="
