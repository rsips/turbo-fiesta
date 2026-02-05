# Mission Control Backend API Documentation

## Base URL
```
http://localhost:8080/api
```

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the `Authorization` header for protected routes:

```
Authorization: Bearer <your-jwt-token>
```

### Roles
- **admin**: Full access to all features including user management
- **operator**: Can manage agents (restart, stop, message), view logs
- **viewer**: Read-only access to dashboard and agent data

### Role-Based Access Control (RBAC)

| Endpoint | Admin | Operator | Viewer |
|----------|-------|----------|--------|
| `GET /api/agents` | ✅ | ✅ | ✅ |
| `GET /api/agents/:id` | ✅ | ✅ | ✅ |
| `GET /api/agents/:id/settings` | ✅ | ✅ | ✅ |
| `POST /api/agents/:id/stop` | ✅ | ✅ | ❌ |
| `POST /api/agents/:id/restart` | ✅ | ✅ | ❌ |
| `POST /api/agents/:id/message` | ✅ | ✅ | ❌ |
| `GET /api/users` | ✅ | ❌ | ❌ |
| `GET /api/users/:id` | ✅ | ❌ | ❌ |
| `PUT /api/users/:id/role` | ✅ | ❌ | ❌ |
| `DELETE /api/users/:id` | ✅ | ❌ | ❌ |
| `GET /api/audit-logs` | ✅ | ❌ | ❌ |
| `GET /api/audit-logs/stats` | ✅ | ❌ | ❌ |

---

## Auth Endpoints

### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "viewer"  // optional, defaults to "viewer"
}
```

**Validation:**
- `username`: 3-50 characters, alphanumeric with underscores/dashes
- `email`: Valid email format
- `password`: Minimum 8 characters
- `role`: One of `admin`, `operator`, `viewer`

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "viewer",
      "createdAt": "2026-02-05T21:00:00.000Z"
    },
    "message": "User registered successfully"
  }
}
```

**Errors:**
- `400` - Validation error (invalid input)
- `409` - User already exists (username or email taken)

---

### POST /api/auth/login
Login with credentials to get a JWT token.

**Request Body:**
```json
{
  "username": "johndoe",  // or use "email"
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "24h",
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "viewer",
      "createdAt": "2026-02-05T21:00:00.000Z"
    }
  }
}
```

**Errors:**
- `400` - Validation error (missing username/email or password)
- `401` - Invalid credentials

---

### POST /api/auth/logout
Logout current user. Requires authentication.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "User johndoe logged out successfully"
  }
}
```

---

### GET /api/auth/me
Get current user info. Requires authentication.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "viewer",
      "createdAt": "2026-02-05T21:00:00.000Z"
    }
  }
}
```

---

## Agent Endpoints (Protected - Require Authentication)

### GET /api/agents
List all agents.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "agents": [...],
    "count": 5,
    "timestamp": "2026-02-05T21:00:00.000Z"
  }
}
```

### GET /api/agents/:id
Get agent details.

**Required Role:** Any authenticated user

### POST /api/agents/:id/message
Send a message to an agent.

**Required Role:** `admin` or `operator`

### GET /api/agents/:id/settings
Get agent settings.

**Required Role:** Any authenticated user

### POST /api/agents/:id/stop
Check agent heartbeat status (stop action).

**Required Role:** `admin` or `operator`

### POST /api/agents/:id/restart
Check agent heartbeat status (restart action).

**Required Role:** `admin` or `operator`

---

## User Management Endpoints (Admin Only)

All user management endpoints require the `admin` role.

### GET /api/users
List all users.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid-1",
        "username": "admin",
        "email": "admin@example.com",
        "role": "admin",
        "createdAt": "2026-02-05T20:00:00.000Z"
      },
      {
        "id": "uuid-2",
        "username": "operator1",
        "email": "operator@example.com",
        "role": "operator",
        "createdAt": "2026-02-05T21:00:00.000Z"
      }
    ],
    "count": 2
  }
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not an admin

---

### GET /api/users/:id
Get single user details.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "operator1",
      "email": "operator@example.com",
      "role": "operator",
      "createdAt": "2026-02-05T21:00:00.000Z"
    }
  }
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not an admin
- `404` - User not found

---

### PUT /api/users/:id/role
Update a user's role.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "role": "operator"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "viewer1",
      "email": "viewer@example.com",
      "role": "operator",
      "createdAt": "2026-02-05T21:00:00.000Z"
    },
    "message": "User role updated from viewer to operator"
  }
}
```

**Errors:**
- `400` - Invalid role (`INVALID_ROLE`)
- `400` - Cannot demote yourself (`CANNOT_DEMOTE_SELF`)
- `401` - Not authenticated
- `403` - Not an admin
- `404` - User not found

---

### DELETE /api/users/:id
Delete a user.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "User viewer1 has been deleted"
  }
}
```

**Errors:**
- `400` - Cannot delete yourself (`CANNOT_DELETE_SELF`)
- `401` - Not authenticated
- `403` - Not an admin
- `404` - User not found

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": "Additional details (optional)"
  }
}
```

### Common Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `INVALID_ROLE` | 400 | Invalid role specified |
| `CANNOT_DEMOTE_SELF` | 400 | Admin cannot demote themselves |
| `CANNOT_DELETE_SELF` | 400 | Admin cannot delete themselves |
| `NO_TOKEN` | 401 | Authorization header missing |
| `INVALID_TOKEN` | 401 | Token is invalid or expired |
| `INVALID_CREDENTIALS` | 401 | Wrong username/password |
| `FORBIDDEN` | 403 | Insufficient permissions (wrong role) |
| `NOT_FOUND` | 404 | Resource not found |
| `USER_NOT_FOUND` | 404 | User not found |
| `USER_EXISTS` | 409 | Username/email already taken |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Audit Log Endpoints (Admin Only)

All audit log endpoints require the `admin` role. Audit logs track security-relevant events for accountability.

### GET /api/audit-logs
Query audit logs with optional filters.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | Filter by user ID |
| `action` | string | Filter by action (comma-separated for multiple) |
| `startDate` | ISO 8601 | Filter from date |
| `endDate` | ISO 8601 | Filter to date |
| `limit` | number | Max results (default 100, max 1000) |
| `offset` | number | Pagination offset |
| `result` | string | Filter by result: `success`, `failure`, `denied` |

**Action Types:**
| Action | Description |
|--------|-------------|
| `user.login` | Successful user login |
| `user.logout` | User logout |
| `user.login.failed` | Failed login attempt |
| `user.role.changed` | Admin changed user role |
| `user.created` | New user registered |
| `user.deleted` | User account deleted |
| `agent.stop` | Agent stop action |
| `agent.restart` | Agent restart action |
| `agent.message` | Message sent to agent |
| `agent.connected` | Agent connected |
| `agent.disconnected` | Agent disconnected |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "timestamp": "2026-02-05T21:30:00.000Z",
        "userId": "uuid-123",
        "username": "johndoe",
        "action": "user.login",
        "resource": "auth:johndoe",
        "result": "success",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0..."
      },
      {
        "timestamp": "2026-02-05T21:25:00.000Z",
        "userId": null,
        "username": "unknown",
        "action": "user.login.failed",
        "resource": "auth:unknown",
        "result": "failure",
        "details": "User not found",
        "ipAddress": "10.0.0.5"
      }
    ],
    "count": 2,
    "total": 150,
    "hasMore": true
  }
}
```

**Example Queries:**
```bash
# Get all logs (default limit 100)
curl http://localhost:8080/api/audit-logs \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Filter by user
curl "http://localhost:8080/api/audit-logs?userId=uuid-123" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Filter by action (multiple)
curl "http://localhost:8080/api/audit-logs?action=user.login,user.login.failed" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Filter by date range
curl "http://localhost:8080/api/audit-logs?startDate=2026-02-01&endDate=2026-02-05" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Paginate
curl "http://localhost:8080/api/audit-logs?limit=20&offset=40" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Filter by result (failed attempts)
curl "http://localhost:8080/api/audit-logs?result=failure" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Errors:**
- `401` - Not authenticated
- `403` - Not an admin

---

### GET /api/audit-logs/stats
Get audit log statistics for the last 24 hours.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "last24Hours": {
      "total": 47,
      "byAction": {
        "user.login": 15,
        "user.logout": 12,
        "user.login.failed": 3,
        "agent.message": 10,
        "agent.restart": 5,
        "user.role.changed": 2
      },
      "byResult": {
        "success": 44,
        "failure": 3,
        "denied": 0
      }
    }
  }
}
```

---

### Audit Log Properties

Each audit log entry contains:

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | ISO 8601 | When the event occurred |
| `userId` | string/null | User who performed the action (null for anonymous) |
| `username` | string/null | Username (for easier reading) |
| `action` | string | Type of action performed |
| `resource` | string | Target of the action (e.g., `user:123`, `agent:main`) |
| `result` | string | Outcome: `success`, `failure`, or `denied` |
| `details` | string | Additional context (no sensitive data) |
| `ipAddress` | string/null | Client IP address |
| `userAgent` | string | Client user agent |

### Security Features

- **Immutable**: Logs cannot be modified after creation
- **Append-only**: Only new logs can be added
- **No sensitive data**: Passwords, tokens, and secrets are never logged
- **90-day retention**: Old logs are automatically cleaned up
- **Async logging**: Logging doesn't block request handling

---

## Health Check

### GET /health
Check API health (no authentication required).

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-05T21:00:00.000Z",
  "gateway": "connected",
  "config": {
    "gatewayUrl": "http://localhost:18789",
    "useMockData": false
  }
}
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port |
| `JWT_SECRET` | (dev default) | Secret for JWT signing (CHANGE IN PRODUCTION!) |
| `JWT_EXPIRATION` | `24h` | Token expiration time |
| `BCRYPT_ROUNDS` | `10` | Password hashing rounds |
| `DATA_DIR` | `./data` | Directory for data storage |
| `USER_STORE_PATH` | `./data/users.json` | Path to users file (`:memory:` for testing) |
| `AUDIT_LOG_PATH` | `./data/audit-logs.json` | Path to audit logs file (`:memory:` for testing) |
| `GATEWAY_URL` | `http://localhost:18789` | OpenClaw Gateway URL |
| `USE_MOCK_DATA` | `false` | Use mock data instead of real Gateway |
| `CORS_ENABLED` | `true` | Enable CORS |
| `CORS_ORIGIN` | `*` | Allowed CORS origins |
| `LOG_LEVEL` | `info` | Logging level |

---

## Example: Complete Auth Flow

```bash
# 1. Register a new user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"SecurePass123!"}'

# 2. Login to get token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"SecurePass123!"}' | jq -r '.data.token')

# 3. Access protected route
curl http://localhost:8080/api/agents \
  -H "Authorization: Bearer $TOKEN"

# 4. Get current user info
curl http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 5. Logout
curl -X POST http://localhost:8080/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```
