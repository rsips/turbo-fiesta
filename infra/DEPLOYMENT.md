# Mission Control - Deployment Guide (Staging)

## 🚀 Quick Deploy

Deploy Mission Control to staging in under 5 minutes:

```bash
cd /home/sky/.openclaw/workspace/mission-control/infra
chmod +x deploy-staging.sh
./deploy-staging.sh
```

That's it! The script will:
- ✅ Build backend and frontend
- ✅ Generate JWT secrets and TLS certificates
- ✅ Create systemd service
- ✅ Start the application
- ✅ Run health checks

## 📍 Access URLs

After deployment:

- **Application**: https://localhost:8080
- **API**: https://localhost:8080/api
- **Health Check**: https://localhost:8080/health

## 🔐 Security Notes

### TLS Certificates

The deployment uses **self-signed certificates** for staging. You'll need to:

1. **Accept browser warning** on first visit
2. Or add certificate to trusted store:

```bash
# View certificate
openssl x509 -in backend/certs/server.crt -text -noout

# Add to Chrome/Firefox trusted certificates (Linux)
sudo cp backend/certs/server.crt /usr/local/share/ca-certificates/mission-control.crt
sudo update-ca-certificates
```

### Default Credentials

First-time setup creates an admin user. Check the logs:

```bash
sudo journalctl -u mission-control-api -n 100 | grep "Default admin"
```

Or create a new admin:

```bash
cd /home/sky/.openclaw/workspace/mission-control/backend
npm run create-admin
```

## 🛠️ Service Management

The backend runs as a systemd service:

```bash
# Check status
sudo systemctl status mission-control-api

# View logs
sudo journalctl -u mission-control-api -f

# View application logs
tail -f /home/sky/.openclaw/workspace/mission-control/backend/staging.log
tail -f /home/sky/.openclaw/workspace/mission-control/backend/staging-error.log

# Restart service
sudo systemctl restart mission-control-api

# Stop service
sudo systemctl stop mission-control-api

# Start service
sudo systemctl start mission-control-api

# Disable service (won't start on boot)
sudo systemctl disable mission-control-api
```

## 🔄 Update Deployment

When you make changes:

```bash
cd /home/sky/.openclaw/workspace/mission-control/infra
./deploy-staging.sh
```

The script is idempotent - safe to run multiple times.

## 📊 Health Monitoring

### Health Check Endpoint

```bash
curl -k https://localhost:8080/health | jq
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2026-02-05T22:30:00.000Z",
  "gateway": "connected",
  "websocket": {
    "status": "running",
    "connections": 0,
    "connectedUsers": 0
  },
  "config": {
    "gatewayUrl": "http://localhost:18789",
    "useMockData": false
  }
}
```

### Check Gateway Connection

```bash
# Ensure OpenClaw Gateway is running
openclaw gateway status

# If not running:
openclaw gateway start
```

## 🧪 Testing

### API Testing

```bash
cd /home/sky/.openclaw/workspace/mission-control/backend

# Login and get JWT token
TOKEN=$(curl -k -s -X POST https://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}' | jq -r .data.token)

# Test agents endpoint
curl -k -H "Authorization: Bearer $TOKEN" https://localhost:8080/api/agents | jq

# Test agent detail
curl -k -H "Authorization: Bearer $TOKEN" https://localhost:8080/api/agents/main | jq
```

### WebSocket Testing

```bash
# Install wscat if needed
npm install -g wscat

# Connect to WebSocket (after getting JWT token)
wscat -c "wss://localhost:8080?token=$TOKEN" -n
```

## 🗂️ Data Persistence

Data is stored in JSON files:

```
backend/
├── data/
│   ├── users.json          # User accounts
│   ├── agent-keys.json     # API keys
│   └── audit-logs.json     # Audit logs
```

### Backup Data

```bash
# Backup data directory
tar -czf mission-control-backup-$(date +%Y%m%d).tar.gz \
  /home/sky/.openclaw/workspace/mission-control/backend/data/

# Restore backup
tar -xzf mission-control-backup-20260205.tar.gz -C /
```

## 📝 Configuration

### Environment Variables

Edit `/home/sky/.openclaw/workspace/mission-control/backend/.env`:

```bash
# Stop service
sudo systemctl stop mission-control-api

# Edit configuration
nano /home/sky/.openclaw/workspace/mission-control/backend/.env

# Restart service
sudo systemctl start mission-control-api
```

Key settings:

- `JWT_SECRET` - Authentication secret (regenerate for production)
- `TLS_ENABLED` - Enable/disable HTTPS
- `CORS_ORIGIN` - Allowed origins for CORS
- `GATEWAY_URL` - OpenClaw Gateway URL
- `PORT` - Server port (default: 8080)

### Update Frontend Configuration

If you need to change API URL:

```bash
cd /home/sky/.openclaw/workspace/mission-control/frontend

# Edit config
nano src/config/index.ts

# Rebuild
npm run build

# Redeploy
cd ../infra
./deploy-staging.sh
```

## 🐛 Troubleshooting

### Service Won't Start

```bash
# Check service logs
sudo journalctl -u mission-control-api -n 50

# Check if port is in use
sudo lsof -i :8080

# Check file permissions
ls -la /home/sky/.openclaw/workspace/mission-control/backend/dist/
```

### Gateway Connection Issues

```bash
# Check Gateway is running
openclaw gateway status

# Check Gateway endpoint
curl http://localhost:18789/health

# Test from backend directory
cd /home/sky/.openclaw/workspace/mission-control/backend
node -e "const axios = require('axios'); axios.get('http://localhost:18789/agents').then(r => console.log('OK')).catch(e => console.error('ERROR:', e.message));"
```

### TLS Certificate Issues

```bash
# Regenerate certificates
cd /home/sky/.openclaw/workspace/mission-control/backend
rm -rf certs/
npm run generate-certs

# Update service
sudo systemctl restart mission-control-api
```

### Frontend Not Loading

```bash
# Check if frontend is built
ls -la /home/sky/.openclaw/workspace/mission-control/backend/public/

# Rebuild frontend
cd /home/sky/.openclaw/workspace/mission-control/frontend
npm run build

# Copy to backend
rm -rf ../backend/public
cp -r dist ../backend/public

# Restart service
sudo systemctl restart mission-control-api
```

## 🔐 Production Checklist

Before going to production:

- [ ] **Replace JWT_SECRET** with cryptographically random secret
- [ ] **Use real TLS certificates** (Let's Encrypt recommended)
- [ ] **Set specific CORS_ORIGIN** (not `*`)
- [ ] **Change default admin password**
- [ ] **Set up database backup** (automated)
- [ ] **Configure monitoring** (health checks)
- [ ] **Set up log rotation**
- [ ] **Review audit logging** settings
- [ ] **Document API keys** and rotate regularly
- [ ] **Test disaster recovery** procedure

## 🎯 Next Steps

1. **Access the application**: https://localhost:8080
2. **Login with default credentials**
3. **Create additional users** (Admin → Users)
4. **Test agent controls**
5. **Configure alerts** and monitoring
6. **Share with team** for dogfooding

## 🆘 Support

**Logs Location:**
- Service logs: `sudo journalctl -u mission-control-api -f`
- App logs: `/home/sky/.openclaw/workspace/mission-control/backend/staging.log`
- Error logs: `/home/sky/.openclaw/workspace/mission-control/backend/staging-error.log`

**Common Issues:**
- Gateway disconnected → Start OpenClaw Gateway
- 401 Unauthorized → Check JWT token / login again
- 404 Not Found → Check API endpoint paths
- CORS errors → Update CORS_ORIGIN in .env

**Quick Commands:**
```bash
# Full status check
echo "=== Service Status ===" && sudo systemctl status mission-control-api --no-pager && \
echo -e "\n=== Health Check ===" && curl -k -s https://localhost:8080/health | jq && \
echo -e "\n=== Gateway ===" && openclaw gateway status

# Full restart
sudo systemctl restart mission-control-api && sleep 3 && curl -k https://localhost:8080/health | jq
```

---

**Deployment Time:** ~3-5 minutes  
**Stack:** Node.js (Backend) + React (Frontend) + Systemd  
**Status:** ✅ Production-Ready for Staging
