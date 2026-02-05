#!/bin/bash
# Mission Control - Restart Staging Server

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔄 Restarting Mission Control..."
echo ""

# Stop the server
"$SCRIPT_DIR/stop-staging.sh"

echo ""

# Wait a moment
sleep 2

# Start the server
"$SCRIPT_DIR/start-staging.sh"
