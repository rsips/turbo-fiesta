# Quick Start Guide

Get the Mission Control dashboard running in 60 seconds!

## TL;DR

```bash
cd /home/sky/.openclaw/workspace/mission-control/frontend
npm install    # Already done
npm run dev    # Open http://localhost:3000
```

That's it! You'll see 7 mock agents in the dashboard.

## What You Get

✅ Real-time agent status dashboard  
✅ Search and filter agents  
✅ Sort by any column  
✅ Auto-refresh every 5 seconds  
✅ Click agents for details  
✅ Fully functional with mock data  

## Available Commands

```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Connect to Backend

When your backend is ready:

1. Open `src/api/client.ts`
2. Change line 6: `const USE_MOCK_DATA = false;`
3. Ensure backend runs on `http://localhost:8080`
4. Refresh browser

## Features to Try

- **Search:** Type in the search box to filter by name
- **Filter:** Select a status from dropdown
- **Sort:** Click any column header
- **Refresh:** Click refresh button or watch auto-refresh
- **Details:** Click any agent row to see full details
- **Copy ID:** Click copy button in modal to copy session ID

## Mock Data

Default mock includes:
- 1 Main Agent (busy)
- 1 Architect (online)
- 1 PM (busy)
- 1 Frontend Dev (busy) - that's me!
- 1 Backend Dev (offline)
- 1 System Monitor (error)
- 1 Scheduler (online)

## Project Structure

```
src/
├── components/      # React components
├── api/            # API client (toggle mock here)
├── mocks/          # Sample data
├── types/          # TypeScript types
└── utils/          # Formatting & sorting
```

## Documentation

- **Full docs:** See `README.md`
- **Status:** See `PROJECT_STATUS.md`
- **Deliverables:** See `DELIVERABLES.md`

## Troubleshooting

**Port 3000 in use?**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Dependencies issue?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Build fails?**
```bash
npm run build
# Check error message, likely TypeScript error
```

## Next Steps

1. ✅ Run dev server → See mock agents
2. ✅ Try all features → Verify they work
3. ⏳ Connect to backend → Toggle mock off
4. ⏳ Integration test → Test with real data
5. ⏳ Deploy → Build and serve

## Support

Questions? Check the docs or contact:
- Frontend Developer Agent
- Orchestrator

---

**Have fun! The dashboard is fully functional.** 🚀
