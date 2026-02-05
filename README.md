# Mission Control

Real-time monitoring dashboard for OpenClaw agents. Monitor agent status, sessions, and activities across your infrastructure.

## Features

### Core Functionality
- 👀 **Agent Monitoring** - Real-time view of all active OpenClaw agents
- 📊 **Session Tracking** - Monitor active sessions and agent activities
- 💬 **Message History** - View message flows and agent interactions
- 🔄 **Real-time Updates** - WebSocket connection for live agent status
- 📱 **Responsive Design** - Works on desktop and mobile devices

### Security
- 🔐 **TLS/HTTPS Support** - Encrypted communications (self-signed for dev, Let's Encrypt for prod)
- 🔑 **Agent API Keys** - Secure agent-to-server authentication
- 🛡️ **JWT Authentication** - Secure user authentication for web UI
- 🚫 **CORS Protection** - Configurable cross-origin request filtering
- 📝 **Environment Secrets** - Secure credential management

## Architecture

```
┌─────────────────────┐
│  Mission Control    │
│    Frontend         │
│  (React + Vite)     │
└──────────┬──────────┘
           │ HTTPS
           │ WebSocket
┌──────────▼──────────┐
│  Mission Control    │
│     Backend         │
│  (Express + WS)     │
└──────────┬──────────┘
           │ Agent API Keys
           │
    ┌──────┴──────┐
    │             │
┌───▼───┐   ┌────▼────┐
│ Agent │   │  Agent  │
│   1   │   │    2    │
└───────┘   └─────────┘
```

## Quick Start

### Prerequisites
- Node.js 18+
- OpenClaw Gateway running (or use mock data)

### Development Setup

```bash
# Clone repository
git clone <repo-url>
cd mission-control

# Backend setup
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend setup (in another terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

### With HTTPS (Development)

```bash
# Generate self-signed certificates
cd backend
npm run generate-certs

# Start backend with HTTPS
npm run dev:https

# Start frontend with HTTPS (optional)
cd ../frontend
# Edit .env: VITE_TLS_ENABLED=true
npm run dev
```

## Documentation

- **[Setup Guide](docs/SETUP.md)** - Complete setup instructions for dev and production
- **[Security Guide](docs/SECURITY.md)** - TLS/HTTPS setup, agent authentication, and security best practices
- **[Agent Setup](docs/AGENT_SETUP.md)** - Configure OpenClaw agents to connect to Mission Control

## Project Structure

```
mission-control/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── server.ts       # Main server entry point
│   │   ├── config/         # Configuration
│   │   ├── routes/         # API routes
│   │   │   ├── auth.ts     # User authentication
│   │   │   ├── agents.ts   # Agent data endpoints
│   │   │   └── agentKeys.ts # Agent API key management
│   │   ├── services/       # Business logic
│   │   │   ├── agentKeyStore.ts  # Agent key management
│   │   │   ├── gateway.ts  # OpenClaw Gateway client
│   │   │   └── websocket.ts # WebSocket server
│   │   ├── middleware/     # Express middleware
│   │   │   ├── auth.ts     # User authentication
│   │   │   └── agentAuth.ts # Agent authentication
│   │   └── types/          # TypeScript types
│   ├── scripts/
│   │   ├── generate-certs.sh      # TLS certificate generator
│   │   └── create-agent-key.ts    # CLI tool for agent keys
│   └── certs/              # TLS certificates (gitignored)
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   └── services/       # API clients
│   └── public/             # Static assets
└── docs/                   # Documentation
    ├── SETUP.md            # Setup guide
    ├── SECURITY.md         # Security documentation
    └── AGENT_SETUP.md      # Agent configuration guide
```

## Security

Mission Control implements multiple layers of security:

1. **TLS/HTTPS** - All communications encrypted
2. **User Authentication** - JWT-based auth for web UI
3. **Agent API Keys** - Unique keys per agent with rotation support
4. **CORS Protection** - Configurable origin restrictions
5. **Environment Secrets** - Secure credential storage

### Creating Agent API Keys

```bash
# Interactive CLI tool
cd backend
npm run create-agent-key

# OR via API (requires admin login)
curl -X POST https://mission-control.example.com/api/agent-keys \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"agent-1","expiresInDays":365}'
```

See [SECURITY.md](docs/SECURITY.md) for comprehensive security documentation.

## Production Deployment

### Quick Production Setup

```bash
# 1. Build application
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build

# 2. Configure environment
cd backend
cp .env.example .env
# Edit .env with production values (change JWT_SECRET!)

# 3. Set up reverse proxy (Caddy or Nginx)
# See docs/SETUP.md for detailed instructions

# 4. Create systemd service
sudo systemctl enable mission-control
sudo systemctl start mission-control
```

**Recommended Architecture:**
- **Reverse Proxy** (Caddy/Nginx) - TLS termination, static file serving
- **Mission Control Backend** - API and WebSocket server
- **Let's Encrypt** - Free, auto-renewing TLS certificates

See [SETUP.md](docs/SETUP.md) for detailed production deployment instructions.

## Development

### Backend Development

```bash
cd backend

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Development with hot reload
npm run dev
```

### Frontend Development

```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## API Endpoints

### User Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Agent Data (Requires JWT)
- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get agent details
- `GET /api/agents/:id/sessions` - Get agent sessions

### Agent API Key Management (Requires JWT + Admin)
- `POST /api/agent-keys` - Create new agent API key
- `GET /api/agent-keys` - List all agent keys
- `GET /api/agent-keys/:id` - Get key details
- `POST /api/agent-keys/:id/revoke` - Revoke key
- `DELETE /api/agent-keys/:id` - Delete key

### Health Check
- `GET /health` - Server health status

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Backend server port |
| `TLS_ENABLED` | `false` | Enable HTTPS |
| `TLS_CERT_PATH` | `./certs/server.crt` | TLS certificate path |
| `TLS_KEY_PATH` | `./certs/server.key` | TLS private key path |
| `JWT_SECRET` | ⚠️ **required** | JWT signing secret |
| `AGENT_AUTH_ENABLED` | `true` | Enable agent authentication |
| `GATEWAY_URL` | `http://localhost:18789` | OpenClaw Gateway URL |
| `CORS_ORIGIN` | `*` | CORS allowed origins |
| `USE_MOCK_DATA` | `false` | Use mock data (dev) |

See [.env.example](backend/.env.example) for all available options.

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | - | Backend API URL (production) |
| `VITE_BACKEND_TLS` | `false` | Backend uses HTTPS (dev) |
| `VITE_TLS_ENABLED` | `false` | Enable HTTPS on dev server |

## Troubleshooting

### Agent Authentication Fails

**Issue:** `INVALID_AGENT_KEY` error

**Solution:**
1. Verify API key is correct: `echo $MISSION_CONTROL_API_KEY`
2. Check key is active: Admin panel → Agent Keys
3. Verify key hasn't expired
4. Ensure `X-Agent-Key` header is set

### TLS/SSL Certificate Errors

**Development:** Accept self-signed certificate warning in browser

**Production:** Ensure Let's Encrypt certificate is valid and renewed

### WebSocket Connection Fails

**Solution:**
1. Check CORS settings include WebSocket upgrade
2. Verify reverse proxy WebSocket configuration
3. Check firewall allows WebSocket connections

See [SECURITY.md](docs/SECURITY.md) for more troubleshooting tips.

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

[Add your license here]

## Support

For issues and questions:
- **Documentation:** [docs/](docs/)
- **Security Issues:** See [SECURITY.md](docs/SECURITY.md)
- **Setup Help:** See [SETUP.md](docs/SETUP.md)

---

Built with ❤️ for OpenClaw infrastructure management
