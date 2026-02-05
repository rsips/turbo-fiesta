#!/bin/bash
# Mission Control - Stop Staging Server

set -e

PROJECT_ROOT="/home/sky/.openclaw/workspace/mission-control"
BACKEND_DIR="$PROJECT_ROOT/backend"
PID_FILE="$BACKEND_DIR/staging.pid"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}✓${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }

if [ ! -f "$PID_FILE" ]; then
    log_warn "No PID file found. Server may not be running."
    exit 0
fi

PID=$(cat "$PID_FILE")

if ! ps -p "$PID" > /dev/null 2>&1; then
    log_warn "Server process (PID: $PID) is not running"
    rm -f "$PID_FILE"
    exit 0
fi

log_info "Stopping Mission Control server (PID: $PID)..."

# Try graceful shutdown first
kill "$PID" 2>/dev/null || true

# Wait up to 10 seconds for graceful shutdown
for i in {1..10}; do
    if ! ps -p "$PID" > /dev/null 2>&1; then
        log_info "Server stopped successfully"
        rm -f "$PID_FILE"
        exit 0
    fi
    sleep 1
done

# Force kill if still running
if ps -p "$PID" > /dev/null 2>&1; then
    log_warn "Server did not stop gracefully, forcing..."
    kill -9 "$PID" 2>/dev/null || true
    sleep 1
    
    if ! ps -p "$PID" > /dev/null 2>&1; then
        log_info "Server force-stopped"
        rm -f "$PID_FILE"
    else
        log_error "Failed to stop server"
        exit 1
    fi
fi
