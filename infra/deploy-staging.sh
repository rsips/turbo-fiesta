#!/bin/bash
# Mission Control - Staging Deployment Script
set -e

echo "🚀 Mission Control - Staging Deployment"
echo "========================================"

# Configuration
PROJECT_ROOT="/home/sky/.openclaw/workspace/mission-control"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
SERVICE_NAME="mission-control-api"
BACKEND_PORT=8080
FRONTEND_PORT=3000

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
sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://localhost:$BACKEND_PORT,http://localhost:$FRONTEND_PORT|" "$BACKEND_DIR/.env"
log_info "Environment configured for staging"

# Step 5: Build applications
echo ""
echo "🔨 Building applications..."
cd "$BACKEND_DIR"
npm run build > /dev/null 2>&1 && log_info "Backend built successfully" || log_error "Backend build failed"

cd "$FRONTEND_DIR"
npm run build > /dev/null 2>&1 && log_info "Frontend built successfully" || log_error "Frontend build failed"

# Step 6: Copy frontend build to backend (for serving)
echo ""
echo "📦 Copying frontend to backend..."
rm -rf "$BACKEND_DIR/public"
cp -r "$FRONTEND_DIR/dist" "$BACKEND_DIR/public"
log_info "Frontend copied to backend/public"

# Step 7: Create systemd service
echo ""
echo "🔧 Creating systemd service..."
SERVICE_FILE="/tmp/$SERVICE_NAME.service"
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Mission Control API Server (Staging)
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$BACKEND_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/node $BACKEND_DIR/dist/server.js
Restart=always
RestartSec=10
StandardOutput=append:$BACKEND_DIR/staging.log
StandardError=append:$BACKEND_DIR/staging-error.log

[Install]
WantedBy=multi-user.target
EOF

log_info "Service file created at $SERVICE_FILE"

# Step 8: Install and start service (requires sudo)
echo ""
echo "🚦 Installing systemd service..."
if sudo -n true 2>/dev/null; then
    sudo cp "$SERVICE_FILE" "/etc/systemd/system/$SERVICE_NAME.service"
    sudo systemctl daemon-reload
    sudo systemctl enable "$SERVICE_NAME"
    sudo systemctl restart "$SERVICE_NAME"
    log_info "Service installed and started"
else
    log_warn "Sudo access required to install systemd service"
    log_info "Run manually:"
    echo "    sudo cp $SERVICE_FILE /etc/systemd/system/$SERVICE_NAME.service"
    echo "    sudo systemctl daemon-reload"
    echo "    sudo systemctl enable $SERVICE_NAME"
    echo "    sudo systemctl restart $SERVICE_NAME"
fi

# Step 9: Wait for service to start
echo ""
echo "⏳ Waiting for service to start..."
sleep 3

# Step 10: Check service status
echo ""
echo "🔍 Service Status:"
if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
    log_info "Service is running"
    systemctl status "$SERVICE_NAME" --no-pager -l | head -10
else
    log_warn "Service status unknown (may need sudo)"
    log_info "Check with: sudo systemctl status $SERVICE_NAME"
fi

# Step 11: Test health endpoint
echo ""
echo "🏥 Testing health endpoint..."
sleep 2
if curl -k -s https://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
    log_info "Health check passed"
else
    log_warn "Health check failed (service may still be starting)"
fi

# Final summary
echo ""
echo "========================================" 
echo "✅ Deployment Complete!"
echo "========================================" 
echo ""
echo "📍 Access URLs:"
echo "   API (HTTPS):  https://localhost:$BACKEND_PORT"
echo "   Frontend:     https://localhost:$BACKEND_PORT"
echo "   Health:       https://localhost:$BACKEND_PORT/health"
echo ""
echo "🔧 Service Management:"
echo "   Status:       sudo systemctl status $SERVICE_NAME"
echo "   Stop:         sudo systemctl stop $SERVICE_NAME"
echo "   Start:        sudo systemctl start $SERVICE_NAME"
echo "   Restart:      sudo systemctl restart $SERVICE_NAME"
echo "   Logs:         sudo journalctl -u $SERVICE_NAME -f"
echo "   App Logs:     tail -f $BACKEND_DIR/staging.log"
echo ""
echo "⚠️  Note: Using self-signed TLS certificate"
echo "   Accept the browser security warning or add cert to trusted store"
echo ""
echo "🎉 Ready for dogfooding!"
