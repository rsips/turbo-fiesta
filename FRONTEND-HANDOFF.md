# Frontend Developer Handoff

**From:** Backend Developer Agent  
**To:** Frontend Developer Agent  
**Date:** 2026-02-05  
**Status:** Backend API Ready ✅

---

## TL;DR

The backend API is **ready for integration**. You can start building React components immediately.

**API Base URL:** `http://localhost:8080/api`  
**Docs:** See `README.md` and `INTEGRATION.md` in this repo

---

## Quick Start for Frontend

### 1. Start the Backend

```bash
cd /home/sky/.openclaw/workspace/mission-control/backend
npm install
USE_MOCK_DATA=false npm run dev
```

Backend will run on `http://localhost:8080`

### 2. Test Endpoints

```bash
# Health check
curl http://localhost:8080/health

# Get all agents
curl http://localhost:8080/api/agents | jq

# Get single agent (use any session_id from above)
curl http://localhost:8080/api/agents/{session_id} | jq
```

### 3. Start Building Frontend

You can now:
- Fetch agents from `/api/agents`
- Display them in your React components
- Poll every 5 seconds for updates
- Click agent → fetch `/api/agents/:id` for details

---

## API Reference

### GET /api/agents

**Returns:** List of all agents

**Example Response:**
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "agent:main:msteams:...",
        "name": "Main Agent",
        "session_id": "8e8aaf0c-d455-42af-ba7c-6a668f5bd8ee",
        "status": "online",
        "current_task": "Context: 82% used (164,717 tokens)",
        "task_started_at": "2026-02-05T20:01:25Z",
        "last_activity": "2026-02-05T20:01:30Z",
        "started_at": "2026-02-05T16:30:00Z",
        "uptime_seconds": 12690,
        "metadata": {
          "agentId": "main",
          "model": "claude-sonnet-4-5-20250929",
          "totalTokens": 164717,
          "percentUsed": 82
        }
      }
    ],
    "count": 10,
    "timestamp": "2026-02-05T20:03:00Z"
  }
}
```

**Fields:**
- `id`: Unique identifier (use for detail endpoint)
- `name`: Display name (e.g., "Main Agent")
- `session_id`: UUID session identifier
- `status`: `"online"` | `"busy"` | `"offline"` | `"error"`
- `current_task`: What agent is doing (or null if idle)
- `task_started_at`: ISO timestamp when task started
- `last_activity`: ISO timestamp of last activity
- `started_at`: ISO timestamp when agent started
- `uptime_seconds`: How long agent has been running (in seconds)
- `metadata`: Extra info (model, tokens, flags, etc.)

### GET /api/agents/:id

**Returns:** Single agent details

**Path Parameter:**
- `id`: Can be `session_id` or part of agent name

**Example Request:**
```bash
GET /api/agents/8e8aaf0c-d455-42af-ba7c-6a668f5bd8ee
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": "agent:main:msteams:...",
    "name": "Main Agent",
    "status": "online",
    // ... same structure as list endpoint
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "AGENT_NOT_FOUND",
    "message": "Agent not found or no longer active",
    "details": "No agent found with ID: xyz"
  }
}
```

### GET /health

**Returns:** API health status

**Example Response:**
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

---

## Frontend Requirements Reminder

From architecture doc:

### Display Requirements
Each agent should show:
- ✅ **Name** → Use `agent.name`
- ✅ **Status Badge** → Use `agent.status` (color-code)
- ✅ **Current Task** → Use `agent.current_task` (truncate if needed)
- ✅ **Last Activity** → Use `agent.last_activity` (format as relative time)
- ✅ **Uptime** → Use `agent.uptime_seconds` (format as duration)

### Status Colors (Suggested)
- `online`: Green (#10b981)
- `busy`: Orange (#f59e0b)
- `offline`: Gray (#6b7280)
- `error`: Red (#ef4444)

### Polling Strategy
```typescript
// Example React hook
useEffect(() => {
  const fetchAgents = async () => {
    const response = await fetch('http://localhost:8080/api/agents');
    const data = await response.json();
    setAgents(data.data.agents);
  };
  
  fetchAgents(); // Initial fetch
  const interval = setInterval(fetchAgents, 5000); // Poll every 5s
  
  return () => clearInterval(interval);
}, []);
```

---

## Integration Tips

### 1. Axios Client Setup

```typescript
// api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 5000,
});

export const getAgents = async () => {
  const response = await apiClient.get('/agents');
  return response.data;
};

export const getAgent = async (id: string) => {
  const response = await apiClient.get(`/agents/${id}`);
  return response.data;
};
```

### 2. Type Definitions

Copy from `backend/src/types/agent.ts`:

```typescript
export type AgentStatus = 'online' | 'busy' | 'offline' | 'error';

export interface Agent {
  id: string;
  name: string;
  session_id: string;
  status: AgentStatus;
  current_task: string | null;
  task_started_at: string | null;
  last_activity: string;
  started_at: string;
  uptime_seconds: number;
  metadata?: Record<string, any>;
}
```

### 3. Error Handling

```typescript
try {
  const data = await getAgents();
  setAgents(data.data.agents);
  setError(null);
} catch (err) {
  setError('Failed to fetch agents');
  // Don't clear existing agents - show stale data with error banner
}
```

### 4. Formatting Helpers

```typescript
// Format relative time
import { formatDistanceToNow } from 'date-fns';

function formatLastActivity(isoTimestamp: string): string {
  return formatDistanceToNow(new Date(isoTimestamp), { addSuffix: true });
  // Output: "2 minutes ago"
}

// Format uptime
function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
  // Output: "3h 24m"
}
```

### 5. Filter & Sort (Client-side)

```typescript
// Filter by status
const filteredAgents = agents.filter(agent => 
  statusFilter === 'all' || agent.status === statusFilter
);

// Filter by search
const searchedAgents = filteredAgents.filter(agent =>
  agent.name.toLowerCase().includes(searchQuery.toLowerCase())
);

// Sort by field
const sortedAgents = [...searchedAgents].sort((a, b) => {
  // Example: sort by last_activity
  const aTime = new Date(a.last_activity).getTime();
  const bTime = new Date(b.last_activity).getTime();
  return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
});
```

---

## Testing Your Frontend

### 1. Mock Mode (No Gateway Required)

If you want to test without Gateway:

```bash
# In backend terminal
USE_MOCK_DATA=true npm run dev
```

You'll get 5 sample agents with various statuses.

### 2. Real Mode (With Gateway)

```bash
# In backend terminal
USE_MOCK_DATA=false npm run dev
```

You'll get real agents from the running OpenClaw Gateway (currently ~10 agents).

### 3. Test Different Scenarios

```bash
# Kill backend to test error handling
# Check your UI shows error banner + retry button

# Wait >5 seconds to test auto-refresh
# Check your UI updates without page reload

# Filter by status
# Check your UI filters work correctly
```

---

## Current Real Data

As of now, the Gateway has **10 active agents**:

| Agent | Status | Tokens Used |
|-------|--------|-------------|
| Main Agent | Online | 82% |
| Frontend Dev Agent | Online | 23% |
| Backend Dev Agent | Offline | 0% |
| Architect Agent | Offline | 13% |
| PM Agent | Offline | 7% |
| Orchestrator Agent | Offline | 8% |

This gives you a good variety to test your UI!

---

## Common Issues & Solutions

### Issue: "CORS error in browser"

**Cause:** Frontend on different port than backend

**Solution:** Backend already has CORS enabled (`cors: { origin: '*' }`), so this shouldn't happen. If it does, check browser console for exact error.

### Issue: "Network error" in fetch

**Cause:** Backend not running

**Solution:**
```bash
cd backend
npm run dev
```

### Issue: "Empty agent list"

**Cause:** Backend using real Gateway, but no agents running

**Solution:** Switch to mock mode:
```bash
USE_MOCK_DATA=true npm run dev
```

### Issue: "Data not updating"

**Cause:** Polling not working

**Solution:** Check your `setInterval` cleanup:
```typescript
useEffect(() => {
  const interval = setInterval(fetchAgents, 5000);
  return () => clearInterval(interval); // Important!
}, []);
```

---

## Performance Expectations

- **Initial load:** ~200ms (cold cache)
- **Subsequent loads:** <5ms (cached)
- **Refresh rate:** 5 seconds (backend cache)
- **List size:** 10 agents currently, designed for up to 100

---

## Phase 1 Scope Reminder

✅ **In Scope:**
- Display agent list with all fields
- Auto-refresh every 5 seconds
- Filter by status (client-side)
- Search by name (client-side)
- Sort by columns (client-side)
- Click agent → show detail modal/page
- Error handling with retry

❌ **Out of Scope (Phase 2):**
- Agent control (stop/restart/send message)
- Historical data (charts, trends)
- Real-time updates (WebSocket)
- Mobile optimization (<768px)
- Server-side filtering/sorting
- Pagination

---

## Questions?

**Backend Issues:**
- Check `README.md` for troubleshooting
- Check `INTEGRATION.md` for Gateway details
- Check logs: Backend outputs detailed logs with `[INFO]` and `[ERROR]` tags

**Frontend Questions:**
- Contact Orchestrator to spawn Frontend Developer Agent
- See architecture doc: `/home/sky/.openclaw/workspace-orchestrator/project/architecture/agent-list-view-architecture.md`

---

## Final Checklist Before You Start

- [ ] Backend running on port 8080
- [ ] Test endpoints return data (`./test.sh`)
- [ ] Copy `Agent` type to frontend
- [ ] Set up Axios client
- [ ] Create mock API responses (optional, for offline dev)
- [ ] Read architecture doc for component structure

---

**Ready to build! The API is fully functional and tested. Happy coding! 🚀**

**Backend Developer Agent** signing off ✅
