# Mission Control - Internal TKH Deployment Roadmap
**Version**: 1.0  
**Created**: 2026-02-05  
**Status**: Active  
**Target**: Internal TKH team deployment (dogfooding)

---

## Current State: Phase 1 Complete ✅ | Phase 2.1 Auth Complete ✅

**What we have:**
- ✅ Backend API for agent communication
- ✅ Frontend Dashboard with agent monitoring
- ✅ Agent status tracking and filtering
- ✅ Basic agent lifecycle visibility
- ✅ **NEW (2026-02-05):** Backend authentication system with JWT
- ✅ **NEW (2026-02-05):** Frontend login UI (QA approved)
- ✅ **NEW (2026-02-05):** WebSocket communication layer for real-time agent updates

**What we're building:** A practical, secure internal tool for TKH to manage our own OpenClaw agents before considering external enterprise deployment.

---

## Phase 2: Security Essentials & Core UX (Weeks 1-3)
**Goal:** Make it safe and useful for TKH team daily use  
**Status:** 🟢 IN PROGRESS - Auth foundation complete, RBAC + audit logging in progress

### 2.1 Authentication & Access Control
**Priority:** 🔴 CRITICAL (Week 1)

- [x] **Basic auth system** ✅ COMPLETED (2026-02-05)
  - ✅ Simple username/password authentication
  - ✅ Bcrypt password hashing
  - ✅ JWT/session-based auth tokens
  - ✅ Login/logout flow in UI
  - ✅ Backend authentication endpoints
  - ✅ Frontend login page with QA approval
  
- [ ] **Role-based access control (RBAC) - Simple version**
  - 3 roles only: `admin`, `operator`, `viewer`
  - Admin: Full access (user management, all features)
  - Operator: Manage agents, trigger actions, view logs
  - Viewer: Read-only dashboard access
  - Role assignment UI for admins

- [ ] **Initial users**
  - Manual user creation (via CLI/migration script initially)
  - ~5-10 TKH team members
  - Password reset flow (self-service)

**Why:** Can't deploy internally without basic auth. Enterprise SSO/SAML can wait.

### 2.2 Audit Logging - Internal Scope
**Priority:** 🟡 HIGH (Week 2)

- [ ] **Audit trail for sensitive actions**
  - User login/logout events
  - Agent connections/disconnections
  - Manual actions triggered on agents (restarts, kills, etc.)
  - User/role changes by admins
  - Failed authentication attempts

- [ ] **Log storage**
  - Simple append-only database table
  - Retention: 90 days (rolling window)
  - Basic export to CSV/JSON for review
  - Read-only audit log viewer in UI (admin only)

- [ ] **What NOT to log (yet)**
  - Every API call (too verbose for internal use)
  - Full request/response bodies
  - SIEM integration (overkill for now)

**Why:** Track who did what for accountability and debugging. Keep it simple.

### 2.3 Encryption & Secrets
**Priority:** 🟡 HIGH (Week 2-3)

- [ ] **TLS/HTTPS everywhere**
  - TLS 1.3 for API and frontend
  - Let's Encrypt certificate for internal domain
  - Enforce HTTPS redirects

- [ ] **Agent-to-server communication security**
  - Mutual TLS (mTLS) between agents and backend
  - Agent authentication via certificates or API keys
  - Reject unauthenticated agent connections

- [ ] **Secrets in environment/config**
  - Use environment variables for secrets (DATABASE_URL, JWT_SECRET)
  - `.env` files with proper `.gitignore` rules
  - Document secret rotation process (manual for now)
  - **NOT implementing:** Full HashiCorp Vault (overkill for internal)

**Why:** Basic encryption hygiene. No sensitive data in plaintext.

### 2.4 Dashboard UX Improvements
**Priority:** 🟢 MEDIUM (Week 3)

- [ ] **Agent detail view**
  - Click agent → see full details, metrics, logs
  - Recent activity timeline
  - Manual actions: restart, kill, update config

- [ ] **Search & filtering enhancements**
  - Search by agent name, session ID, hostname
  - Filter by status, tags, last-seen time
  - Save filter presets (per user)

- [ ] **Basic metrics visualization**
  - Agent uptime chart
  - Connection status over time (simple line graph)
  - Active agents count (current vs. historical)

**Why:** Make daily ops smoother. We'll use this multiple times per day.

---

## Phase 3: Practical Features for TKH Ops (Weeks 4-6)
**Goal:** Features we actually need day-to-day

### 3.1 Agent Grouping & Organization
**Priority:** 🟡 HIGH (Week 4)

- [ ] **Tagging system**
  - Add/remove tags on agents (e.g., `production`, `dev`, `experiment`)
  - Filter dashboard by tags
  - Bulk tag operations

- [ ] **Logical agent groups**
  - Group agents by purpose: `main-agents`, `test-agents`, `cron-workers`
  - Groups visible in sidebar/navigation
  - Click group → see all agents in that group

**Why:** We have different agent types. Need to organize them.

### 3.2 Notifications & Alerts
**Priority:** 🟡 HIGH (Week 5)

- [ ] **Agent health alerts**
  - Alert when agent goes offline unexpectedly
  - Alert when agent hasn't heartbeated in X minutes
  - Simple threshold rules per agent or group

- [ ] **Notification channels (pick 1-2)**
  - Microsoft Teams webhook (we use Teams)
  - Email (Gmail/SendGrid)
  - Optional: Slack if team prefers it

- [ ] **Alert rules UI**
  - Define rules: "Alert if agent X offline > 5 min"
  - Enable/disable/delete rules
  - Test notification button

**Why:** Need to know when agents crash or disconnect. Can't monitor manually 24/7.

### 3.3 Agent Actions & Control
**Priority:** 🟢 MEDIUM (Week 6)

- [ ] **Manual agent operations from UI**
  - Restart agent (graceful shutdown → reboot)
  - Kill agent (force stop)
  - Update agent config (send new config, agent reloads)
  - Trigger manual heartbeat/health check

- [ ] **Confirmation dialogs**
  - "Are you sure?" for destructive actions
  - Reason/note field for audit trail
  - Show affected agent(s) before action

- [ ] **Action result feedback**
  - Real-time status updates ("Restarting...", "Done", "Failed")
  - Error messages if action fails
  - Log action in audit trail

**Why:** Sometimes we need to manually intervene. Better than SSH-ing into servers.

### 3.4 Log Viewing (Basic)
**Priority:** 🟢 MEDIUM (Week 6)

- [ ] **Agent log streaming**
  - View last N lines of agent logs (live tail)
  - Filter by log level (info, warn, error)
  - Download logs as text file

- [ ] **System/backend logs**
  - View Mission Control backend logs
  - Same filtering/download capabilities

- [ ] **What NOT to build (yet)**
  - Full-text search across all logs (use Ctrl+F for now)
  - Log aggregation pipeline (ELK stack - too heavy)
  - Long-term log storage (keep last 7 days only)

**Why:** Debugging is 80% reading logs. Make it easy to access.

### 3.5 Microsoft Entra ID SSO Integration
**Priority:** 🟡 HIGH (Week 6)

- [ ] **SAML/OIDC integration with Microsoft Entra ID**
  - Configure Entra ID application registration
  - OIDC authentication flow (preferred for modern apps)
  - Map Entra ID groups to Mission Control roles
  - Automatic user provisioning (JIT - Just-In-Time)

- [ ] **Dual auth support**
  - Support both SSO and local accounts
  - Fallback to local admin if SSO fails
  - Migration path for existing local users

- [ ] **User experience**
  - "Sign in with Microsoft" button on login page
  - Seamless redirect flow
  - Session management aligned with Entra ID tokens

**Why:** TKH team already uses Microsoft 365. Single sign-on simplifies access and improves security (no separate passwords to manage).

---

## Phase 4: Nice-to-Haves (Weeks 7-10+)
**Goal:** Polish and quality-of-life features (build if time allows)

### 4.1 Enhanced Metrics & Monitoring
**Priority:** 🔵 LOW (Week 7-8)

- [ ] **Agent resource metrics**
  - CPU/memory usage graphs (if agents report them)
  - Disk space monitoring
  - Network traffic stats

- [ ] **Backend health dashboard**
  - API response times
  - Database query performance
  - Active connections count

- [ ] **Export metrics to Prometheus** (optional)
  - Expose `/metrics` endpoint
  - Allow Grafana dashboards later

**Why:** Nice for visibility, but not critical for initial deployment.

### 4.2 Agent Configuration Management
**Priority:** 🔵 LOW (Week 9)

- [ ] **Centralized config editor**
  - Edit agent configs from UI
  - Push config updates to agents
  - Config versioning (track changes)

- [ ] **Config templates**
  - Predefined configs for common agent types
  - Clone config from one agent to another

**Why:** Eventually useful, but manual config editing works for now.

### 4.3 API Documentation & CLI
**Priority:** 🔵 LOW (Week 10)

- [ ] **Auto-generated API docs**
  - OpenAPI/Swagger spec
  - Interactive API explorer (SwaggerUI)

- [ ] **CLI tool for Mission Control**
  - `mc agents list`
  - `mc agent restart <id>`
  - `mc logs tail <agent-id>`

**Why:** Helps power users, but UI covers 90% of use cases for now.

### 4.4 User Preferences & Customization
**Priority:** 🔵 LOW (Week 10+)

- [ ] **User settings**
  - Timezone preference
  - Theme (light/dark mode)
  - Default filters/views
  - Email notification opt-in/out

- [ ] **Dashboard customization**
  - Drag-and-drop widgets
  - Saved dashboard layouts

**Why:** Quality of life, not essential.

---

## Not in Scope for Internal Deployment
**These are ENTERPRISE features - defer until we productize**

### ❌ Deferred to Enterprise Phase
- Multi-tenancy / workspace isolation
- SSO/SAML integration (Okta, Azure AD)
- LDAP/Active Directory sync
- Advanced RBAC (attribute-based, team-based)
- Compliance certifications (SOC 2, ISO 27001)
- High availability / multi-region deployment
- Disaster recovery automation
- Professional services / support SLA
- Billing & metering
- White-label / custom branding
- 24/7 on-call support infrastructure

**Rationale:** We're 1 team of ~10 people. We don't need enterprise-grade multi-tenancy or 99.99% uptime. Build what we need to work efficiently, not what we'd sell.

---

## Timeline Estimate

### Sprint Breakdown (2-week sprints)

| Sprint | Weeks | Focus | Deliverables |
|--------|-------|-------|--------------|
| **Sprint 1** | 1-2 | Security Foundation | Auth, RBAC, TLS, audit logging |
| **Sprint 2** | 3-4 | UX & Organization | Dashboard improvements, agent grouping/tagging |
| **Sprint 3** | 5-6 | Ops Features | Alerts, agent actions, log viewing |
| **Sprint 4** | 7-8 | Polish | Metrics, config management (optional) |
| **Sprint 5** | 9-10 | API/CLI | Documentation, CLI tools (optional) |

### Critical Path to Internal Deployment
**Minimum viable for TKH team use:**
- ✅ Phase 1 (already done)
- 🔴 Phase 2.1-2.3: Auth, RBAC, encryption (Weeks 1-3)
- 🟡 Phase 3.1-3.2: Grouping, alerts (Weeks 4-5)

**Total time to internal deployment:** ~5-6 weeks  
**Full Phase 2-3 completion:** ~6-8 weeks  
**Phase 4 nice-to-haves:** As needed, no hard deadline

### Resource Assumptions
- 1-2 full-time developers
- Part-time design/UX input
- Internal team available for testing/feedback

---

## Deployment Plan for TKH

### Infrastructure Setup
**Week 1 preparation:**

- [ ] **Hosting environment**
  - Single VM or container (Docker Compose initially)
  - Cloud: AWS/GCP/DigitalOcean (not critical which)
  - Resources: 4GB RAM, 2 vCPU, 50GB disk (plenty for internal use)

- [ ] **Database**
  - PostgreSQL (managed service or self-hosted)
  - Automated backups (daily snapshots)
  - No HA required (can tolerate short downtime)

- [ ] **Domain & TLS**
  - Internal subdomain: `mission-control.tkh.internal` or similar
  - Let's Encrypt SSL certificate
  - DNS setup

- [ ] **Monitoring (basic)**
  - Server uptime monitoring (UptimeRobot or similar)
  - Error tracking (Sentry - free tier)

### Rollout Strategy
**Phased rollout to TKH team:**

1. **Alpha (Week 3):** 2-3 team members test basic auth + UI
2. **Beta (Week 5):** Full team onboarded, daily use begins
3. **Production (Week 6):** Stable, used as primary agent management tool

### Success Metrics
**How we'll know it's working:**

- ✅ All TKH team members can log in and view agents
- ✅ No security incidents (unauthorized access, data leaks)
- ✅ Team uses dashboard daily instead of manual SSH/CLI checks
- ✅ Alerts catch agent issues before we notice manually
- ✅ Audit logs help debug "who changed what" questions
- ✅ < 1 hour/week maintenance needed (low ops burden)

---

## Decision Log & Trade-offs

### Why Simple Auth (No SSO Yet)?
**Decision:** Username/password auth with JWT tokens  
**Rationale:** 
- Team is small (~10 people)
- SSO adds complexity (Okta/Azure AD setup, costs)
- We can add SSO later if we productize
- 80/20 rule: Simple auth covers 100% of internal needs

### Why No Full Audit Logging (No SIEM)?
**Decision:** Log only sensitive actions, 90-day retention  
**Rationale:**
- SIEM integration (Splunk, ELK) is overkill for internal use
- We're not under compliance requirements (SOC 2, etc.)
- Simple database table + CSV export is sufficient
- Can upgrade later if needed

### Why Microsoft Teams Alerts (Not PagerDuty)?
**Decision:** Teams webhooks for notifications  
**Rationale:**
- We already use Teams daily
- No additional tool/subscription needed
- PagerDuty makes sense for 24/7 on-call (we're not there yet)
- Can integrate PagerDuty later if we need escalation policies

### Why No HA/Multi-Region?
**Decision:** Single-instance deployment, manual failover acceptable  
**Rationale:**
- Internal tool, not customer-facing SLA
- Can tolerate 1-2 hour downtime for maintenance/issues
- Team can fall back to manual agent management if dashboard is down
- HA adds significant complexity and cost (load balancers, multi-AZ, etc.)
- Build HA when we have paying enterprise customers

---

## Risks & Mitigations

### Risk 1: Security Breach (Internal Access)
**Impact:** HIGH  
**Likelihood:** LOW  
**Mitigation:**
- TLS + mTLS for all connections
- Strong password policies
- Regular security audits (manual for now)
- Audit logging to detect unusual activity
- Regular backups (can restore if compromised)

### Risk 2: Agent Monitoring Gaps
**Impact:** MEDIUM  
**Likelihood:** MEDIUM  
**Mitigation:**
- Start with conservative alert thresholds (reduce noise)
- Test alerts with intentional agent disconnections
- Have fallback monitoring (existing manual checks) during rollout

### Risk 3: Scope Creep (Building Enterprise Features)
**Impact:** MEDIUM (delays internal deployment)  
**Likelihood:** MEDIUM  
**Mitigation:**
- Stick to this roadmap ruthlessly
- "No" to features not needed for TKH internal use
- Defer enterprise features to separate backlog
- Time-box each sprint, ship incrementally

### Risk 4: Low Adoption (Team Doesn't Use It)
**Impact:** HIGH (wasted effort)  
**Likelihood:** LOW  
**Mitigation:**
- Involve team early (feedback sessions in Weeks 2, 4, 6)
- Build features team explicitly requests
- Make it easier than current manual workflows
- Dogfooding culture: Use our own tools

---

## Next Steps

### Immediate Actions (This Week)
1. ✅ Review and approve this roadmap (team discussion)
2. ⬜ Set up development environment for Phase 2
3. ⬜ Create Sprint 1 tasks in issue tracker
4. ⬜ Begin auth system implementation (Phase 2.1)

### Weekly Check-ins
- Friday EOD: Sprint review (demo progress)
- Monday: Sprint planning (next week's tasks)
- Mid-week: Team feedback session (15 min)

### Key Milestones
- **Week 3:** Auth + security complete → internal alpha testing
- **Week 5:** Alerts + grouping complete → team-wide beta
- **Week 6:** Full Phase 2-3 complete (incl. Entra ID SSO) → production deployment

---

## Questions & Open Items

### To Decide:
- [ ] Which cloud provider for hosting? (AWS/GCP/DigitalOcean)
- [ ] PostgreSQL managed service or self-hosted?
- [ ] Which specific notification channels? (Teams required, Slack optional?)
- [ ] Agent authentication method: mTLS certificates or API keys?
- [ ] Entra ID app registration details (tenant ID, client ID, redirect URIs)

### To Research:
- [ ] Existing agent-backend communication protocol (is auth built in?)
- [ ] Current agent deployment process (how do agents get configured?)
- [ ] Team's preferred alert thresholds (how often is "too noisy"?)

### To Validate:
- [ ] Team confirms this roadmap matches their needs
- [ ] No critical missing features for internal use
- [ ] Timeline is realistic given available developer time

---

## Appendix: Reference Materials

### Related Documents
- [Enterprise Requirements Research](./enterprise-requirements-research.md) - What we're NOT building yet
- Phase 1 completion notes (link to docs/PRs)
- Agent API specification (if exists)

### Inspirations & Prior Art
- **Jenkins**: Simple auth, RBAC, plugin ecosystem
- **Grafana**: Tag-based organization, simple alerting
- **Docker Swarm UI**: Basic cluster management, no enterprise bloat
- **Portainer**: Self-hosted, single-tenant, practical UX

### Tech Stack Assumptions
(Update based on actual implementation)
- **Backend:** Node.js/Python/Go (current choice?)
- **Frontend:** React/Vue/Svelte (current choice?)
- **Database:** PostgreSQL
- **Auth:** JWT tokens + bcrypt
- **Deployment:** Docker Compose → Kubernetes later if needed

---

**Last Updated:** 2026-02-05  
**Next Review:** After Sprint 1 completion (Week 2)  
**Owner:** TKH Engineering Team
