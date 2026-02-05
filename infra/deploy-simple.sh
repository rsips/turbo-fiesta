#!/bin/bash
# Mission Control - Simple Deployment Script (No systemd)
set -e

echo "🚀 Mission Control - Staging Deployment"
echo "========================================"

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="/home/sky/.openclaw/workspace/mission-control"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_PORT=8080

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }

# Step 1: Check prerequisites
echo ""
echo "📋 Checking prerequisites..."
if [ ! -d "$BACKEND_DIR" ]; then
    log_error "Backend directory not found: $BACKEND_DIR"
    exit 1
fi
if [ ! -d "$FRONTEND_DIR" ]; then
    log_error "Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi
log_info "Prerequisites OK"

# Step 2: Generate JWT secret if needed
echo ""
echo "🔐 Configuring secrets..."
if [ ! -f "$BACKEND_DIR/.env" ]; then
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    JWT_SECRET=$(openssl rand -hex 32)
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" "$BACKEND_DIR/.env"
    log_info "Generated new JWT secret"
else
    log_info "Using existing .env file"
fi

# Step 3: Generate TLS certificates
echo ""
echo "🔒 Setting up TLS certificates..."
cd "$BACKEND_DIR"
if [ ! -f "./certs/server.crt" ] || [ ! -f "./certs/server.key" ]; then
    mkdir -p ./certs
    openssl req -x509 -newkey rsa:4096 -keyout ./certs/server.key -out ./certs/server.crt \
        -days 365 -nodes -subj "/CN=mission-control.local/O=TKH/C=US" 2>/dev/null
    log_info "Generated self-signed TLS certificates (valid for 365 days)"
else
    log_info "TLS certificates already exist"
fi

# Step 4: Update environment for staging
echo ""
echo "⚙️  Configuring environment..."
sed -i "s/NODE_ENV=.*/NODE_ENV=production/" "$BACKEND_DIR/.env"
sed -i "s/TLS_ENABLED=.*/TLS_ENABLED=true/" "$BACKEND_DIR/.env"
sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://localhost:$BACKEND_PORT,http://localhost:3000|" "$BACKEND_DIR/.env"
log_info "Environment configured for staging"

# Step 5: Build applications
echo ""
echo "🔨 Building applications..."
cd "$BACKEND_DIR"
npm run build > /dev/null 2>&1 && log_info "Backend built successfully" || { log_error "Backend build failed"; exit 1; }

cd "$FRONTEND_DIR"
npm run build > /dev/null 2>&1 && log_info "Frontend built successfully" || { log_error "Frontend build failed"; exit 1; }

# Step 6: Copy frontend build to backend (for serving)
echo ""
echo "📦 Copying frontend to backend..."
rm -rf "$BACKEND_DIR/public"
cp -r "$FRONTEND_DIR/dist" "$BACKEND_DIR/public"
log_info "Frontend copied to backend/public"

# Step 7: Make scripts executable
echo ""
echo "🔧 Setting up management scripts..."
chmod +x "$SCRIPT_DIR/start-staging.sh"
chmod +x "$SCRIPT_DIR/stop-staging.sh"
chmod +x "$SCRIPT_DIR/restart-staging.sh"
log_info "Management scripts ready"

# Step 8: Stop existing server if running
echo ""
echo "🔄 Checking for existing server..."
if [ -f "$BACKEND_DIR/staging.pid" ]; then
    log_info "Stopping existing server..."
    "$SCRIPT_DIR/stop-staging.sh" 2>/dev/null || true
    sleep 1
fi

# Step 9: Start the server
echo ""
echo "🚀 Starting server..."
"$SCRIPT_DIR/start-staging.sh"

echo ""
echo "========================================" 
echo "✅ Deployment Complete!"
echo "========================================" 
echo ""
echo "📍 Access URLs:"
echo "   Application:  https://localhost:$BACKEND_PORT"
echo "   Health Check: https://localhost:$BACKEND_PORT/health"
echo ""
echo "🔧 Management Commands:"
echo "   Start:    cd $SCRIPT_DIR && ./start-staging.sh"
echo "   Stop:     cd $SCRIPT_DIR && ./stop-staging.sh"
echo "   Restart:  cd $SCRIPT_DIR && ./restart-staging.sh"
echo "   Logs:     tail -f $BACKEND_DIR/staging.log"
echo "   Errors:   tail -f $BACKEND_DIR/staging-error.log"
echo ""
echo "⚠️  Note: Using self-signed TLS certificate"
echo "   Accept the browser security warning when accessing"
echo ""
echo "🎉 Ready for dogfooding!"
