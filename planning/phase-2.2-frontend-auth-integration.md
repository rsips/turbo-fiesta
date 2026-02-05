# Phase 2.2: Frontend Auth API Integration

## Priority: HIGH
**Why now:** Login UI is complete, backend auth API exists. Need to connect them for end-to-end authentication flow.

---

## User Story

**As a** Mission Control user  
**I want** to log in with my credentials  
**So that** I can access the dashboard and manage agents

### Acceptance Criteria
- [ ] Login form connects to backend `/api/auth/login` endpoint
- [ ] JWT token stored securely (localStorage or httpOnly cookie)
- [ ] Auth context populated with user data on successful login
- [ ] Protected routes redirect to login when unauthenticated
- [ ] Logout functionality clears token and redirects to login
- [ ] Token refresh logic (if backend supports refresh tokens)
- [ ] Error handling for network failures and invalid credentials
- [ ] Loading states during API calls
- [ ] At least 4 integration tests:
  - Successful login flow
  - Invalid credentials error handling
  - Protected route redirect
  - Logout clears auth state

### Out of Scope (for MVP)
- "Remember me" functionality
- Social OAuth (Google, GitHub, etc.)
- Password reset flow
- Multi-factor authentication

---

## Technical Requirements

### API Integration
```typescript
// Auth service
const authService = {
  login: async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    const { token, user } = await response.json();
    return { token, user };
  },
  
  logout: () => {
    localStorage.removeItem('auth_token');
    // Clear any other auth state
  }
};
```

### Token Storage
- Store JWT in `localStorage` (key: `auth_token`)
- Include in all API requests via `Authorization: Bearer <token>` header
- Create Axios interceptor or fetch wrapper to auto-inject token

### Protected Routes
```typescript
// ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return children;
};
```

### Auth Context Updates
```typescript
interface AuthContext {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
```

---

## Dependencies
- ✅ Backend Auth API (Phase 2.1) - endpoints exist at `/api/auth/login`
- ✅ Frontend Login UI (Phase 2.1) - form exists, needs wiring

---

## UI Behavior

### Successful Login
1. User enters credentials
2. Click "Login" → button shows loading spinner
3. API call succeeds → redirect to `/dashboard`
4. Top nav shows user email/avatar

### Failed Login
1. User enters wrong password
2. Click "Login" → button shows loading spinner
3. API returns 401 → show error message below form
4. Form stays filled, user can retry

### Protected Route Access
1. Unauthenticated user visits `/dashboard`
2. Redirect to `/login` immediately
3. After login, redirect back to originally requested page

### Logout
1. User clicks "Logout" in nav
2. Clear token from storage
3. Redirect to `/login`
4. Show success toast: "Logged out successfully"

---

## Testing Strategy
1. **Unit tests:** Mock API calls, test auth context logic
2. **Integration tests:** Real API calls to test backend (local)
3. **Manual QA:**
   - Happy path: login → dashboard → logout
   - Invalid credentials
   - Network failure (disconnect network)
   - Token expiration handling
   - Browser refresh (token persists)

---

## API Contract (Backend)

### POST `/api/auth/login`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

**Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

---

## Success Metrics
- User can log in successfully
- Token persists across page refreshes
- Protected routes enforce authentication
- All tests passing
- No console errors during auth flow

---

## Notes
This completes the authentication loop end-to-end. After this, we can build the main dashboard layout (Phase 2.3) knowing auth is fully functional.

**Estimated effort:** Small-Medium (1-2 days)  
**Business value:** HIGH - Auth must work before anything else
