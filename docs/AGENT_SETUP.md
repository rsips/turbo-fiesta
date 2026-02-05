# Agent Setup Guide

This guide explains how to configure OpenClaw agents to authenticate with Mission Control.

## Prerequisites

- Mission Control backend running and accessible
- Admin access to Mission Control (to create API keys)
- Agent deployed and ready to configure

## Step 1: Create Agent API Key

### Via Mission Control API

```bash
# 1. Login to Mission Control
TOKEN=$(curl -X POST https://mission-control.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}' \
  | jq -r '.data.token')

# 2. Create API key for your agent
curl -X POST https://mission-control.example.com/api/agent-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "openclaw-agent-production-1",
    "expiresInDays": 365,
    "metadata": {
      "environment": "production",
      "nodeId": "prod-node-1",
      "location": "datacenter-east"
    }
  }' | jq
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "a3f2b1c4d5e6",
    "name": "openclaw-agent-production-1",
    "apiKey": "mc_1234567890abcdef1234567890abcdef",
    "createdAt": "2026-02-05T22:00:00.000Z",
    "expiresAt": "2027-02-05T22:00:00.000Z",
    "message": "⚠️ Save this API key now! It will not be shown again."
  }
}
```

**⚠️ IMPORTANT:** Copy the `apiKey` value immediately! You cannot retrieve it later.

## Step 2: Configure Agent

### Environment Variable (Recommended)

Set the API key as an environment variable:

```bash
export MISSION_CONTROL_API_KEY="mc_1234567890abcdef1234567890abcdef"
export MISSION_CONTROL_URL="https://mission-control.example.com"
```

**Make it persistent:**

```bash
# Add to ~/.bashrc or ~/.zshrc
echo 'export MISSION_CONTROL_API_KEY="mc_your_key_here"' >> ~/.bashrc
echo 'export MISSION_CONTROL_URL="https://mission-control.example.com"' >> ~/.bashrc
```

### Configuration File

Create `~/.openclaw/mission-control.conf`:

```bash
MISSION_CONTROL_URL=https://mission-control.example.com
MISSION_CONTROL_API_KEY=mc_1234567890abcdef1234567890abcdef
```

**Set permissions (important!):**

```bash
chmod 600 ~/.openclaw/mission-control.conf
```

### Systemd Service (Production)

If running agent as systemd service:

```ini
# /etc/systemd/system/openclaw-agent.service
[Unit]
Description=OpenClaw Agent
After=network.target

[Service]
Type=simple
User=openclaw
Environment="MISSION_CONTROL_URL=https://mission-control.example.com"
Environment="MISSION_CONTROL_API_KEY=mc_your_key_here"
ExecStart=/usr/local/bin/openclaw gateway start
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable openclaw-agent
sudo systemctl start openclaw-agent
```

## Step 3: Test Authentication

### Manual Test

```bash
# Test with curl
curl https://mission-control.example.com/api/agents \
  -H "X-Agent-Key: mc_1234567890abcdef1234567890abcdef"
```

**Expected response:**

```json
{
  "success": true,
  "data": {
    "agents": [...]
  }
}
```

**If authentication fails:**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_AGENT_KEY",
    "message": "Invalid or expired agent API key"
  }
}
```

### Agent Code Integration

#### Node.js/TypeScript

```typescript
import axios from 'axios';

const missionControlClient = axios.create({
  baseURL: process.env.MISSION_CONTROL_URL || 'https://mission-control.example.com',
  headers: {
    'X-Agent-Key': process.env.MISSION_CONTROL_API_KEY,
  },
  timeout: 10000,
});

// Test connection
async function testConnection() {
  try {
    const response = await missionControlClient.get('/api/health');
    console.log('✅ Connected to Mission Control:', response.data);
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.error('❌ Authentication failed: Invalid API key');
    } else {
      console.error('❌ Connection failed:', error.message);
    }
  }
}

// Report agent status
async function reportStatus(status: any) {
  try {
    await missionControlClient.post('/api/agent/status', status);
  } catch (error) {
    console.error('Failed to report status:', error);
  }
}
```

#### Python

```python
import os
import requests

class MissionControlClient:
    def __init__(self):
        self.base_url = os.getenv('MISSION_CONTROL_URL', 'https://mission-control.example.com')
        self.api_key = os.getenv('MISSION_CONTROL_API_KEY')
        self.headers = {
            'X-Agent-Key': self.api_key
        }
    
    def test_connection(self):
        try:
            response = requests.get(
                f'{self.base_url}/api/health',
                headers=self.headers,
                timeout=10
            )
            response.raise_for_status()
            print('✅ Connected to Mission Control:', response.json())
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 401:
                print('❌ Authentication failed: Invalid API key')
            else:
                print(f'❌ HTTP error: {e}')
        except Exception as e:
            print(f'❌ Connection failed: {e}')
    
    def report_status(self, status):
        try:
            response = requests.post(
                f'{self.base_url}/api/agent/status',
                json=status,
                headers=self.headers,
                timeout=10
            )
            response.raise_for_status()
        except Exception as e:
            print(f'Failed to report status: {e}')

# Usage
client = MissionControlClient()
client.test_connection()
```

#### Bash Script

```bash
#!/bin/bash
# report-to-mission-control.sh

MISSION_CONTROL_URL="${MISSION_CONTROL_URL:-https://mission-control.example.com}"
API_KEY="${MISSION_CONTROL_API_KEY}"

if [ -z "$API_KEY" ]; then
  echo "Error: MISSION_CONTROL_API_KEY not set"
  exit 1
fi

# Test connection
curl -f -s "$MISSION_CONTROL_URL/api/health" \
  -H "X-Agent-Key: $API_KEY" \
  || { echo "Failed to connect to Mission Control"; exit 1; }

echo "✅ Connected to Mission Control"

# Report status
STATUS=$(cat <<EOF
{
  "status": "online",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "metrics": {
    "cpu": $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1),
    "memory": $(free | grep Mem | awk '{print ($3/$2) * 100.0}')
  }
}
EOF
)

curl -X POST "$MISSION_CONTROL_URL/api/agent/status" \
  -H "X-Agent-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$STATUS"
```

## Step 4: Verify in Mission Control

1. **Login to Mission Control web UI**
2. **Navigate to Settings → Agent Keys**
3. **Find your agent key**
4. **Check "Last Used" timestamp** - should update when agent connects

## Troubleshooting

### Issue: "Invalid or expired agent API key"

**Causes:**
- Wrong API key
- Key has been revoked
- Key has expired
- Typo in environment variable

**Solutions:**

```bash
# 1. Verify your API key is set correctly
echo $MISSION_CONTROL_API_KEY

# 2. Test with curl
curl -v https://mission-control.example.com/api/health \
  -H "X-Agent-Key: $MISSION_CONTROL_API_KEY"

# 3. Check if key exists and is active (admin only)
curl https://mission-control.example.com/api/agent-keys \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Issue: "AGENT_AUTH_REQUIRED"

**Cause:** No API key provided

**Solution:** Ensure `X-Agent-Key` header is included in all requests

```typescript
// Wrong ❌
axios.get('https://mission-control.example.com/api/agents')

// Correct ✅
axios.get('https://mission-control.example.com/api/agents', {
  headers: { 'X-Agent-Key': process.env.MISSION_CONTROL_API_KEY }
})
```

### Issue: Connection timeouts

**Causes:**
- Firewall blocking connection
- Mission Control server down
- DNS resolution failure
- TLS certificate issues (self-signed)

**Solutions:**

```bash
# 1. Check connectivity
ping mission-control.example.com

# 2. Check if port is open
nc -zv mission-control.example.com 443

# 3. Test TLS connection
openssl s_client -connect mission-control.example.com:443

# 4. Check DNS
nslookup mission-control.example.com

# 5. For self-signed certs in dev, disable SSL verification (dev only!)
export NODE_TLS_REJECT_UNAUTHORIZED=0  # Node.js
# OR
curl -k https://...  # curl
```

### Issue: "Network Error" or "SSL Error"

**For self-signed certificates in development:**

```typescript
// Node.js - disable SSL verification (DEV ONLY!)
import https from 'https';

const agent = new https.Agent({
  rejectUnauthorized: false
});

const client = axios.create({
  baseURL: 'https://localhost:8080',
  httpsAgent: agent,
  headers: { 'X-Agent-Key': process.env.MISSION_CONTROL_API_KEY }
});
```

**⚠️ WARNING:** Never disable SSL verification in production!

## Security Best Practices

### DO ✅

- **Store API keys in environment variables**, not in code
- **Use HTTPS** for all connections
- **Rotate keys** every 6-12 months
- **Monitor key usage** in Mission Control
- **Set appropriate expiration** (1 year recommended)
- **Restrict file permissions** on config files (`chmod 600`)
- **Use separate keys** per agent/environment

### DON'T ❌

- **Never commit API keys** to git
- **Never share keys** between agents
- **Never disable SSL verification** in production
- **Never log API keys** to console/files
- **Never send keys** in URLs (use headers)
- **Never store keys** in plaintext on shared systems

## Key Rotation

**When to rotate:**
- Every 6-12 months (scheduled)
- When key may have been compromised
- When agent is decommissioned
- When team members leave

**How to rotate:**

```bash
# 1. Create new key
NEW_KEY=$(curl -X POST https://mission-control.example.com/api/agent-keys \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"agent-prod-1-rotated","expiresInDays":365}' \
  | jq -r '.data.apiKey')

# 2. Update agent configuration
export MISSION_CONTROL_API_KEY="$NEW_KEY"

# 3. Restart agent
sudo systemctl restart openclaw-agent

# 4. Test new key
curl https://mission-control.example.com/api/health \
  -H "X-Agent-Key: $NEW_KEY"

# 5. After confirming it works, revoke old key
curl -X POST https://mission-control.example.com/api/agent-keys/{old-key-id}/revoke \
  -H "Authorization: Bearer $TOKEN"
```

## Advanced Configuration

### Multiple Agents

Each agent should have its own API key:

```bash
# Agent 1
export MISSION_CONTROL_API_KEY="mc_agent1_key"

# Agent 2
export MISSION_CONTROL_API_KEY="mc_agent2_key"

# Agent 3
export MISSION_CONTROL_API_KEY="mc_agent3_key"
```

### Load Balancing

If using multiple Mission Control instances:

```typescript
const servers = [
  'https://mc1.example.com',
  'https://mc2.example.com',
  'https://mc3.example.com',
];

let currentServer = 0;

function getNextServer() {
  const server = servers[currentServer];
  currentServer = (currentServer + 1) % servers.length;
  return server;
}

const client = axios.create({
  baseURL: getNextServer(),
  headers: { 'X-Agent-Key': process.env.MISSION_CONTROL_API_KEY }
});
```

### Retry Logic

```typescript
import axios, { AxiosError } from 'axios';

async function reportStatusWithRetry(status: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await missionControlClient.post('/api/agent/status', status);
      return; // Success
    } catch (error) {
      if (i === maxRetries - 1) throw error; // Last retry failed
      
      const delay = Math.pow(2, i) * 1000; // Exponential backoff
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Support

- **Documentation:** [SECURITY.md](./SECURITY.md)
- **Issues:** Contact Mission Control administrator
- **Emergency:** Revoke compromised key immediately via admin panel

---

**Next Steps:**
- [Read Security Guide](./SECURITY.md)
- [Configure TLS/HTTPS](./SECURITY.md#tlshttps-setup)
- [Set up monitoring](./MONITORING.md) (if available)
