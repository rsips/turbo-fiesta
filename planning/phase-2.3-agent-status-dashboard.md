# Phase 2.3: Agent Status Dashboard

## Priority: HIGH
**Why now:** Auth is complete (backend + frontend). RBAC UI exists. Time to build the core feature - the agent monitoring dashboard.

---

## User Story

**As a** Mission Control user  
**I want** to see all my agents and their current status at a glance  
**So that** I can monitor health and quickly identify issues

### Acceptance Criteria
- [ ] Dashboard layout with header, sidebar navigation, and main content area
- [ ] Agent list view showing all agents with key metrics
- [ ] Real-time status indicators (online, offline, error, idle)
- [ ] Agent cards display: name, status, uptime, last activity
- [ ] Click agent card → navigate to agent detail view (placeholder for now)
- [ ] Responsive grid layout (1 col mobile, 2-3 cols tablet, 3-4 cols desktop)
- [ ] Empty state when no agents exist
- [ ] Loading state while fetching agents
- [ ] Error state if API fails
- [ ] At least 5 component tests:
  - AgentCard renders correctly
  - Status indicator shows correct color
  - Grid layout responds to screen size
  - Empty state displays properly
  - Loading spinner shows during fetch

### Out of Scope (for MVP)
- Filtering/sorting agents
- Search functionality
- Bulk actions (start/stop multiple)
- Agent creation from UI
- Customizable dashboard layouts

---

## Technical Requirements

### Dashboard Layout
```
┌─────────────────────────────────────────────┐
│ Header (logo, user menu, notifications)    │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Sidebar  │  Agent Grid                      │
│          │  ┌─────┐ ┌─────┐ ┌─────┐        │
│ - Agents │  │Agent│ │Agent│ │Agent│        │
│ - Logs   │  │  1  │ │  2  │ │  3  │        │
│ - Users  │  └─────┘ └─────┘ └─────┘        │
│          │  ┌─────┐ ┌─────┐                │
│          │  │Agent│ │Agent│                │
│          │  │  4  │ │  5  │                │
│          │  └─────┘ └─────┘                │
└──────────┴──────────────────────────────────┘
```

### Agent Card Component
```typescript
interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    status: 'online' | 'offline' | 'error' | 'idle';
    uptime: number; // seconds
    lastActivity: string; // ISO timestamp
    model?: string;
  };
  onClick: (agentId: string) => void;
}

const AgentCard = ({ agent, onClick }: AgentCardProps) => {
  return (
    <div className="agent-card" onClick={() => onClick(agent.id)}>
      <StatusIndicator status={agent.status} />
      <h3>{agent.name}</h3>
      <p className="model">{agent.model || 'No model'}</p>
      <div className="metrics">
        <Metric label="Uptime" value={formatUptime(agent.uptime)} />
        <Metric label="Last seen" value={formatRelativeTime(agent.lastActivity)} />
      </div>
    </div>
  );
};
```

### Status Indicator Colors
- **Online:** Green (#10b981)
- **Offline:** Gray (#6b7280)
- **Error:** Red (#ef4444)
- **Idle:** Yellow (#f59e0b)

### Data Fetching
```typescript
// Hook for fetching agents
const useAgents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetch('/api/agents', {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setAgents(data.agents);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);
  
  return { agents, loading, error };
};
```

---

## Dependencies
- ✅ Backend Auth API (Phase 2.1)
- ✅ Frontend Auth Integration (Phase 2.2)
- Backend `/api/agents` endpoint (needs to exist)
- RBAC middleware applied to agent routes

---

## UI Description

### Dashboard Header
- Left: Mission Control logo
- Center: Page title ("Agents")
- Right: User avatar/menu, notification bell

### Sidebar Navigation
- Links: Agents (active), Logs, Users, Settings
- Collapsible on mobile (hamburger menu)

### Agent Grid
- Responsive CSS Grid
- Gap: 1rem
- Each card has hover effect (slight elevation)
- Cards are clickable (cursor pointer)

### Empty State
```
┌─────────────────────────────────────┐
│                                     │
│         🤖                          │
│    No agents found                  │
│                                     │
│  [+ Create your first agent]        │
│                                     │
└─────────────────────────────────────┘
```

### Loading State
- Skeleton cards (3-4 placeholder cards)
- Pulsing animation

### Error State
- Error icon + message
- [Retry] button

---

## Testing Strategy
1. **Unit tests:** AgentCard, StatusIndicator, formatters
2. **Integration tests:** Dashboard with mock API data
3. **Manual QA:**
   - View dashboard with 0, 1, 10, 50+ agents
   - Verify responsive layout (mobile, tablet, desktop)
   - Check status colors match design
   - Test error/loading states

---

## API Contract (Backend)

### GET `/api/agents`
**Headers:**
```
Authorization: Bearer <jwt>
```

**Response (200):**
```json
{
  "agents": [
    {
      "id": "agent-123",
      "name": "Customer Support Bot",
      "status": "online",
      "uptime": 86400,
      "lastActivity": "2026-02-05T22:00:00Z",
      "model": "gpt-4"
    }
  ]
}
```

**Response (401):**
```json
{
  "error": "Unauthorized"
}
```

---

## Success Metrics
- Dashboard loads in <1 second
- Agent cards render correctly for all statuses
- Responsive layout works on mobile/tablet/desktop
- All tests passing
- No console errors

---

## Notes
This is the **hero feature** of Mission Control. Everything else supports this view. Keep it clean, fast, and information-dense.

After this, we'll add:
- Agent detail view (Phase 2.4)
- Real-time updates via WebSocket (Phase 2.5)
- Agent control actions (start/stop/restart)

**Estimated effort:** Medium (2-3 days)  
**Business value:** CRITICAL - This is what users come for
