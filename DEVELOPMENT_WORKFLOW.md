# Development Workflow - Mission Control

## 🔄 Feature Development Cycle

**Complete Flow:** PM → Architect → Dev → Test → Commit → PM → ...

### 1. PM Defines Feature
- PM writes requirements and acceptance criteria
- Provides user stories and UI descriptions
- Documents in requirements folder
- Assigns to Architect for technical design

### 2. Architect Designs Solution
- Reviews requirements from PM
- Creates technical architecture document
- Defines API contracts, data models, component structure
- Documents technical decisions and tradeoffs
- Assigns to developer(s) with architecture spec

### 3. Developer Implements
- Read requirements AND architecture carefully
- Build the feature according to technical design
- Write tests
- **✅ Test thoroughly** (manual + automated)

### 4. Developer Commits
**AFTER successful testing:**
```bash
git add .
git commit -m "feat: descriptive message about what was built"
```

**Commit message format:**
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `test:` for test changes
- `refactor:` for code refactoring

### 5. Developer Notifies PM
- Send message: "Feature X is complete and tested"
- Provide brief summary of what was built
- Mention any edge cases or limitations

### 6. PM Prioritizes Next Feature
- Reviews completed work
- Decides what to build next based on:
  - Business value
  - User impact  
  - Technical dependencies
  - Effort vs. value
- Communicates priority to Architect (or directly to developer for small changes)
- Documents decision rationale

### 7. Repeat

---

## 🎯 Key Principles

**Architect Before Building**
- New features go through Architect first
- Architecture defines technical approach before coding starts
- Small changes/bug fixes can skip architecture step
- Architect ensures consistency across codebase

**Commit Regularly**
- Commit after every successful test
- Don't wait until end of day
- Smaller commits = easier to review/rollback

**PM Decides Priority**
- Developers don't self-assign next features
- PM has full context of business needs
- Ensures strategic alignment

**Test Before Committing**
- Manual testing in dev environment
- Run automated tests if available
- Check edge cases

**Clear Communication**
- Developers notify PM when done
- PM responds with next priority
- Everyone knows what's happening

---

## 📝 Example Flow

**Day 1:**
```
PM → Architect: "Define architecture for Agent List View"
Architect: *designs component structure, API contracts, state management*
Architect → Frontend Dev: "Build Agent List View - see architecture doc"
Frontend Dev: *builds feature following architecture*
Frontend Dev: *tests in browser - works!*
Frontend Dev: `git commit -m "feat: add Agent List View with status badges"`
Frontend Dev → PM: "Agent List View complete - displays agents with status, filtering works"
PM: *reviews* "Great! Next priority: Add real-time auto-refresh"
```

**Day 2:**
```
Frontend Dev: *implements auto-refresh*
Frontend Dev: *tests - 5-second polling works!*
Frontend Dev: `git commit -m "feat: add 5-second auto-refresh to Agent List"`
Frontend Dev → PM: "Auto-refresh complete - agents update every 5 seconds"
PM: "Perfect! Next: Agent detail modal..."
```

---

## 🚫 Anti-Patterns to Avoid

❌ Committing untested code  
❌ Waiting days to commit  
❌ Developers choosing their own next features  
❌ Not notifying PM when done  
❌ PM not providing clear next priorities  

✅ Test → Commit → Notify → Wait for PM → Next feature

---

**Last Updated:** 2026-02-05  
**Owner:** Robert-Jan Sips  
**Enforced by:** Agent SOUL.md configurations
