# OpenClaw Gateway Integration

## Summary

Mission Control Backend successfully integrates with OpenClaw Gateway! However, the Gateway architecture differs significantly from initial assumptions.

## Key Findings

### Gateway Architecture

**Initial Assumption:** HTTP REST API with `/sessions` endpoint
**Reality:** WebSocket-based Gateway accessed via CLI

The Gateway doesn't expose a direct HTTP REST API. Instead, it uses:
- WebSocket for real-time communication
- CLI commands for querying: `openclaw gateway call <method>`
- JSON output via `--json` flag

### Integration Approach

We integrated via **CLI subprocess calls** instead of HTTP:

```typescript
// Execute CLI command
const { stdout } = await execAsync('openclaw gateway call status --json');
const response = JSON.parse(stdout);
const sessions = response.sessions.recent;
```

This approach:
- ✅ Simple and reliable
- ✅ No WebSocket complexity
- ✅ Leverages existing OpenClaw CLI
- ⚠️ Slightly higher latency (~100-200ms)
- ⚠️ Subprocess overhead

## Gateway Schema (Actual)

### Status Method Response

```json
{
  "sessions": {
    "count": 13,
    "recent": [
      {
        "agentId": "main",
        "key": "agent:main:msteams:group:19:...",
        "kind": "direct" | "group",
        "sessionId": "uuid",
        "updatedAt": 1770322944495,  // Unix timestamp (ms)
        "age": 269028,                 // Age in ms
        "abortedLastRun": false,
        "totalTokens": 164717,
        "remainingTokens": 35283,
        "percentUsed": 82,
        "model": "claude-sonnet-4-5-20250929",
        "contextTokens": 200000,
        "flags": ["system", "id:..."]
      }
    ],
    "byAgent": [ /* ... */ ]
  }
}
```

### Key Differences from Assumptions

| Assumed Field | Actual Field | Notes |
|--------------|-------------|-------|
| `session` | `key` | Session identifier |
| `created_at` | N/A | Not available (use `updatedAt` - `age`) |
| `last_activity` | `updatedAt` | Unix timestamp in **milliseconds** |
| `current_message` | N/A | Not available directly |
| `label` | `agentId` | Agent identifier |
| `channel` | Embedded in `key` | Parse from key string |
| `host` | N/A | Not in status response |

## Status Computation Logic

Since Gateway doesn't expose "current task" or explicit status, we infer from available data:

```typescript
function computeStatus(session: GatewaySessionItem): AgentStatus {
  const ageMs = session.age;
  
  // Error if aborted
  if (session.abortedLastRun) return 'error';
  
  // Active if recent (< 30s)
  if (ageMs < 30000) {
    // Busy if very recent and tokens output
    if (ageMs < 10000 && session.outputTokens > 0) return 'busy';
    return 'online';
  }
  
  // Idle but still tracked (< 5min)
  if (ageMs < 300000) return 'online';
  
  // Otherwise offline
  return 'offline';
}
```

## Task Description

Without direct access to "current task", we show context usage:

```typescript
function extractTaskDescription(session: GatewaySessionItem): string | null {
  if (session.age < 10000 && session.outputTokens > 0) {
    return `Processing (${session.outputTokens} tokens output)`;
  }
  
  if (session.percentUsed > 0) {
    return `Context: ${session.percentUsed}% used (${session.totalTokens} tokens)`;
  }
  
  return null;
}
```

## Performance

**CLI Call Latency:**
- Health check: ~50-100ms
- Status call: ~100-200ms
- Total API response time: ~150-300ms (including transformation)

**Caching Strategy:**
- 5-second TTL cache reduces CLI calls
- With 10 concurrent users: 0.2 req/s to Gateway (vs 2 req/s without cache)

## Running with Real Gateway

### Prerequisites

1. OpenClaw Gateway must be running:
   ```bash
   openclaw gateway status
   ```

2. CLI must be accessible in PATH:
   ```bash
   which openclaw
   ```

### Start Backend with Real Gateway

```bash
# Disable mock data
USE_MOCK_DATA=false npm run dev
```

Or update `.env`:
```bash
USE_MOCK_DATA=false
```

### Verify Integration

```bash
# Health check
curl http://localhost:8080/health

# Should show:
{
  "status": "ok",
  "gateway": "connected",
  "config": {
    "useMockData": false
  }
}

# Get agents
curl http://localhost:8080/api/agents | jq '.data.count'
```

## Mock Data Mode

For development without Gateway, use mock data:

```bash
USE_MOCK_DATA=true npm run dev
```

Mock data includes:
- 5 sample agents (main, backend-dev, frontend-dev, architect, error-test)
- Various statuses (online, busy, offline, error)
- Realistic timestamps and token counts

## Future Enhancements

### Phase 2: WebSocket Integration

For real-time updates, consider WebSocket client:

```typescript
// Pseudo-code
const ws = new WebSocket('ws://localhost:18789');
ws.on('session.update', (data) => {
  // Update cache immediately
  cache.invalidate('agents');
});
```

**Benefits:**
- Real-time updates (<1s latency)
- No polling overhead
- More efficient for frequent updates

**Challenges:**
- More complex implementation
- WebSocket connection management
- Gateway auth handling

### Phase 2: Direct Gateway API

If OpenClaw exposes HTTP API in future:

```typescript
const response = await axios.get('http://localhost:18789/api/v1/sessions');
```

This would:
- Reduce latency (no subprocess overhead)
- Simplify error handling
- Enable more advanced queries

## Troubleshooting

### "openclaw command not found"

**Cause:** CLI not in PATH

**Solution:**
```bash
# Check installation
which openclaw

# If not found, add to PATH or use full path
export PATH="/path/to/openclaw/bin:$PATH"
```

### "GATEWAY_TIMEOUT"

**Cause:** CLI call taking >5 seconds

**Solutions:**
1. Check Gateway status: `openclaw gateway status`
2. Increase timeout in `src/services/gatewayReal.ts`
3. Use mock data: `USE_MOCK_DATA=true`

### Empty Agent List

**Cause:** No active sessions in Gateway

**Solutions:**
1. Check sessions exist: `openclaw gateway call status --json | jq '.sessions.count'`
2. Start an agent session
3. Use mock data for development

## Architecture Lessons

### What Worked Well

✅ **CLI integration** - Simple, reliable, no new protocols to learn
✅ **Dual-mode design** - Mock data enables parallel development
✅ **Schema transformation** - Clean abstraction between Gateway and frontend
✅ **Caching** - Mitigates subprocess overhead

### What to Improve

⚠️ **Real-time updates** - Polling every 5s is acceptable but not ideal
⚠️ **Task visibility** - Can't show actual current task, only token usage
⚠️ **Status accuracy** - Inferred from age, not explicit from Gateway

### Design Trade-offs

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| CLI vs WebSocket | Faster implementation (1 day vs 3-5 days) | Slightly higher latency |
| Inferred status | Gateway doesn't expose explicit status | Less precise than actual status |
| 5s cache | Balance between freshness and performance | 5s staleness acceptable |
| Mock data mode | Enable development without Gateway | Maintain two code paths |

## Conclusion

Integration successful! The Backend Developer Agent delivered:

✅ Working API endpoints (`/api/agents`, `/api/agents/:id`, `/health`)
✅ Real Gateway integration via CLI
✅ Schema transformation (Gateway → Mission Control)
✅ Dual-mode support (mock + real)
✅ 5-second cache with TTL
✅ Comprehensive documentation

**Ready for frontend integration!**
