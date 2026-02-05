# Mission Control - Staging Quick Start

## 🚀 Access the Application

**URL:** http://localhost:8080

## 🔐 Default Login

Check existing users:
```bash
cat /home/sky/.openclaw/workspace/mission-control/backend/data/users.json | jq '.[] | {username, role}'
```

Or create a new admin:
```bash
cd /home/sky/.openclaw/workspace/mission-control/backend
npm run create-admin
```

## 🎛️ Server Management

```bash
cd /home/sky/.openclaw/workspace/mission-control/infra

# Start server
./start-staging.sh

# Stop server  
./stop-staging.sh

# Restart server
./restart-staging.sh

# View logs
tail -f ../backend/staging.log

# View errors
tail -f ../backend/staging-error.log
```

## 🏥 Health Check

```bash
curl -s http://localhost:8080/health | jq
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-05T22:24:43.101Z",
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

## 🔄 Redeploy (After Changes)

```bash
cd /home/sky/.openclaw/workspace/mission-control/infra
./deploy-simple.sh
```

This will:
- Build backend and frontend
- Copy frontend to backend
- Restart the server

## 🛠️ Testing API

```bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your-username","password":"your-password"}' | jq -r .data.token)

# Test agents endpoint
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/agents | jq

# Get specific agent
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/agents/main | jq
```

## 🐛 Troubleshooting

### Server won't start

```bash
# Check if port is in use
ss -tuln | grep 8080

# Check error logs
tail -30 ../backend/staging-error.log

# Kill stale process
pkill -f "node.*server.js"
rm ../backend/staging.pid
```

### Gateway disconnected

```bash
# Check OpenClaw Gateway
openclaw gateway status

# Start if needed
openclaw gateway start
```

### Frontend not loading

```bash
# Check if frontend is deployed
ls -la ../backend/public/

# Rebuild frontend
cd ../frontend
npm run build

# Redeploy
cd ../infra
./deploy-simple.sh
```

## 📊 Status Check Script

Quick all-in-one status check:

```bash
#!/bin/bash
echo "=== Mission Control Status ==="
echo ""
echo "Server PID:"
cat ../backend/staging.pid 2>/dev/null || echo "Not running"
echo ""
echo "Health Check:"
curl -s http://localhost:8080/health | jq .status,.gateway,.websocket.status
echo ""
echo "OpenClaw Gateway:"
openclaw gateway status | head -3
```

Save as `status.sh` and run: `chmod +x status.sh && ./status.sh`

## 🎯 Next Steps

1. **Login** → http://localhost:8080
2. **View agents** → Dashboard shows all active agents
3. **Test controls** → Start/stop agents, send messages
4. **Check audit logs** → See all agent activities
5. **Create users** → Admin panel for team access

## 📝 Notes

- Currently running on **HTTP** (port 8080)
- Self-signed TLS available (set `TLS_ENABLED=true` in backend/.env and restart)
- Data stored in JSON files (`backend/data/`)
- Logs in `backend/staging.log` and `backend/staging-error.log`
- Process runs in background via nohup

## 🆘 Support

**Check logs:**
```bash
tail -f /home/sky/.openclaw/workspace/mission-control/backend/staging.log
```

**Full restart:**
```bash
cd /home/sky/.openclaw/workspace/mission-control/infra
./stop-staging.sh && sleep 2 && ./start-staging.sh
```

**Health check:**
```bash
curl -s http://localhost:8080/health | jq
```
