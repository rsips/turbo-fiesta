# Mission Control Security Guide

This document covers security configuration, TLS/HTTPS setup, and agent authentication for Mission Control.

## Table of Contents

1. [Overview](#overview)
2. [TLS/HTTPS Setup](#tlshttps-setup)
3. [Agent Authentication](#agent-authentication)
4. [Environment Secrets](#environment-secrets)
5. [Production Deployment](#production-deployment)
6. [Security Best Practices](#security-best-practices)

---

## Overview

Mission Control implements multiple layers of security:

- **TLS/HTTPS**: Encrypted transport for all communications
- **JWT Authentication**: User authentication for web UI
- **Agent API Keys**: Authentication for OpenClaw agents
- **CORS Protection**: Cross-origin request filtering
- **Environment Secrets**: Secure credential management

---

## TLS/HTTPS Setup

### Development (Self-Signed Certificates)

For local development, use self-signed certificates:

```bash
cd backend
npm run generate-certs
```

This creates:
- `./certs/server.key` - Private key
- `./certs/server.crt` - Self-signed certificate

**Enable HTTPS in development:**

```bash
# Backend .env
TLS_ENABLED=true
TLS_CERT_PATH=./certs/server.crt
TLS_KEY_PATH=./certs/server.key

# Frontend .env
VITE_BACKEND_TLS=true
VITE_TLS_ENABLED=true  # Optional: Enable frontend HTTPS too
```

**Note:** Self-signed certificates will trigger browser warnings. Accept them for `localhost`.

### Production (Let's Encrypt)

For production, use Let's Encrypt for trusted certificates:

#### Option 1: Certbot (Recommended)

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot

# Generate certificate (interactive)
sudo certbot certonly --standalone -d mission-control.yourdomain.com

# Certificates will be in:
# /etc/letsencrypt/live/mission-control.yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/mission-control.yourdomain.com/privkey.pem
```

**Configure Mission Control:**

```bash
# Backend .env
TLS_ENABLED=true
TLS_CERT_PATH=/etc/letsencrypt/live/mission-control.yourdomain.com/fullchain.pem
TLS_KEY_PATH=/etc/letsencrypt/live/mission-control.yourdomain.com/privkey.pem
```

#### Option 2: Reverse Proxy (Nginx/Caddy)

Use a reverse proxy to handle TLS termination:

**Nginx Example:**

```nginx
server {
    listen 443 ssl http2;
    server_name mission-control.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/mission-control.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mission-control.yourdomain.com/privkey.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Backend proxy
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # Frontend (if built)
    location / {
        root /var/www/mission-control;
        try_files $uri $uri/ /index.html;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name mission-control.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

**Caddy Example (automatic HTTPS!):**

```caddyfile
mission-control.yourdomain.com {
    # Caddy automatically gets Let's Encrypt certificates!
    
    reverse_proxy /api/* localhost:8080
    reverse_proxy /ws localhost:8080 {
        header_up Upgrade {http.request.header.Upgrade}
        header_up Connection {http.request.header.Connection}
    }
    
    root * /var/www/mission-control
    file_server
    try_files {path} /index.html
}
```

### Certificate Renewal

**Let's Encrypt certificates expire every 90 days.**

#### Automatic Renewal (Certbot)

```bash
# Test renewal
sudo certbot renew --dry-run

# Set up automatic renewal (cron)
sudo crontab -e

# Add this line (runs daily at 2am):
0 2 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

#### Manual Renewal

```bash
sudo certbot renew
sudo systemctl reload nginx  # If using reverse proxy
# OR
sudo systemctl restart mission-control  # If app handles TLS
```

**Monitor expiration:**

```bash
# Check certificate expiry
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/cert.pem -noout -dates
```

---

## Agent Authentication

Mission Control uses API keys to authenticate OpenClaw agents.

### Why API Keys?

- **Simpler** than mTLS for agent-to-server auth
- **Easier to rotate** - just generate new key, update agents, revoke old
- **Better logging** - track which agent made which request
- **Granular control** - per-agent permissions and metadata

### Creating Agent API Keys

#### Via API (Requires admin authentication)

```bash
# Login first
TOKEN=$(curl -X POST https://mission-control.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}' \
  | jq -r '.data.token')

# Create agent API key
curl -X POST https://mission-control.example.com/api/agent-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "openclaw-agent-1",
    "expiresInDays": 365,
    "metadata": {
      "nodeId": "node-1",
      "location": "datacenter-1"
    }
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "a3f2b1c4d5e6",
    "name": "openclaw-agent-1",
    "apiKey": "mc_1234567890abcdef1234567890abcdef",
    "createdAt": "2026-02-05T22:00:00.000Z",
    "expiresAt": "2027-02-05T22:00:00.000Z",
    "message": "⚠️ Save this API key now! It will not be shown again."
  }
}
```

**⚠️ CRITICAL: Save the API key immediately!** It will never be shown again.

### Using Agent API Keys

Agents must include the `X-Agent-Key` header in all requests:

```bash
curl https://mission-control.example.com/api/agents \
  -H "X-Agent-Key: mc_1234567890abcdef1234567890abcdef"
```

**In OpenClaw agent code:**

```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: 'https://mission-control.example.com',
  headers: {
    'X-Agent-Key': process.env.MISSION_CONTROL_API_KEY,
  },
});

// Make authenticated requests
const response = await client.get('/api/agents');
```

### Managing Agent API Keys

#### List all keys

```bash
curl https://mission-control.example.com/api/agent-keys \
  -H "Authorization: Bearer $TOKEN"
```

#### Get key details

```bash
curl https://mission-control.example.com/api/agent-keys/{key-id} \
  -H "Authorization: Bearer $TOKEN"
```

#### Revoke a key (deactivate)

```bash
curl -X POST https://mission-control.example.com/api/agent-keys/{key-id}/revoke \
  -H "Authorization: Bearer $TOKEN"
```

#### Delete a key (permanent)

```bash
curl -X DELETE https://mission-control.example.com/api/agent-keys/{key-id} \
  -H "Authorization: Bearer $TOKEN"
```

### Key Rotation

**Best practice:** Rotate agent API keys every 6-12 months.

1. **Create new key** for the agent
2. **Update agent** with new key
3. **Test** - verify agent can connect
4. **Revoke old key** after grace period
5. **Monitor logs** for auth failures

**Rotation script example:**

```bash
#!/bin/bash
# rotate-agent-key.sh

AGENT_NAME="openclaw-agent-1"
OLD_KEY_ID="abc123"

# Create new key
NEW_KEY=$(curl -X POST https://mission-control.example.com/api/agent-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$AGENT_NAME\",\"expiresInDays\":365}" \
  | jq -r '.data.apiKey')

echo "New API key: $NEW_KEY"
echo "Update your agent configuration, then revoke old key with:"
echo "curl -X POST https://mission-control.example.com/api/agent-keys/$OLD_KEY_ID/revoke -H \"Authorization: Bearer \$TOKEN\""
```

---

## Environment Secrets

### Critical Secrets

**Backend `.env`:**

```bash
# JWT Secret - MUST be changed in production!
# Generate: openssl rand -hex 32
JWT_SECRET=your-randomly-generated-secret-here

# Agent API keys stored here:
AGENT_KEYS_FILE=./data/agent-keys.json
```

### Secret Generation

```bash
# Generate strong JWT secret
openssl rand -hex 32

# Generate strong password
openssl rand -base64 32
```

### Secret Storage

**Development:**
- Store in `.env` file (gitignored)
- Never commit `.env` to git

**Production Options:**

1. **Environment variables** (systemd, docker-compose)
2. **Secret management service** (HashiCorp Vault, AWS Secrets Manager)
3. **Kubernetes secrets** (if using k8s)

#### Systemd Example

```ini
# /etc/systemd/system/mission-control.service
[Service]
Environment="JWT_SECRET=your-secret-here"
Environment="TLS_ENABLED=true"
Environment="TLS_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem"
Environment="TLS_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem"
ExecStart=/usr/bin/node /opt/mission-control/backend/dist/server.js
```

#### Docker Compose Example

```yaml
version: '3.8'
services:
  mission-control:
    image: mission-control:latest
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - TLS_ENABLED=true
    secrets:
      - tls_cert
      - tls_key
    env_file:
      - .env.production

secrets:
  tls_cert:
    file: ./certs/server.crt
  tls_key:
    file: ./certs/server.key
```

### Gitignore

Ensure these are in `.gitignore`:

```gitignore
# Secrets
.env
.env.local
.env.production

# Certificates
certs/
*.key
*.crt
*.pem

# Data stores
data/
*.json
!.gitkeep
```

---

## Production Deployment

### Pre-Flight Security Checklist

- [ ] **TLS/HTTPS enabled** with valid certificates
- [ ] **JWT_SECRET changed** from default
- [ ] **Strong admin password** set
- [ ] **CORS origin restricted** (not `*`)
- [ ] **Agent auth enabled**
- [ ] **Firewall configured** (block direct access to backend)
- [ ] **Log monitoring** set up
- [ ] **Certificate renewal** automated
- [ ] **Backup strategy** for agent keys and user data
- [ ] **Rate limiting** configured (if exposed to internet)

### Production .env Template

```bash
# Backend Production Configuration

# Server
PORT=8080

# TLS/HTTPS (REQUIRED in production)
TLS_ENABLED=true
TLS_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
TLS_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem

# Authentication (CHANGE THESE!)
JWT_SECRET=<generate-with-openssl-rand-hex-32>
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

# CORS (RESTRICT in production!)
CORS_ENABLED=true
CORS_ORIGIN=https://mission-control.yourdomain.com

# Production
USE_MOCK_DATA=false
NODE_ENV=production
LOG_LEVEL=info
```

### Deployment Architecture

**Recommended setup for internal TKH deployment:**

```
Internet/Internal Network
    │
    ├─> Firewall
    │
    ├─> Load Balancer (optional)
    │
    ├─> Reverse Proxy (Nginx/Caddy)
    │   ├─> TLS Termination
    │   ├─> Rate Limiting
    │   └─> Static File Serving
    │
    ├─> Mission Control Backend (HTTPS or HTTP if behind proxy)
    │   ├─> Express.js
    │   ├─> WebSocket
    │   └─> Agent API
    │
    ├─> OpenClaw Gateway (localhost:18789)
    │
    └─> Agent Network
        ├─> OpenClaw Agent 1 (with API key)
        ├─> OpenClaw Agent 2 (with API key)
        └─> OpenClaw Agent N (with API key)
```

---

## Security Best Practices

### 1. Defense in Depth

- **Never expose backend directly** - use reverse proxy
- **Firewall rules** - only allow necessary ports
- **Network segmentation** - separate agent network from public
- **Regular updates** - keep dependencies up to date

### 2. Principle of Least Privilege

- **Agent API keys** - only give access needed
- **User roles** - implement admin vs. viewer roles
- **File permissions** - `600` for keys, `644` for certs

### 3. Monitoring & Logging

- **Log all auth failures**
- **Monitor certificate expiration**
- **Track agent API key usage**
- **Alert on suspicious activity**

### 4. Incident Response

**If an agent API key is compromised:**

1. **Revoke the key immediately**
2. **Check logs** for unauthorized access
3. **Rotate all keys** if in doubt
4. **Investigate** how key was leaked
5. **Update procedures** to prevent recurrence

**If JWT_SECRET is compromised:**

1. **Change JWT_SECRET immediately**
2. **All users must re-login**
3. **Review all recent actions**
4. **Audit access logs**

### 5. Regular Audits

- **Quarterly**: Review active agent keys, revoke unused
- **Monthly**: Check certificate expiration
- **Weekly**: Review access logs for anomalies
- **Daily**: Monitor error logs

### 6. Backup & Recovery

```bash
# Backup critical data
tar -czf mission-control-backup-$(date +%Y%m%d).tar.gz \
  /var/lib/mission-control/users.json \
  /var/lib/mission-control/agent-keys.json

# Encrypt backup
gpg --encrypt --recipient admin@example.com \
  mission-control-backup-20260205.tar.gz
```

**Store backups securely**, off-site if possible.

---

## Quick Reference

### Generate Certificates (Dev)

```bash
cd backend && npm run generate-certs
```

### Create Agent API Key

```bash
curl -X POST https://api.example.com/api/agent-keys \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"agent-1","expiresInDays":365}'
```

### Check Certificate Expiration

```bash
openssl x509 -in cert.pem -noout -dates
```

### Rotate JWT Secret

```bash
# Generate new secret
NEW_SECRET=$(openssl rand -hex 32)

# Update .env
echo "JWT_SECRET=$NEW_SECRET" >> .env

# Restart server
sudo systemctl restart mission-control
```

---

## Support

For security issues, contact: [security@example.com]

For general questions: See [README.md](../README.md)
