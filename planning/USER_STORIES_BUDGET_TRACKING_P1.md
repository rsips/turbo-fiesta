# USER STORIES: Budget Tracking Phase 1
## Token Tracking & Session Cost Monitoring

**Sprint:** Phase 1 (Weeks 1-2)  
**Effort:** 4-5 days total  
**Priority:** P0 (MVP)  

---

## STORY 1: Real-Time Token Usage Display per Agent
**Status:** Ready for Development  
**Priority:** P0  
**Effort:** 2 days

```
TITLE: View Current Session Token Usage & Cost per Agent

AS A: System administrator or agent operator
I WANT TO: See real-time token consumption and cost for each active agent
SO THAT: I can monitor LLM spending and detect runaway token usage early

ACCEPTANCE CRITERIA:
□ Agent detail view displays: "Tokens: 4,234 | Cost: $0.12 | Model: gpt-4"
□ Token counts update in real-time as agent makes LLM calls
□ Cost is calculated accurately based on model pricing (GPT-4, Claude, etc.)
□ Display shows timestamp of last LLM request
□ Color-coded cost indicator:
    - Green: <$1 per session (normal)
    - Yellow: $1-5 per session (monitor)
    - Red: >$5 per session (alert)
□ UI gracefully handles multiple concurrent requests
□ Works across agent lifecycle (creation → completion)

DEFINITION OF DONE:
□ Code merged to main branch
□ Unit tests pass (token calculation, cost formatting)
□ Integration tests pass (real token logging flow)
□ UI component tested with multiple agents
□ No console errors or warnings
□ PR reviewed & approved

TASKS:
- [ ] Create TokenTracker middleware/service
- [ ] Add model pricing configuration (external config or DB)
- [ ] Instrument agent request pipeline (before/after LLM calls)
- [ ] Calculate and store tokens (input + output)
- [ ] Update agent detail/card component UI
- [ ] Add real-time update mechanism (WebSocket or polling)
- [ ] Implement color-coded cost display logic
- [ ] Write unit tests for token calculation & cost formatting
- [ ] Write integration tests for end-to-end flow
- [ ] Design & deploy database schema for token events (if needed for Phase 1)

TESTING:
- Unit: Token calculation accuracy, cost formatting
- Integration: Full request → token logging → UI update flow
- Manual: Multiple agents running concurrently, cost trends visible

NOTES:
- Start with in-memory tracking for Session; persist to DB in Story 2
- Use standardized pricing matrix (external config file preferred)
- Consider token-per-second burn rate for future alerting
```

---

## STORY 2: Session Token Summary & Historical Tracking
**Status:** Ready for Development  
**Priority:** P0  
**Effort:** 2 days

```
TITLE: Persist and Display Session-Level Cost Summary & History

AS A: Product manager, billing analyst, or operator
I WANT TO: See total token usage and cost for each session (current and historical)
SO THAT: I can track spending trends, plan budgets, and generate cost reports

ACCEPTANCE CRITERIA:
□ On session end, total tokens and cost are saved to database
□ Session record includes:
    - Session ID, start time, end time, duration
    - Total tokens (input + output)
    - Total cost (calculated)
    - Per-agent breakdown (which agents, how many tokens each)
    - Status (completed, cancelled, error, etc.)
□ New "Session History" view shows last 30 sessions with:
    - Session ID | Start | Duration | Total Tokens | Total Cost | Agent Count | Status
□ Can click on session → view detailed breakdown (per-agent tokens, models used)
□ Can filter by: Date range, agent name, cost range
□ Can export to CSV (for reporting/analysis)
□ Data persists across app restarts
□ No duplicate session records

DEFINITION OF DONE:
□ Database schema created (Session, SessionAgentCost tables)
□ Session tracking logic integrated into session lifecycle
□ Session History UI component built & styled
□ Data persistence working (manual testing)
□ Export to CSV functional
□ Database queries optimized (indexed)
□ Tests written
□ PR reviewed & approved

TASKS:
- [ ] Design Session & SessionAgentCost database schema
- [ ] Create migration script (PostgreSQL)
- [ ] Implement session tracking service (on session create → save to DB)
- [ ] Implement session summary calculation (on session end)
- [ ] Build Session History list component
- [ ] Add filtering & sorting (date, agent, cost)
- [ ] Add CSV export feature
- [ ] Write queries for session history retrieval
- [ ] Add database indexes (session_id, created_at, agent_id)
- [ ] Write integration tests (save/retrieve sessions)
- [ ] Write tests for summary calculation accuracy
- [ ] Manual testing: Create sessions, verify DB records, check export

TESTING:
- Integration: Session creation → tracking → storage → retrieval
- Accuracy: Token & cost totals in DB match UI display
- Performance: Query large session history (1000+ sessions) efficiently
- CSV export: Validate data integrity in export

NOTES:
- Use atomic transactions for session recording (avoid partial saves)
- Consider archival strategy for old sessions (keep last 90 days hot, archive older)
- Cost summation should be atomic (no race conditions)
```

---

## STORY 3: Agent Cost Trend Indicator (Stretch Goal)
**Status:** Optional (Phase 1 if time permits, else Phase 1.5)  
**Priority:** P1  
**Effort:** 1 day

```
TITLE: Show Cost Trending per Agent (Session View)

AS A: Agent developer or operator
I WANT TO: See if an agent's per-request cost is trending up or down
SO THAT: I can detect performance/efficiency regressions early

ACCEPTANCE CRITERIA:
□ Agent detail view shows: "Cost/Request: $0.008 ↗️ (trending up)"
□ Trend indicator is accurate over last 10-20 requests
□ Up arrow (↗️) if avg cost increasing, down (↘️) if decreasing, stable (→) if flat
□ Hover tooltip shows:
    - Avg cost per request (last 10 requests)
    - Previous avg (requests 10-20)
    - % change
□ Color-coded warning: Red if cost/request >$0.05 (model-dependent)
□ Trend calculated only after 5+ requests in session (avoid noise)
□ Works for all model types (GPT-4, Claude, etc.)

DEFINITION OF DONE:
□ Trend calculation logic implemented & tested
□ UI component displays trend indicator & tooltip
□ Colors & arrows display correctly
□ No crashes or errors with small request counts
□ PR reviewed & approved

TASKS:
- [ ] Implement sliding-window trend calculation (last 10 requests)
- [ ] Add trend direction logic (up/down/stable thresholds)
- [ ] Update agent UI component with trend indicator
- [ ] Add hover tooltip with detailed breakdown
- [ ] Implement color coding for cost warnings
- [ ] Write unit tests for trend calculation
- [ ] Manual testing: Verify trend accuracy with multiple agents

TESTING:
- Unit: Trend calculation with sample data (ascending, descending, stable)
- Manual: Verify trend arrows match actual cost movements

NOTES:
- Optional for initial MVP; ship if time permits
- Useful for developers debugging prompt efficiency
- Consider storing cost history in-memory for easy trend calculation
```

---

## STORY 4: Admin Budget Alerts & Thresholds (Phase 1.5)
**Status:** Stretch Goal / Phase 1.5  
**Priority:** P1  
**Effort:** 2 days

```
TITLE: Set & Monitor Spending Alerts for Sessions & Agents

AS A: System administrator
I WANT TO: Set spending thresholds and receive alerts when exceeded
SO THAT: I can prevent unexpected cost overruns

ACCEPTANCE CRITERIA:
□ New "Budget Settings" section in admin panel
□ Can set thresholds:
    - Per-session limit (e.g., $10 max per session)
    - Per-agent limit (e.g., $5 max per agent per session)
□ When threshold exceeded:
    - In-app alert notification appears (dismissible)
    - Alert shows: Agent name, current spend, threshold, % over
    - Alert logged to system (for audit)
□ Admin can configure default thresholds (applied to new agents)
□ Thresholds can be overridden per-agent (if needed)
□ No false positives (grace period for legitimate spikes)
□ Notification delivery is reliable (no missed alerts)

DEFINITION OF DONE:
□ BudgetConfig model & database table created
□ Admin settings UI functional
□ Alert checking logic implemented (on token log event)
□ Alert notification system working
□ Tests written & passing
□ PR reviewed & approved

TASKS:
- [ ] Design BudgetConfig database schema
- [ ] Create migration script
- [ ] Build admin settings UI for threshold configuration
- [ ] Implement alert checking service (on every token log)
- [ ] Implement alert notification system (in-app)
- [ ] Integrate alert checks into token logging pipeline
- [ ] Write tests for alert triggering logic
- [ ] Write tests for threshold accuracy
- [ ] Manual testing: Trigger alerts, verify notifications
- [ ] Documentation: How to set & manage budget alerts

TESTING:
- Unit: Alert threshold logic (triggers at right point, not before/after)
- Integration: Token log → threshold check → notification
- Manual: Set threshold, trigger it, verify alert appears

NOTES:
- Phase 1.5: Ship after Stories 1-2 if time permits
- Future enhancement: Auto-pause agent if threshold exceeded (Phase 2)
- Consider escalation rules: Alert admin after 2nd threshold breach
```

---

## TECHNICAL SPECIFICATIONS

### Token Pricing Matrix
```json
{
  "gpt-4": {
    "input_token_cost": 0.00003,
    "output_token_cost": 0.00006
  },
  "gpt-4-turbo": {
    "input_token_cost": 0.00001,
    "output_token_cost": 0.00003
  },
  "claude-3-opus": {
    "input_token_cost": 0.000015,
    "output_token_cost": 0.000075
  },
  "claude-3-sonnet": {
    "input_token_cost": 0.000003,
    "output_token_cost": 0.000015
  }
}
```

### Database Schema (Phase 1 Minimum)

```sql
-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  status VARCHAR(50), -- 'active', 'completed', 'cancelled', 'error'
  total_tokens INTEGER DEFAULT 0,
  total_cost NUMERIC(10, 6) DEFAULT 0,
  notes TEXT
);

-- Token events (for audit trail)
CREATE TABLE token_events (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  agent_id VARCHAR(255),
  model VARCHAR(100),
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost NUMERIC(10, 6),
  created_at TIMESTAMP DEFAULT NOW(),
  request_duration_ms INTEGER
);

-- Indexes for performance
CREATE INDEX idx_sessions_created_at ON sessions(created_at);
CREATE INDEX idx_token_events_session_id ON token_events(session_id);
CREATE INDEX idx_token_events_agent_id ON token_events(agent_id);
CREATE INDEX idx_token_events_created_at ON token_events(created_at);
```

### Data Flow
```
Agent LLM Request
  ↓
TokenTracker middleware captures:
  - input tokens
  - output tokens
  - model name
  - timestamp
  ↓
Calculate cost (tokens × pricing)
  ↓
Dual logging:
  - In-memory: Update session counter (for UI)
  - Database: Insert token_event row (for history)
  ↓
Real-time UI update (WebSocket or polling)
  ↓
Session end: Calculate & store session summary
```

---

## ACCEPTANCE CHECKLIST

- [ ] Story 1: Token display accurate & real-time ✓
- [ ] Story 2: Session history persisted & queryable ✓
- [ ] Story 3: Cost trends display correctly (if included) ✓
- [ ] Story 4: Budget alerts fire at correct thresholds (if included) ✓
- [ ] All tests passing ✓
- [ ] No database performance issues (queries <100ms) ✓
- [ ] UI responsive (no lag when updating tokens) ✓
- [ ] Documentation complete ✓
- [ ] Team trained on new features ✓

---

## DEPENDENCIES

- Database (PostgreSQL) provisioned
- WebSocket or polling infrastructure ready (for real-time updates)
- Model pricing config accessible (file or DB)

## BLOCKERS

None. Can start immediately.

## RELATED FEATURES (Phase 2+)

- Budget dashboard with charts
- Cost forecasting
- Per-user/team billing
- Cost anomaly detection
- Auto-pause agents (if overbudget)

---

**Prepared by:** PM Subagent  
**Ready for:** Sprint Planning & Development Assignment
