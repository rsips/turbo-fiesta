# Mission Control - Phase 1 Proof of Concept

## Project Overview

**Mission:** Build a centralized web dashboard for managing OpenClaw agents, sessions, and deployments across TKH.

**Phase 1 Goal:** Deliver a minimal proof of concept demonstrating multi-agent collaboration can build real software.

## Phase 1 Scope: Agent Status Dashboard

Build the simplest possible useful feature to prove the workflow works end-to-end.

### Feature: Agent List View

**User Story:**
As an administrator, I want to see a list of all OpenClaw agents and their current status, so I can monitor the health of the system at a glance.

**Acceptance Criteria:**
- [ ] Backend API endpoint `GET /api/agents` returns list of agents
- [ ] Frontend displays agents in a table with: name, status, last seen
- [ ] Status indicator (green=active, yellow=idle, red=error)
- [ ] Deployed to staging environment
- [ ] End-to-end tests pass
- [ ] User documentation written

**Out of Scope (for Phase 1):**
- Real-time updates (WebSocket) - will use polling
- Agent control (start/stop/restart)
- Session management
- Detailed agent metrics
- Authentication (will add in Phase 2)

## Team Structure

You have a team of 7 specialized agents:

1. **pm** - Product Manager
   - Defines requirements, user stories, acceptance criteria
   - Prioritizes features

2. **architect** - System Architect
   - Designs technical architecture
   - Defines API contracts, database schemas
   - Makes technology decisions

3. **frontend-dev** - Frontend Developer
   - Implements React UI
   - Integrates with backend API

4. **backend-dev** - Backend Developer
   - Implements REST API
   - Database models and migrations
   - OpenClaw Gateway integration

5. **devops** - DevOps Engineer
   - Containerization (Docker)
   - Deployment (Kubernetes/staging)
   - Infrastructure

6. **qa-tester** - QA Tester
   - End-to-end testing
   - Bug reporting

7. **docs-writer** - Documentation Writer
   - User guides
   - API documentation

## Your Role (Orchestrator)

You coordinate the team. Break down work, delegate tasks via `sessions_spawn`, track progress, resolve blockers, keep humans informed.

## Tech Stack (Already Decided)

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Vite

**Backend:**
- Node.js 20 + TypeScript
- Fastify
- PostgreSQL
- Prisma ORM

**Infrastructure:**
- Docker
- Kubernetes (staging: TKH on-premise cluster)

## Success Criteria for Phase 1

1. **Feature works** - Agent list displays in staging, data is accurate
2. **Quality** - QA tests pass, < 3 bugs found
3. **Timeline** - Complete in 1-2 weeks
4. **Cost** - < €500 in LLM API costs
5. **Autonomous** - Minimal human intervention (just kickoff + approval)

## Workflow Recommendation

### Step 1: Requirements (PM)
Spawn PM to write detailed user stories and acceptance criteria.

### Step 2: Design (Architect)
Spawn Architect to design:
- Database schema for `agents` table
- API contract for `GET /api/agents`
- Frontend component structure

### Step 3: Implementation (Parallel)
Spawn both developers simultaneously:
- **Backend Dev**: Implement API endpoint, database model
- **Frontend Dev**: Implement UI (can use mock data initially)

### Step 4: Integration
Once both complete, have Frontend Dev integrate with real backend.

### Step 5: Testing (QA)
Spawn QA to test end-to-end, report bugs.

### Step 6: Bug Fixes
Delegate bug fixes back to appropriate developers.

### Step 7: Deployment (DevOps)
Once QA passes, spawn DevOps to deploy to staging.

### Step 8: Documentation (Docs)
Spawn Docs Writer to create user guide.

### Step 9: Human Review
Notify Linh/Robert-Jan that Phase 1 is complete and ready for review.

## Key Constraints

- **Staging only** - No production deployments yet
- **Simple auth** - Basic token auth, no OAuth yet (Phase 2)
- **Polling over WebSocket** - Keep it simple for Phase 1
- **SQLite for dev, PostgreSQL for staging** - DevOps will set up staging DB

## Communication

- **Daily standups** - Your cron job at 9 AM CET summarizes progress to Teams
- **Completed tasks** - Notify humans when major milestones hit
- **Blockers** - Escalate immediately if team is stuck

## Current Status

**Status:** Project just kicked off  
**Next Action:** Spawn PM to write detailed requirements for Agent List View

## Questions for Humans

If you need clarification on requirements or priorities, ask in the Teams group chat via `message` tool.

---

**Let's build this!** 🚀

Your first action: Spawn the PM agent to define detailed requirements.
