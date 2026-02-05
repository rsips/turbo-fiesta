# Quick Start: Phase 2 Agent Control API

## Test the New Endpoints

```bash
# Start server
npm start

# In another terminal:

# 1. Check agent heartbeat status (stop)
curl -X POST http://localhost:8080/api/agents/main/stop | jq

# 2. Check agent heartbeat status (restart)
curl -X POST http://localhost:8080/api/agents/main/restart | jq

# 3. Get agent settings
curl http://localhost:8080/api/agents/main/settings | jq

# 4. Send a message to an agent (requires session ID)
curl -X POST http://localhost:8080/api/agents/SESSION_ID/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello from API"}' | jq
```

## Get Session ID

```bash
# List all agents and get their session IDs
curl http://localhost:8080/api/agents | jq '.data.agents[] | {name, session_id}'
```

## Run All Tests

```bash
# Automated test script (skips message sending)
echo "n" | ./test-control-endpoints.sh
```

## Example Responses

### Stop Status Check
```json
{
  "success": true,
  "data": {
    "agentId": "main",
    "action": "stop-check",
    "heartbeatEnabled": true,
    "heartbeatInterval": "30m",
    "message": "Agent heartbeat is currently enabled. Use CLI to disable: openclaw system heartbeat disable",
    "timestamp": "2026-02-05T21:00:00.000Z"
  }
}
```

### Agent Settings
```json
{
  "success": true,
  "data": {
    "agentId": "main",
    "action": "settings",
    "settings": {
      "agentId": "main",
      "model": "claude-opus-4-5",
      "contextTokens": 200000,
      "heartbeat": {
        "enabled": true,
        "interval": "30m",
        "intervalMs": 1800000
      },
      "session": {
        "totalTokens": 147589,
        "remainingTokens": 52411,
        "percentUsed": 74
      }
    },
    "timestamp": "2026-02-05T21:00:00.000Z"
  }
}
```

### Message Sent
```json
{
  "success": true,
  "data": {
    "sessionId": "8e8aaf0c-d455-42af-ba7c-6a668f5bd8ee",
    "agentId": "main",
    "action": "message",
    "result": "Message sent to agent session",
    "timestamp": "2026-02-05T21:00:00.000Z"
  }
}
```

## Frontend Integration Snippets

### React Hook for Agent Control

```javascript
import { useState } from 'react';

export function useAgentControl(baseUrl = 'http://localhost:8080') {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkStop = async (agentId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${baseUrl}/api/agents/${agentId}/stop`, {
        method: 'POST'
      });
      const data = await res.json();
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  const sendMessage = async (sessionId, message) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${baseUrl}/api/agents/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  const getSettings = async (agentId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${baseUrl}/api/agents/${agentId}/settings`);
      const data = await res.json();
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  return { checkStop, sendMessage, getSettings, loading, error };
}
```

### Vue Composable

```javascript
import { ref } from 'vue';

export function useAgentControl(baseUrl = 'http://localhost:8080') {
  const loading = ref(false);
  const error = ref(null);

  const checkStop = async (agentId) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${baseUrl}/api/agents/${agentId}/stop`, {
        method: 'POST'
      });
      const data = await res.json();
      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const sendMessage = async (sessionId, message) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${baseUrl}/api/agents/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getSettings = async (agentId) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${baseUrl}/api/agents/${agentId}/settings`);
      const data = await res.json();
      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return { checkStop, sendMessage, getSettings, loading, error };
}
```

## Common Issues

### "Agent not found"
Make sure you're using the correct agent ID. List agents first:
```bash
curl http://localhost:8080/api/agents | jq '.data.agents[] | .id'
```

### "Session not found" (for messages)
Use the session_id field, not the id field:
```bash
curl http://localhost:8080/api/agents | jq '.data.agents[] | {id, session_id}'
```

### "Gateway disconnected"
Check Gateway is running:
```bash
openclaw gateway status
```

If not running:
```bash
openclaw gateway start
```

### Message sending takes a long time
This is normal! The agent needs to process the message, which can take 10-60 seconds depending on complexity.

## More Info

- **Full API Docs**: See README.md
- **Architecture**: See PHASE2-SUMMARY.md
- **GitHub**: https://github.com/rsips/turbo-fiesta
