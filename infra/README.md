# Mission Control - Infrastructure & Deployment

This directory contains all deployment scripts, configuration, and documentation for Mission Control staging environment.

## 🚀 Quick Start

```bash
# First-time deployment
./deploy-simple.sh

# Access application
open http://localhost:8080
```

That's it! The application is now running.

## 📁 Files

### Deployment Scripts
- **`deploy-simple.sh`** - Main deployment script (builds, configures, starts)
- **`start-staging.sh`** - Start the server
- **`stop-staging.sh`** - Stop the server
- **`restart-staging.sh`** - Restart the server
- **`status.sh`** - Check server status
- **`test-deployment.sh`** - Run deployment tests

### Documentation
- **`README.md`** - This file
- **`DEPLOYMENT.md`** - Complete deployment guide
- **`DEPLOYMENT_SUMMARY.md`** - Deployment summary & architecture
- **`QUICKSTART.md`** - Quick reference guide

### Configuration
- **`.env.staging`** - Staging environment template
- **`deploy-staging.sh`** - Systemd deployment (requires systemd)

## 🛠️ Common Commands

```bash
# Deploy/Redeploy
./deploy-simple.sh

# Server management
./start-staging.sh      # Start
./stop-staging.sh       # Stop
./restart-staging.sh    # Restart

# Monitoring
./status.sh                          # Status check
tail -f ../backend/staging.log       # View logs
tail -f ../backend/staging-error.log # View errors

# Testing
./test-deployment.sh    # Run tests
curl http://localhost:8080/health | jq  # Health check
```

## 📖 Documentation

- **New to deployment?** → Start with `QUICKSTART.md`
- **Need full guide?** → Read `DEPLOYMENT.md`
- **Want architecture overview?** → See `DEPLOYMENT_SUMMARY.md`

## 🎯 Access

- **Application:** http://localhost:8080
- **Health Check:** http://localhost:8080/health
- **API Base:** http://localhost:8080/api

## 🔐 Login

Create an admin user:
```bash
cd ../backend
npm run create-admin
```

Or check existing users:
```bash
cat ../backend/data/users.json | jq '.[] | {username, role}'
```

## 🏥 Health Check

```bash
curl -s http://localhost:8080/health | jq
```

Expected: `"status": "ok"`

## 🔄 Update Workflow

1. Make changes in `backend/` or `frontend/`
2. Run `./deploy-simple.sh`
3. Verify with `./status.sh`

## 🐛 Troubleshooting

**Server won't start:**
```bash
tail -30 ../backend/staging-error.log
ss -tuln | grep 8080
pkill -f "node.*server.js"
rm ../backend/staging.pid
```

**Need help?** See `DEPLOYMENT.md` for detailed troubleshooting.

## 📊 Status Check

```bash
./status.sh
```

Shows:
- Server process status
- Port listening status
- Health check result
- Gateway status
- Recent logs

## 🧪 Testing

```bash
# Run all tests
./test-deployment.sh

# Test API manually
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"pass"}' | jq -r .data.token)

curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/agents | jq
```

## 📁 Directory Structure

```
infra/                          # This directory
├── *.sh                        # Deployment scripts
├── *.md                        # Documentation
└── .env.staging                # Environment template

../backend/
├── dist/                       # Built backend
├── public/                     # Frontend static files (deployed here)
├── data/                       # JSON data files
├── certs/                      # TLS certificates
├── staging.log                 # App logs
├── staging-error.log           # Error logs
└── staging.pid                 # Process ID

../frontend/
└── dist/                       # Frontend build output
```

## 🎉 Success Indicators

✅ All working when:
- `./status.sh` shows server running
- `./test-deployment.sh` passes all tests
- http://localhost:8080 loads the dashboard
- Health check returns `"status": "ok"`

## 📝 Notes

- **Port:** 8080 (HTTP)
- **Process:** Background via nohup
- **Data:** JSON files in `backend/data/`
- **Logs:** `backend/staging*.log`
- **TLS:** Available but not enabled by default

## 🆘 Quick Help

```bash
# Server running?
ps aux | grep "node.*server.js"

# Port open?
ss -tuln | grep 8080

# Recent errors?
tail -20 ../backend/staging-error.log

# Full restart
./stop-staging.sh && sleep 2 && ./start-staging.sh
```

---

**Status:** ✅ Ready for use  
**Updated:** February 5, 2026  
**Version:** Phase 2 Complete
