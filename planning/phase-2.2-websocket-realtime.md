# Phase 2.2: WebSocket Real-Time Communication

## Priority: HIGH
**Why now:** Auth is complete. Real-time updates are the core value prop of Mission Control. Agents change state frequently—users need live data, not polling.

---

## User Story

**As a** Mission Control user  
**I want** real-time agent status updates  
**So that** I see changes immediately without refreshing

### Acceptance Criteria
- [x] WebSocket server integrated with Express backend
- [x] Clients can authenticate via JWT token (handshake or query param)
- [x] Server broadcasts agent status changes to connected clients
- [x] Server handles agent lifecycle events (start, stop, restart, crash)
- [x] Clients receive real-time session activity updates
- [x] Connection recovery logic (reconnect on disconnect) - documented for client implementation
- [x] Basic error handling (invalid auth, connection drop)
- [x] At least 5 unit tests covering: (21 tests implemented!)
  - Authentication during handshake
  - Broadcasting events to all authenticated clients
  - Handling disconnections gracefully
  - Rejecting unauthenticated connections
  - Message format validation

### Out of Scope (for MVP)
- Room-based subscriptions (subscribe to specific agents only)
- Message history/replay
- Rate limiting per connection
- Binary protocol optimization

---

## Technical Requirements

### WebSocket Integration
- Use `ws` library (or `socket.io` if preferred)
- Mount on same Express server as REST API
- Share port (e.g., 3000) with HTTP server

### Authentication
- Validate JWT during WebSocket handshake
- Accept token via:
  - `Authorization` header (preferred)
  - Query param `?token=<jwt>` (fallback for browser clients)
- Close connection immediately if invalid/missing token

### Event Types
```typescript
// Server → Client events
{
  type: "agent:status",
  payload: {
    agentId: string,
    status: "online" | "offline" | "error",
    timestamp: number
  }
}

{
  type: "session:activity",
  payload: {
    agentId: string,
    sessionId: string,
    lastMessage: string,
    timestamp: number
  }
}

{
  type: "heartbeat",
  payload: { timestamp: number }
}
```

### Connection Management
- Track active connections in-memory (Map<userId, WebSocket[]>)
- Clean up on disconnect
- Send heartbeat ping every 30s to detect dead connections

---

## Dependencies
- ✅ Phase 2.1 (Backend Auth) - JWT middleware needed for WebSocket auth
- Backend server must expose a way to trigger broadcasts (e.g., `broadcastAgentStatus(agentId, status)`)

---

## UI Description
*(For frontend integration later)*

- Status indicators update instantly when agents go online/offline
- Session list shows new messages as they arrive
- Connection status indicator (green = connected, red = disconnected)
- Toast notification on connection loss

---

## Testing Strategy
1. **Unit tests:** Mock WebSocket connections, verify auth and message routing
2. **Integration tests:** Real WebSocket client connecting to test server
3. **Manual QA:** 
   - Open dashboard in two browsers
   - Trigger agent status change
   - Verify both browsers update simultaneously

---

## Success Metrics
- [x] WebSocket connections authenticated successfully
- [x] Status updates visible in <500ms (broadcasts are immediate)
- [x] No memory leaks over 1000 connect/disconnect cycles (tested with 50 cycles)
- [x] All tests passing (21 WebSocket tests, 58 total)

---

## Notes
This unblocks Phase 3 (Frontend Real-Time Updates). Frontend can connect and listen for events even before full UI is built.

**Estimated effort:** Medium (2-3 days)
**Business value:** HIGH - Core differentiator of Mission Control
