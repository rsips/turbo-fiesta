# Feature Analysis: Agent Config Editor

**Requested by:** Robert-Jan  
**Date:** 2026-02-05  
**Status:** Under Review

---

## 📋 Overview

A browser-based editor for agent configuration files, enabling administrators and team members to customize agent behavior, workspace guidelines, and tool configurations without SSH/terminal access.

### Core Concept
- Edit agent workspace files through Mission Control UI
- File types: SOUL.md, AGENTS.md, USER.md, TOOLS.md, HEARTBEAT.md, openclaw.json
- Syntax highlighting for markdown/JSON
- Validation before save
- Optional: agent restart/reload after config changes
- Role-based access control (admin-only or team-editable)

---

## 🎯 Priority Assessment: **PHASE 3.3 (HIGH PRIORITY)**

### Rationale:
1. **Team enabler** - Removes technical barriers for non-developers
2. **Operational efficiency** - No SSH/terminal needed for config changes
3. **Safety improvement** - Built-in validation prevents syntax errors
4. **Natural UX evolution** - View → Edit is logical progression
5. **Foundation exists** - File system access already available in backend

### Recommended Placement:
**Phase 3.3** - Team collaboration focus, after Activity Feed (3.1) and before advanced features (Phase 4)

---

## 🔨 Scope Definition

### ✅ MVP Features (Must-Have)

#### 1. File Browser
- **Workspace navigation** for each agent
- **File tree view** showing editable configs:
  - `SOUL.md` - Agent personality
  - `AGENTS.md` - Workspace guidelines
  - `USER.md` - User information
  - `TOOLS.md` - Tool configurations
  - `HEARTBEAT.md` - Heartbeat tasks
  - `memory/` folder (read-only for MVP)
- **File type icons** and last modified timestamps
- **Search/filter** files by name

#### 2. Code Editor
- **Monaco Editor** (same as VS Code) or **CodeMirror**
- **Syntax highlighting:**
  - Markdown (.md files)
  - JSON (openclaw.json)
- **Line numbers** and basic editing features
- **Auto-save indicator** (saved/unsaved state)
- **Read-only mode** for certain files

#### 3. Save & Validation
- **Syntax validation** before save:
  - Markdown linting (check headers, links)
  - JSON validation (parse errors)
- **Error highlighting** with helpful messages
- **Confirm dialog** for sensitive changes
- **Success/error notifications**

#### 4. Access Control
- **Admin-only by default** (configurable per file type)
- **Role-based permissions:**
  - Admin: Can edit all files including openclaw.json
  - Editor: Can edit .md files, no JSON
  - Viewer: Read-only access
- **Audit logging** of all config changes (who, what, when)

---

### 🌟 Nice-to-Have (Phase 4)

#### 1. Advanced Editing
- **Markdown preview** (side-by-side with editor)
- **Diff view** (compare before/after)
- **Version history** (git-style versioning)
- **Revert changes** (undo to previous version)
- **Multi-file editing** (tabs)

#### 2. Agent Management
- **Hot reload** agent after config changes (no restart)
- **Restart agent** button with confirmation
- **Test mode** - dry-run changes before applying
- **Config templates** - quick-start templates for new agents

#### 3. Collaboration Features
- **Concurrent editing** protection (lock files)
- **Comments/annotations** on configs
- **Change approval workflow** (review before apply)
- **Notification** when configs are changed

#### 4. Enhanced Validation
- **Schema validation** for structured fields
- **Cross-file validation** (e.g., TOOLS.md references match skills)
- **Best practices warnings** (e.g., "HEARTBEAT.md is empty")
- **AI-assisted suggestions** (fix common mistakes)

---

## 📊 Effort Estimate

### Backend Work: **3-4 days** 🔧

- [ ] **Config file API** (`/api/v1/agents/:agentId/config`)
  - List files in workspace
  - Read file content
  - Write file content (with backup)
  - **Estimate:** 6-8 hours

- [ ] **Validation service**
  - Markdown linting (check syntax, headers)
  - JSON validation (parse and schema check)
  - Return structured errors
  - **Estimate:** 4-6 hours

- [ ] **File permissions system**
  - Map file types to role requirements
  - Check user role before read/write
  - **Estimate:** 4-6 hours

- [ ] **Backup and rollback**
  - Automatic backup before save
  - Store previous version (simple versioning)
  - Rollback API endpoint
  - **Estimate:** 4-6 hours

- [ ] **Audit logging integration**
  - Log config change events
  - Include diff (before/after)
  - **Estimate:** 2-3 hours

**Total Backend:** ~20-29 hours (3-4 days)

---

### Frontend Work: **5-7 days** 🎨

#### File Browser UI
- [ ] **File tree component**
  - Workspace folder structure
  - File icons and metadata
  - Selection state
  - **Estimate:** 6-8 hours

- [ ] **Agent selector**
  - Dropdown or tabs for multi-agent workspaces
  - **Estimate:** 2-3 hours

#### Editor Integration
- [ ] **Monaco Editor integration**
  - Install and configure Monaco
  - Language modes (markdown, JSON)
  - Theme integration (match Mission Control UI)
  - **Estimate:** 8-10 hours

- [ ] **Editor toolbar**
  - Save button
  - Revert button
  - Full-screen toggle
  - **Estimate:** 3-4 hours

#### Validation & Feedback
- [ ] **Validation UI**
  - Display errors inline (red squiggles)
  - Error panel with messages
  - Block save on validation failure
  - **Estimate:** 6-8 hours

- [ ] **Save flow**
  - Confirm dialog for sensitive files
  - Loading states
  - Success/error notifications
  - **Estimate:** 4-6 hours

#### Permissions & Safety
- [ ] **Role-based UI**
  - Hide edit button if user lacks permissions
  - Read-only mode indicator
  - **Estimate:** 3-4 hours

- [ ] **Backup/restore UI** (optional for MVP)
  - Version history dropdown
  - Restore button
  - **Estimate:** 4-6 hours (defer to Phase 4)

#### Polish
- [ ] **Responsive design** (desktop-first, mobile view)
- [ ] **Keyboard shortcuts** (Ctrl+S to save)
- [ ] **Empty states** and help text
- [ ] **Accessibility** (ARIA labels, keyboard nav)
- [ ] **Unit tests**
  - **Estimate:** 8-10 hours

**Total Frontend:** ~40-53 hours (5-7 days)

---

### Total MVP Estimate: **8-11 days** (1 full-stack developer or 2 specialists)

---

## 🚀 Implementation Phases

### Phase 3.3 - Config Editor MVP (Week 12-13)
**Goal:** Admin-level editing of .md files with validation

**Sprint 1 (Week 12):**
- Backend: Config API + validation service
- Frontend: File browser + Monaco Editor integration

**Sprint 2 (Week 13):**
- Backend: Permissions + audit logging
- Frontend: Save flow + validation UI + polish

**Deliverable:** Working config editor for admin users

---

### Phase 4.1 - Advanced Features (Week 14-15) [Optional]
**Goal:** Markdown preview, version history, hot reload

- Markdown preview pane (split view)
- Version history and rollback UI
- Agent restart/reload integration
- Multi-file tabs

**Deliverable:** Production-ready config editor

---

### Phase 4+ - Team Collaboration (Future)
- Concurrent editing protection (file locks)
- Change approval workflow
- AI-assisted validation and suggestions
- Config templates library

---

## 🔗 Dependencies

### Required (Blocking):
- ✅ **Authentication/Authorization (Phase 1)** - RBAC system must exist
- ✅ **File system access** - Backend can read/write agent workspaces
- ⚠️ **Agent workspace structure** - Must be standardized across agents

### Nice-to-Have (Non-blocking):
- **Agent restart API** - For hot reload after config changes
- **Git integration** - For automatic versioning of config files
- **Notification system** - To alert team when configs change

---

## 🎓 Success Metrics

### MVP Success:
- [ ] Load file <500ms for typical config size (10-50 KB)
- [ ] Save with validation <1s
- [ ] Zero accidental config corruption (validation catches 100% of syntax errors)
- [ ] 80%+ of admins prefer UI over SSH within 2 weeks
- [ ] Audit logs capture 100% of config changes

### Advanced Success (Phase 4.1):
- [ ] Markdown preview renders correctly for 95%+ edge cases
- [ ] Version history accessible <3 clicks
- [ ] Hot reload works 90%+ of the time (no full restart)
- [ ] Config templates reduce new agent setup time by 50%

---

## 🛡️ Risks & Mitigations

### Risk 1: Concurrent edits cause data loss
**Impact:** High  
**Mitigation:** 
- MVP: Show warning if file modified since load (timestamp check)
- Phase 4: Implement file locking (pessimistic concurrency)

### Risk 2: Invalid configs break agents
**Impact:** High  
**Mitigation:**
- Strict validation before save (syntax + schema)
- Automatic backup before every save
- Rollback UI to restore previous version

### Risk 3: Security - unauthorized access to sensitive configs
**Impact:** Critical  
**Mitigation:**
- RBAC enforced at API level (not just UI)
- Audit logging for accountability
- Read-only mode for USER.md (contains personal info)

### Risk 4: Performance - large config files slow editor
**Impact:** Medium  
**Mitigation:**
- File size limits (warn if >500 KB)
- Lazy loading for large files
- Monaco Editor handles large files well

### Risk 5: Agents crash after config reload
**Impact:** Medium  
**Mitigation:**
- Validate config structure before applying
- Test mode (dry-run) before committing changes
- Automatic restart if agent crashes post-reload

---

## 💡 Recommendation

### ✅ **APPROVE for Phase 3.3**

**Why:**
1. **High usability value** - Removes SSH barrier for team members
2. **Safety improvement** - Validation prevents config corruption
3. **Moderate effort** - 8-11 days, manageable scope
4. **Complements Activity Feed** - Both improve team experience
5. **Foundation for advanced features** - Enables templates, AI suggestions later

**Why NOT Phase 3.1/3.2:**
- Activity Feed is higher priority (more immediate value)
- Config editor benefits from stable agent system (Phase 2 complete)
- Can be developed concurrently with engagement features (3.2)

**Next Steps:**
1. ✅ Review and approve this analysis
2. Add to Phase 3.3 roadmap (after Activity Feed)
3. Assign full-stack developer or backend+frontend pair
4. Kick off Sprint 1 (Week of 2026-02-24, ~3 weeks from now)

---

## 🎨 UI Mockup Ideas

### Layout Concept:
```
┌─────────────────────────────────────────────────────────┐
│ Mission Control Header                                  │
├─────────────┬───────────────────────────────────────────┤
│             │  Agent Config Editor                      │
│ Agent List  │  ────────────────────────                 │
│ ┌─────────┐ │  File: SOUL.md              [Save] [×]   │
│ │ Backend │ │  ┌─────────────────────────────────────┐ │
│ │ QA      │◄│  │ # SOUL.md - Who Am I?               │ │
│ │ DevOps  │ │  │                                     │ │
│ │ PM      │ │  │ You are a Backend Developer agent...│ │
│ └─────────┘ │  │                                     │ │
│             │  │ ## Personality                      │ │
│ File Tree   │  │ - Pragmatic and efficient           │ │
│ ┌─────────┐ │  │ - Security-conscious                │ │
│ │📄SOUL.md │◄│  └─────────────────────────────────────┘ │
│ │📄AGENTS  │ │                                          │
│ │📄USER    │ │  ✓ Saved 2 minutes ago                   │
│ │📄TOOLS   │ │  📊 42 lines │ 1.2 KB                   │
│ │📄HEARTB. │ │                                          │
│ │📁memory/ │ │                                          │
│ └─────────┘ │                                          │
└─────────────┴───────────────────────────────────────────┘
```

### Key UI Elements:
1. **Left sidebar:** Agent selector + file tree
2. **Main area:** Monaco Editor with toolbar
3. **Bottom bar:** Save status, file stats, validation errors
4. **Top right:** Action buttons (Save, Revert, Full-screen)

---

## 📝 Notes

### File-Specific Considerations:

**SOUL.md:**
- High-impact changes (affects agent personality)
- Consider requiring confirmation: "This will change agent behavior. Continue?"
- Preview mode: "See how this will affect agent responses"

**AGENTS.md:**
- Shared across team - governance rules apply
- Could add templates: "Add a new section" → inserts markdown template

**USER.md:**
- Contains personal info - should be read-only or user-editable only
- Privacy warning: "This file may contain sensitive data"

**TOOLS.md:**
- Tool-specific configs - validate against available skills
- Could auto-generate from installed skills

**HEARTBEAT.md:**
- Task checklist format - could provide UI for adding tasks
- Syntax: checkbox items `- [ ] Check email every 2h`

**openclaw.json:**
- High-risk file (agent config, API keys, etc.)
- Admin-only, JSON schema validation required
- Consider separate UI (form-based instead of raw JSON)

---

## 🔗 Related Features

**Synergies with other features:**

1. **Activity Feed (Phase 3.1):**
   - Config changes appear in activity feed
   - Click activity → jump to config editor

2. **Agent Health Dashboard (Phase 3.3):**
   - Link to config editor from agent cards
   - "Edit config" button on agent details page

3. **Notification Center (Phase 3.3):**
   - Notify team when agent configs are changed
   - Subscribe to config change alerts

4. **Agent Marketplace (Phase 4.3):**
   - Install agent → auto-populate config files
   - Templates for new agents

---

**Status:** ✅ Ready for roadmap integration  
**Estimated Delivery:** Phase 3.3 (Week 12-13)  
**Confidence:** High (80%)

---

## 🚦 Decision Matrix

| Criteria | Score | Notes |
|----------|-------|-------|
| **Value** | 9/10 | High team usability improvement |
| **Effort** | 6/10 | Moderate (8-11 days) |
| **Risk** | 5/10 | Medium (security, data loss) |
| **Dependencies** | 8/10 | Low - most infrastructure exists |
| **Strategic Fit** | 9/10 | Aligns with Phase 3 collaboration focus |
| **User Demand** | 8/10 | Requested by team lead |

**Overall Priority:** **8.3/10** → **HIGH PRIORITY, PHASE 3.3**
