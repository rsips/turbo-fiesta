# Mission Control Backend API

Express.js API that adapts OpenClaw Gateway data for the Mission Control frontend.

## Features

### Read Operations
- **GET /api/agents** - List all agents with status, current task, and metadata
- **GET /api/agents/:id** - Get detailed information for a specific agent
- **GET /health** - Health check endpoint with Gateway connectivity status

### Control Operations (New in Phase 2! 🚀)
- **POST /api/agents/:id/stop** - Check agent heartbeat status (with CLI guidance)
- **POST /api/agents/:id/restart** - Check agent heartbeat status for restart
- **POST /api/agents/:id/message** - Send a message to a specific agent session
- **GET /api/agents/:id/settings** - Get agent configuration settings

### Infrastructure
- **Schema transformation** - Converts Gateway format to Mission Control format
- **In-memory caching** - 5-second TTL to reduce Gateway load
- **Mock data support** - Develop without Gateway dependency

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Default configuration uses mock data** - set `USE_MOCK_DATA=false` to connect to real Gateway.

### 3. Development Mode

```bash
npm run dev
```

Server starts at http://localhost:8080 with hot reload.

### 4. Test Endpoints

**Health check:**
```bash
curl http://localhost:8080/health
```

**List all agents:**
```bash
curl http://localhost:8080/api/agents
```

**Get specific agent:**
```bash
curl http://localhost:8080/api/agents/agent:main:msteams:...
```

## Project Structure

```
src/
├── server.ts              # Express app entry point
├── types/
│   ├── agent.ts          # Mission Control types (frontend-facing)
│   └── gateway.ts        # OpenClaw Gateway types (backend-facing)
├── routes/
│   └── agents.ts         # Agent API endpoints
├── services/
│   ├── gateway.ts        # Gateway HTTP client
│   ├── transformer.ts    # Schema transformation logic
│   └── mockData.ts       # Mock Gateway responses for development
├── utils/
│   ├── cache.ts          # Simple in-memory cache (5s TTL)
│   └── logger.ts         # Logging utility
└── config/
    └── index.ts          # Configuration management
```

## API Documentation

### Read Endpoints

#### GET /api/agents

Returns list of all agents.

**Response:**
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "agent:main:msteams:...",
        "name": "Main Agent",
        "session_id": "agent:main:msteams:...",
        "status": "busy",
        "current_task": "Processing user request about calendar",
        "task_started_at": "2026-02-05T20:01:25Z",
        "last_activity": "2026-02-05T20:01:30Z",
        "started_at": "2026-02-05T16:30:00Z",
        "uptime_seconds": 12690,
        "metadata": {
          "channel": "msteams",
          "model": "claude-sonnet-4-5",
          "host": "openclaw-head"
        }
      }
    ],
    "count": 1,
    "timestamp": "2026-02-05T20:03:00Z"
  }
}
```

**Status Values:**
- `online` - Agent is running and idle
- `busy` - Agent is actively processing a task
- `offline` - Agent disconnected or stopped
- `error` - Agent in error state

#### GET /api/agents/:id

Returns detailed information for a specific agent.

**Parameters:**
- `id` - Agent session ID

**Response:** Same as single agent object above, wrapped in success envelope.

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "AGENT_NOT_FOUND",
    "message": "Agent not found or no longer active",
    "details": "No agent found with ID: ..."
  }
}
```

#### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-05T20:03:00Z",
  "gateway": "connected",
  "config": {
    "gatewayUrl": "http://localhost:18789",
    "useMockData": false
  }
}
```

### Control Endpoints (Phase 2)

#### POST /api/agents/:id/stop

Check agent heartbeat status and get guidance on how to disable it via CLI.

**Note:** OpenClaw doesn't expose a direct API to disable agent heartbeats. This endpoint provides visibility and CLI instructions.

**Parameters:**
- `id` - Agent session ID or session key

**Response:**
```json
{
  "success": true,
  "data": {
    "agentId": "main",
    "action": "stop-check",
    "heartbeatEnabled": true,
    "heartbeatInterval": "30m",
    "message": "Agent heartbeat is currently enabled. Use CLI to disable: openclaw system heartbeat disable",
    "timestamp": "2026-02-05T20:30:00Z"
  }
}
```

**Use Cases:**
- Check if an agent's heartbeat is enabled
- Get CLI instructions to disable heartbeat
- Monitor heartbeat status before maintenance

#### POST /api/agents/:id/restart

Check agent heartbeat status and get guidance on how to enable it via CLI.

**Note:** OpenClaw doesn't expose a direct API to enable agent heartbeats. This endpoint provides visibility and CLI instructions.

**Parameters:**
- `id` - Agent session ID or session key

**Response:**
```json
{
  "success": true,
  "data": {
    "agentId": "backend-dev",
    "action": "restart-check",
    "heartbeatEnabled": false,
    "heartbeatInterval": "disabled",
    "message": "Agent heartbeat is disabled. Use CLI to enable: openclaw system heartbeat enable",
    "timestamp": "2026-02-05T20:30:00Z"
  }
}
```

**Use Cases:**
- Check if an agent's heartbeat is disabled
- Get CLI instructions to enable heartbeat
- Verify heartbeat status after changes

#### POST /api/agents/:id/message

Send a message to a specific agent session.

**Parameters:**
- `id` - Agent session ID or session key

**Request Body:**
```json
{
  "message": "Check inbox and summarize important emails"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "8e8aaf0c-d455-42af-ba7c-6a668f5bd8ee",
    "agentId": "main",
    "action": "message",
    "result": "Message sent to agent session",
    "timestamp": "2026-02-05T20:30:00Z"
  }
}
```

**Use Cases:**
- Send commands to specific agent instances
- Trigger agent actions from external systems
- Inject tasks into running sessions

#### GET /api/agents/:id/settings

Get agent configuration settings including model, context tokens, heartbeat settings, and token usage.

**Parameters:**
- `id` - Agent session ID or session key

**Response:**
```json
{
  "success": true,
  "data": {
    "agentId": "main",
    "action": "settings",
    "settings": {
      "agentId": "main",
      "model": "claude-opus-4-5-20251101",
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
    "timestamp": "2026-02-05T20:30:00Z"
  }
}
```

**Settings Provided:**
- `model` - Current AI model in use
- `contextTokens` - Maximum context window size
- `heartbeat` - Heartbeat configuration (enabled, interval)
- `session` - Token usage statistics

**Use Cases:**
- Monitor agent resource usage
- Check current model and capabilities
- View heartbeat configuration
- Track context window utilization

### Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional context or technical details"
  }
}
```

**Common Error Codes:**
- `AGENT_NOT_FOUND` (404) - Agent/session doesn't exist
- `SESSION_NOT_FOUND` (404) - Session ID not found
- `INVALID_AGENT_ID` (400) - Invalid ID format
- `INVALID_MESSAGE` (400) - Empty or invalid message
- `INVALID_SETTINGS` (400) - Empty or invalid settings object
- `STOP_FAILED` (500) - Failed to stop agent
- `RESTART_FAILED` (500) - Failed to restart agent
- `MESSAGE_FAILED` (500) - Failed to send message
- `SETTINGS_UPDATE_FAILED` (500) - Failed to update settings

## Configuration

Environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8080 | Server port |
| `GATEWAY_URL` | http://localhost:18789 | OpenClaw Gateway URL |
| `GATEWAY_TIMEOUT` | 2000 | Gateway request timeout (ms) |
| `CORS_ENABLED` | true | Enable CORS |
| `CORS_ORIGIN` | * | CORS allowed origin |
| `USE_MOCK_DATA` | true | Use mock data instead of Gateway |
| `LOG_LEVEL` | info | Logging level (debug, info, warn, error) |
| `NODE_ENV` | development | Environment |

## Schema Transformation

The backend transforms OpenClaw Gateway's session format to Mission Control's agent format:

**Gateway → Mission Control Mapping:**

| Mission Control Field | Derived From | Logic |
|----------------------|--------------|-------|
| `id` | `session` | Direct mapping |
| `name` | `label` or `session` | Format label or parse session ID |
| `status` | `current_message`, `last_activity` | Compute based on activity timestamps |
| `current_task` | `current_message.content` | Truncate to 60 chars |
| `last_activity` | `last_activity` | Convert Unix timestamp to ISO 8601 |
| `started_at` | `created_at` | Convert Unix timestamp to ISO 8601 |
| `uptime_seconds` | `created_at` | Calculate from start time |

**Status Computation Logic:**

```typescript
// Priority order:
1. Error state → 'error'
2. Current message + fresh (<10s) → 'busy'
3. Last activity recent (<30s) → 'online'
4. Otherwise → 'offline'
```

## Development Workflow

### Phase 1: Mock Development

1. Start with `USE_MOCK_DATA=true` (default)
2. Develop and test endpoints with mock data
3. Mock data includes various agent states (online, busy, offline, error)

### Phase 2: Gateway Integration

1. Verify Gateway is running: `openclaw gateway status`
2. Check Gateway port (default: 18789)
3. Update `GATEWAY_URL` in `.env`
4. Set `USE_MOCK_DATA=false`
5. Test with real Gateway data

### Investigating Gateway

```bash
# Check Gateway status
openclaw gateway status

# Check Gateway port
netstat -tuln | grep 18789

# Test Gateway endpoint directly
curl http://localhost:18789/sessions

# Or check Gateway CLI
openclaw gateway sessions
```

**Note:** Gateway schema may differ from assumptions. Update `src/types/gateway.ts` and `src/services/transformer.ts` if needed.

## Building for Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

Built files are in `dist/`.

## Caching Strategy

- **In-memory cache** with 5-second TTL
- Matches frontend polling interval (5s)
- Reduces Gateway load: 10 users = 0.2 req/s (vs 2 req/s without cache)
- Auto-cleanup every 60 seconds

## Error Handling

| Error Code | HTTP Status | Cause |
|-----------|-------------|-------|
| `GATEWAY_UNAVAILABLE` | 500 | Cannot connect to Gateway |
| `GATEWAY_TIMEOUT` | 500 | Gateway slow to respond |
| `GATEWAY_ERROR` | 500 | Gateway returned error |
| `AGENT_NOT_FOUND` | 404 | Agent ID not found |
| `NOT_FOUND` | 404 | Endpoint doesn't exist |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Testing

### Manual Testing Checklist

- [ ] `/health` returns ok status
- [ ] `/api/agents` returns agent list
- [ ] `/api/agents/:id` returns single agent
- [ ] `/api/agents/invalid-id` returns 404
- [ ] Cache works (2nd request faster)
- [ ] All agent statuses represented (online, busy, offline, error)
- [ ] Timestamps in ISO 8601 format
- [ ] Uptime calculations correct
- [ ] Error handling graceful (Gateway down)

### Test with Mock Data

```bash
# Start server with mock data
USE_MOCK_DATA=true npm run dev

# Test endpoints
curl http://localhost:8080/health
curl http://localhost:8080/api/agents | jq
curl http://localhost:8080/api/agents/agent:main:msteams:group:19:0cc3b64020df41f9acf7ffac5cee62a9@thread.v2 | jq
```

### Test with Real Gateway

```bash
# Ensure Gateway is running
openclaw gateway start

# Start server with real Gateway
USE_MOCK_DATA=false npm run dev

# Test
curl http://localhost:8080/health
curl http://localhost:8080/api/agents | jq
```

## Troubleshooting

### "GATEWAY_UNAVAILABLE" Error

**Cause:** Cannot connect to Gateway

**Solutions:**
1. Check Gateway is running: `openclaw gateway status`
2. Verify Gateway port: `netstat -tuln | grep 18789`
3. Check `GATEWAY_URL` in `.env`
4. Use mock data for development: `USE_MOCK_DATA=true`

### "GATEWAY_TIMEOUT" Error

**Cause:** Gateway slow to respond (>2s)

**Solutions:**
1. Increase timeout: `GATEWAY_TIMEOUT=5000`
2. Check Gateway performance
3. Use mock data during development

### Empty Agent List

**Cause:** No agents running

**Solutions:**
1. Start an agent: Check OpenClaw documentation
2. Use mock data: `USE_MOCK_DATA=true`
3. Check Gateway has sessions: `curl http://localhost:18789/sessions`

## Next Steps (Phase 2)

Future enhancements:
- WebSocket support for real-time updates
- Server-side filtering and sorting
- Pagination for 100+ agents
- Agent control actions (stop, restart)
- Persistent storage (database)
- Authentication and authorization

## Contributing

This is Phase 1 - focus on simplicity and speed.

**Development priorities:**
1. Get mock endpoints working ✅
2. Integrate with Gateway
3. Test schema transformation
4. Optimize error handling

## License

ISC

---

**Questions?** Contact the Backend Developer agent or Orchestrator.
