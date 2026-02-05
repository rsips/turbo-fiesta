# WebSocket API Documentation

## Overview

Mission Control provides real-time updates via WebSocket connection. The WebSocket server runs on the same port as the REST API and requires JWT authentication.

## Connection

### Endpoint
```
ws://localhost:3000
wss://your-domain.com (production with TLS)
```

### Authentication

WebSocket connections require a valid JWT token. You can provide it in two ways:

**1. Authorization Header (Recommended)**
```javascript
const ws = new WebSocket('ws://localhost:3000', {
  headers: {
    Authorization: 'Bearer <your-jwt-token>'
  }
});
```

**2. Query Parameter (Browser Fallback)**
```javascript
const ws = new WebSocket('ws://localhost:3000?token=<your-jwt-token>');
```

### Connection Rejection

Connections will be rejected (closed with code 1006) if:
- No token is provided
- Token is invalid or malformed
- Token has expired

## Message Types

All messages are JSON with the following structure:
```typescript
{
  type: string,
  payload: object
}
```

### Server → Client Events

#### `agent:status`
Sent when an agent's status changes.

```json
{
  "type": "agent:status",
  "payload": {
    "agentId": "agent-abc-123",
    "status": "online",
    "timestamp": 1707163200000
  }
}
```

**Status values:**
- `online` - Agent is running and healthy
- `offline` - Agent has stopped
- `error` - Agent encountered an error

#### `session:activity`
Sent when there's new activity in an agent session.

```json
{
  "type": "session:activity",
  "payload": {
    "agentId": "agent-abc-123",
    "sessionId": "session-xyz-789",
    "lastMessage": "Processing user request...",
    "timestamp": 1707163200000
  }
}
```

#### `heartbeat`
Sent periodically to confirm connection health.

```json
{
  "type": "heartbeat",
  "payload": {
    "timestamp": 1707163200000
  }
}
```

## Client Implementation Example

### JavaScript/Browser
```javascript
const token = 'your-jwt-token';
const ws = new WebSocket(`ws://localhost:3000?token=${token}`);

ws.onopen = () => {
  console.log('Connected to Mission Control');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'agent:status':
      console.log(`Agent ${message.payload.agentId} is now ${message.payload.status}`);
      // Update UI to reflect new status
      break;
      
    case 'session:activity':
      console.log(`New activity in session ${message.payload.sessionId}`);
      // Show new message in UI
      break;
      
    case 'heartbeat':
      // Connection is healthy
      break;
  }
};

ws.onclose = (event) => {
  console.log('Disconnected:', event.code, event.reason);
  // Implement reconnection logic
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};
```

### React Hook Example
```typescript
import { useEffect, useState, useCallback } from 'react';

interface AgentStatus {
  agentId: string;
  status: 'online' | 'offline' | 'error';
  timestamp: number;
}

export function useWebSocket(token: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState<Map<string, AgentStatus>>(new Map());

  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(`ws://localhost:3000?token=${token}`);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'agent:status') {
        setAgentStatuses(prev => {
          const next = new Map(prev);
          next.set(message.payload.agentId, message.payload);
          return next;
        });
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Reconnect after 3 seconds
      setTimeout(() => {
        // Trigger reconnection
      }, 3000);
    };

    return () => {
      ws.close();
    };
  }, [token]);

  return { isConnected, agentStatuses };
}
```

## Health Check

The `/health` endpoint includes WebSocket status:

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-05T21:50:00.000Z",
  "gateway": "connected",
  "websocket": {
    "status": "running",
    "connections": 5,
    "connectedUsers": 3
  },
  "config": {
    "gatewayUrl": "http://localhost:8888",
    "useMockData": false
  }
}
```

## Connection Management

- **Heartbeat:** Server sends ping every 30 seconds to detect dead connections
- **Cleanup:** Connections are automatically cleaned up on disconnect
- **Multiple Connections:** Same user can have multiple connections (e.g., multiple browser tabs)
- **User Tracking:** Connections are tracked by user ID from JWT

## Error Handling

### Connection Errors
| Code | Meaning |
|------|---------|
| 1000 | Normal closure |
| 1001 | Server going away |
| 1006 | Abnormal closure (auth failed, network error) |

### Recommended Reconnection Strategy
```javascript
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const baseDelay = 1000; // 1 second

function connect() {
  const ws = new WebSocket(`ws://localhost:3000?token=${token}`);
  
  ws.onopen = () => {
    reconnectAttempts = 0; // Reset on successful connection
  };
  
  ws.onclose = () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      const delay = baseDelay * Math.pow(2, reconnectAttempts);
      reconnectAttempts++;
      setTimeout(connect, delay);
    }
  };
}
```

## Broadcasting from Backend

Other parts of the backend can trigger broadcasts:

```typescript
import { broadcastAgentStatus, broadcastSessionActivity } from './services/websocket';

// When an agent comes online
broadcastAgentStatus('agent-123', 'online');

// When there's new session activity
broadcastSessionActivity('agent-123', 'session-456', 'User said: Hello');
```

## Security Notes

1. **Always use WSS in production** - WebSocket over TLS
2. **Tokens expire** - Clients should handle reconnection with refreshed tokens
3. **No sensitive data in URLs** - Query param tokens appear in logs; prefer headers when possible
4. **Rate limiting** - Not yet implemented, planned for future release
