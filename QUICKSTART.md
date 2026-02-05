# Quick Start Guide

Get the Mission Control Frontend running in 3 minutes.

## Prerequisites

- Node.js 18+ installed
- Backend API running on port 8080

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Start Development Server

```bash
npm run dev
```

The app will open at **http://localhost:3000**

## Step 3: Verify Backend Connection

The frontend needs the backend API running:

```bash
# In a separate terminal, check backend status:
curl http://localhost:8080/health

# Expected response:
# {"status":"ok","timestamp":"...","gateway":"..."}
```

If backend is not running:

```bash
cd ../backend
npm install
npm run dev
```

## You're Done! 🎉

Visit **http://localhost:3000** to see the dashboard.

## Quick Test

1. Dashboard loads with agent list
2. Search for an agent by name
3. Filter by status (try "Busy")
4. Click an agent row to see details
5. Watch the data auto-refresh every 5 seconds

## Common Issues

**"Cannot connect to API"**
- Backend not running → Start backend: `cd ../backend && npm run dev`
- Wrong port → Check backend is on 8080

**Empty agent list**
- No agents running → Backend should have mock data
- Check: `curl http://localhost:8080/api/agents`

**Build errors**
- Delete node_modules: `rm -rf node_modules`
- Reinstall: `npm install`

## Build for Production

```bash
npm run build
```

Built files will be in `dist/` directory.

## Next Steps

- Read full [README.md](./README.md) for details
- Check [DELIVERABLES.md](./DELIVERABLES.md) for feature list
- Review [manual testing checklist](./README.md#manual-testing-checklist)

---

**Need help?** Check the [Troubleshooting section](./README.md#troubleshooting) in README.md
