# Mission Control Setup Guide

Complete setup instructions for Mission Control with TLS/HTTPS and Agent Authentication.

## Quick Start (Development)

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Generate self-signed certificates for HTTPS (optional)
npm run generate-certs

# Configure environment
cp .env.example .env
# Edit .env if needed

# Start backend (HTTP)
npm run dev

# OR start with HTTPS
npm run dev:https
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start frontend dev server
npm run dev
```

### 3. Create First Admin User

```bash
# Register admin user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-secure-password"
  }'
```

### 4. Create Agent API Key

```bash
cd backend

# Interactive CLI tool
npm run create-agent-key

# Follow prompts to create key
```

**OR via API:**

```bash
# Login first
TOKEN=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}' \
  | jq -r '.data.token')

# Create agent key
curl -X POST http://localhost:8080/api/agent-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"my-agent","expiresInDays":365}' \
  | jq
```

### 5. Configure Agent

```bash
# Set environment variables
export MISSION_CONTROL_URL="http://localhost:8080"
export MISSION_CONTROL_API_KEY="mc_your_key_here"

# Test connection
curl $MISSION_CONTROL_URL/api/health \
  -H "X-Agent-Key: $MISSION_CONTROL_API_KEY"
```

## Production Setup

### Prerequisites

- Linux server (Ubuntu 20.04+ recommended)
- Domain name with DNS configured
- Firewall configured (ports 80, 443)
- Node.js 18+ installed
- OpenClaw Gateway running

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install build tools
sudo apt-get install -y build-essential git

# Install Caddy (automatic HTTPS) or Nginx
sudo apt install -y caddy
# OR
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2. Clone and Build

```bash
# Clone repository
git clone https://github.com/yourorg/mission-control.git
cd mission-control

# Build backend
cd backend
npm install
npm run build

# Build frontend
cd ../frontend
npm install
npm run build
```

### 3. Configure Production Environment

```bash
cd backend

# Create production .env
cat > .env << EOF
# Server
PORT=8080

# TLS/HTTPS (if handling directly, or false if using reverse proxy)
TLS_ENABLED=false

# Authentication (CHANGE THESE!)
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRATION=24h
BCRYPT_ROUNDS=12

# Agent Authentication
AGENT_AUTH_ENABLED=true
AGENT_KEYS_FILE=/var/lib/mission-control/agent-keys.json

# Data Storage
DATA_DIR=/var/lib/mission-control
USER_STORE_PATH=/var/lib/mission-control/users.json

# OpenClaw Gateway
GATEWAY_URL=http://localhost:18789
GATEWAY_TIMEOUT=5000

# CORS (use your domain!)
CORS_ENABLED=true
CORS_ORIGIN=https://mission-control.yourdomain.com

# Production
USE_MOCK_DATA=false
NODE_ENV=production
LOG_LEVEL=info
EOF

# Create data directory
sudo mkdir -p /var/lib/mission-control
sudo chown $USER:$USER /var/lib/mission-control
chmod 700 /var/lib/mission-control
```

### 4. Set Up Reverse Proxy

#### Option A: Caddy (Easiest - Automatic HTTPS!)

```bash
# Create Caddyfile
sudo cat > /etc/caddy/Caddyfile << 'EOF'
mission-control.yourdomain.com {
    # Caddy automatically handles HTTPS with Let's Encrypt!
    
    # Backend API
    reverse_proxy /api/* localhost:8080
    
    # WebSocket
    reverse_proxy /ws localhost:8080 {
        header_up Upgrade {http.request.header.Upgrade}
        header_up Connection {http.request.header.Connection}
    }
    
    # Frontend (built files)
    root * /opt/mission-control/frontend/dist
    file_server
    try_files {path} /index.html
    
    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
    }
}
EOF

# Reload Caddy
sudo systemctl reload caddy
```

#### Option B: Nginx + Let's Encrypt

```bash
# Create Nginx config
sudo cat > /etc/nginx/sites-available/mission-control << 'EOF'
server {
    listen 80;
    server_name mission-control.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mission-control.yourdomain.com;

    # SSL (will be configured by certbot)
    ssl_certificate /etc/letsencrypt/live/mission-control.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mission-control.yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
    
    # Frontend
    root /opt/mission-control/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/mission-control /etc/nginx/sites-enabled/

# Get Let's Encrypt certificate
sudo certbot --nginx -d mission-control.yourdomain.com

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Create Systemd Service

```bash
sudo cat > /etc/systemd/system/mission-control.service << EOF
[Unit]
Description=Mission Control Backend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/mission-control/backend
Environment="NODE_ENV=production"
EnvironmentFile=/opt/mission-control/backend/.env
ExecStart=/usr/bin/node /opt/mission-control/backend/dist/server.js
Restart=always
RestartSec=10

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/mission-control

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable mission-control
sudo systemctl start mission-control

# Check status
sudo systemctl status mission-control
```

### 6. Verify Deployment

```bash
# Check backend health
curl https://mission-control.yourdomain.com/api/health

# Check SSL
curl -I https://mission-control.yourdomain.com

# Check logs
sudo journalctl -u mission-control -f
```

### 7. Create Admin User and Agent Keys

```bash
# Register admin
curl -X POST https://mission-control.yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-secure-password"}'

# Login
TOKEN=$(curl -X POST https://mission-control.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}' \
  | jq -r '.data.token')

# Create agent key
curl -X POST https://mission-control.yourdomain.com/api/agent-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"production-agent-1","expiresInDays":365}' \
  | jq
```

## Configuration Reference

### Backend Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Backend server port |
| `TLS_ENABLED` | `false` | Enable HTTPS on backend |
| `TLS_CERT_PATH` | `./certs/server.crt` | TLS certificate path |
| `TLS_KEY_PATH` | `./certs/server.key` | TLS private key path |
| `JWT_SECRET` | ⚠️ required | JWT signing secret (change in prod!) |
| `JWT_EXPIRATION` | `24h` | JWT token lifetime |
| `BCRYPT_ROUNDS` | `10` | Password hashing rounds |
| `AGENT_AUTH_ENABLED` | `true` | Enable agent authentication |
| `AGENT_KEYS_FILE` | `./data/agent-keys.json` | Agent keys storage |
| `GATEWAY_URL` | `http://localhost:18789` | OpenClaw Gateway URL |
| `GATEWAY_TIMEOUT` | `2000` | Gateway request timeout (ms) |
| `CORS_ENABLED` | `true` | Enable CORS |
| `CORS_ORIGIN` | `*` | CORS allowed origins |
| `USE_MOCK_DATA` | `false` | Use mock data (dev only) |
| `NODE_ENV` | `development` | Environment (development/production) |
| `LOG_LEVEL` | `info` | Logging level |

### Frontend Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | - | Backend API URL (production) |
| `VITE_BACKEND_TLS` | `false` | Backend uses HTTPS (dev proxy) |
| `VITE_BACKEND_PORT` | `8080` | Backend port (dev proxy) |
| `VITE_TLS_ENABLED` | `false` | Enable HTTPS on Vite dev server |
| `NODE_ENV` | `development` | Environment |

## Maintenance

### Update Application

```bash
# Pull latest changes
cd /opt/mission-control
git pull

# Rebuild backend
cd backend
npm install
npm run build

# Rebuild frontend
cd ../frontend
npm install
npm run build

# Restart service
sudo systemctl restart mission-control

# Reload web server
sudo systemctl reload caddy
# OR
sudo systemctl reload nginx
```

### Backup Data

```bash
# Backup script
#!/bin/bash
BACKUP_DIR="/var/backups/mission-control"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

tar -czf $BACKUP_DIR/mission-control-$DATE.tar.gz \
  /var/lib/mission-control/users.json \
  /var/lib/mission-control/agent-keys.json

# Keep only last 30 days
find $BACKUP_DIR -name "mission-control-*.tar.gz" -mtime +30 -delete
```

### Monitor Logs

```bash
# Backend logs
sudo journalctl -u mission-control -f

# Web server logs
sudo tail -f /var/log/caddy/access.log
# OR
sudo tail -f /var/log/nginx/access.log
```

### Rotate Agent Keys

See [SECURITY.md](./SECURITY.md#key-rotation) for key rotation procedures.

### Certificate Renewal

If using Let's Encrypt via Certbot:

```bash
# Automatic renewal is set up by default
# Test renewal
sudo certbot renew --dry-run

# Manual renewal
sudo certbot renew
```

If using Caddy: **Automatic!** Nothing to do.

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

## Security

See [SECURITY.md](./SECURITY.md) for comprehensive security documentation.

## Agent Setup

See [AGENT_SETUP.md](./AGENT_SETUP.md) for agent configuration guide.
