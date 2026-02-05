#!/bin/bash
# Mission Control - Start Staging Server

set -e

PROJECT_ROOT="/home/sky/.openclaw/workspace/mission-control"
BACKEND_DIR="$PROJECT_ROOT/backend"
PID_FILE="$BACKEND_DIR/staging.pid"
LOG_FILE="$BACKEND_DIR/staging.log"
ERROR_LOG="$BACKEND_DIR/staging-error.log"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}✓${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }

# Check if already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        log_warn "Server is already running (PID: $PID)"
        echo "   Use ./stop-staging.sh to stop it first"
        exit 1
    else
        log_warn "Stale PID file found, removing..."
        rm -f "$PID_FILE"
    fi
fi

# Ensure backend is built
if [ ! -d "$BACKEND_DIR/dist" ]; then
    log_error "Backend not built. Run deploy-staging.sh first"
    exit 1
fi

# Ensure frontend is deployed
if [ ! -d "$BACKEND_DIR/public" ]; then
    log_error "Frontend not deployed. Run deploy-staging.sh first"
    exit 1
fi

# Start server
cd "$BACKEND_DIR"
log_info "Starting Mission Control server..."

# Export environment
export NODE_ENV=production

# Start with nohup
nohup node dist/server.js >> "$LOG_FILE" 2>> "$ERROR_LOG" &
SERVER_PID=$!

# Save PID
echo "$SERVER_PID" > "$PID_FILE"

# Wait a moment and check if it's still running
sleep 2

if ps -p "$SERVER_PID" > /dev/null 2>&1; then
    log_info "Server started successfully (PID: $SERVER_PID)"
    echo ""
    echo "📍 Access URLs:"
    echo "   Frontend/API: https://localhost:8080"
    echo "   Health Check: https://localhost:8080/health"
    echo ""
    echo "📋 Management:"
    echo "   Stop:    ./stop-staging.sh"
    echo "   Restart: ./restart-staging.sh"
    echo "   Logs:    tail -f $LOG_FILE"
    echo "   Errors:  tail -f $ERROR_LOG"
    echo ""
    
    # Test health endpoint
    sleep 1
    if curl -k -s https://localhost:8080/health > /dev/null 2>&1; then
        log_info "Health check passed ✓"
    else
        log_warn "Health check failed (server may still be starting)"
    fi
else
    log_error "Server failed to start"
    log_error "Check logs: tail -f $ERROR_LOG"
    rm -f "$PID_FILE"
    exit 1
fi
