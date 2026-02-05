#!/bin/bash
# Mission Control - Status Check

PROJECT_ROOT="/home/sky/.openclaw/workspace/mission-control"
BACKEND_DIR="$PROJECT_ROOT/backend"
PID_FILE="$BACKEND_DIR/staging.pid"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Mission Control Status ===${NC}"
echo ""

# Check server process
echo -e "${BLUE}Server Process:${NC}"
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Running (PID: $PID)"
        UPTIME=$(ps -p "$PID" -o etime= | tr -d ' ')
        echo -e "  Uptime: $UPTIME"
    else
        echo -e "  ${RED}✗${NC} Not running (stale PID: $PID)"
    fi
else
    echo -e "  ${RED}✗${NC} Not running (no PID file)"
fi

echo ""

# Check port
echo -e "${BLUE}Port 8080:${NC}"
if ss -tuln | grep -q ":8080"; then
    echo -e "  ${GREEN}✓${NC} Listening"
else
    echo -e "  ${RED}✗${NC} Not listening"
fi

echo ""

# Health check
echo -e "${BLUE}Health Check:${NC}"
HEALTH=$(curl -s -m 2 http://localhost:8080/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} Responding"
    echo "$HEALTH" | jq -r '
        "  Status: \(.status)",
        "  Gateway: \(.gateway)",
        "  WebSocket: \(.websocket.status)",
        "  Connections: \(.websocket.connections)"
    ' 2>/dev/null || echo "  $HEALTH"
else
    echo -e "  ${RED}✗${NC} Not responding"
fi

echo ""

# Gateway check
echo -e "${BLUE}OpenClaw Gateway:${NC}"
if command -v openclaw &> /dev/null; then
    GW_STATUS=$(openclaw gateway status 2>&1 | head -1)
    if echo "$GW_STATUS" | grep -q "running"; then
        echo -e "  ${GREEN}✓${NC} Running"
    else
        echo -e "  ${YELLOW}⚠${NC} Not running"
        echo "  Start with: openclaw gateway start"
    fi
else
    echo -e "  ${YELLOW}⚠${NC} OpenClaw CLI not found"
fi

echo ""

# Recent logs
echo -e "${BLUE}Recent Logs (last 5 lines):${NC}"
if [ -f "$BACKEND_DIR/staging.log" ]; then
    tail -5 "$BACKEND_DIR/staging.log" | sed 's/^/  /'
else
    echo "  No logs found"
fi

echo ""

# Errors
ERROR_COUNT=$(tail -100 "$BACKEND_DIR/staging-error.log" 2>/dev/null | wc -l)
if [ "$ERROR_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠ Errors in log: $ERROR_COUNT lines${NC}"
    echo "  View with: tail -f $BACKEND_DIR/staging-error.log"
    echo ""
fi

echo -e "${BLUE}Access:${NC} http://localhost:8080"
echo -e "${BLUE}Logs:${NC} tail -f $BACKEND_DIR/staging.log"
echo ""
