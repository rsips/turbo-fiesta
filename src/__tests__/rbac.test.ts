/**
 * Role-Based Access Control (RBAC) Tests
 * 
 * TDD Approach: Tests written FIRST, then implementation.
 * 
 * Test Coverage:
 * - Role validation (admin, operator, viewer)
 * - User role management (admin only)
 * - Role-based route protection
 * - Permission checks for different actions
 */

import request from 'supertest';
import express, { Request, Response } from 'express';
import { authRouter } from '../routes/auth';
import { usersRouter } from '../routes/users';
import { authenticateToken, requireRole } from '../middleware/auth';
import { userStore } from '../services/userStore';
import { UserRole } from '../types/auth';

// Test app setup with all routes
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.use('/api/users', authenticateToken, usersRouter);
  
  // Test routes for role verification
  app.get('/api/test/viewer', authenticateToken, (req: Request, res: Response) => {
    res.json({ message: 'All authenticated users can see this', user: req.user });
  });
  
  app.get('/api/test/operator', authenticateToken, requireRole(['admin', 'operator']), (req: Request, res: Response) => {
    res.json({ message: 'Operators and admins only' });
  });
  
  app.get('/api/test/admin', authenticateToken, requireRole(['admin']), (req: Request, res: Response) => {
    res.json({ message: 'Admins only' });
  });
  
  // Simulated agent control routes with RBAC
  app.post('/api/test/agents/:id/restart', authenticateToken, requireRole(['admin', 'operator']), (req: Request, res: Response) => {
    res.json({ message: 'Agent restart initiated', agentId: req.params.id });
  });
  
  app.post('/api/test/agents/:id/kill', authenticateToken, requireRole(['admin', 'operator']), (req: Request, res: Response) => {
    res.json({ message: 'Agent killed', agentId: req.params.id });
  });
  
  app.get('/api/test/agents', authenticateToken, (req: Request, res: Response) => {
    res.json({ message: 'Agent list', agents: [] });
  });
  
  return app;
};

describe('Role-Based Access Control (RBAC)', () => {
  let app: express.Express;
  let adminToken: string;
  let operatorToken: string;
  let viewerToken: string;
  let adminUserId: string;
  let operatorUserId: string;
  let viewerUserId: string;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    // Clear users before each test
    await userStore.clear();
    
    // Create users with different roles
    const users = [
      { username: 'rbac_admin', email: 'rbac_admin@test.com', role: 'admin' as UserRole },
      { username: 'rbac_operator', email: 'rbac_operator@test.com', role: 'operator' as UserRole },
      { username: 'rbac_viewer', email: 'rbac_viewer@test.com', role: 'viewer' as UserRole },
    ];

    for (const user of users) {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          ...user,
          password: 'TestPass123!',
        });
      
      if (user.role === 'admin') adminUserId = registerRes.body.data.user.id;
      if (user.role === 'operator') operatorUserId = registerRes.body.data.user.id;
      if (user.role === 'viewer') viewerUserId = registerRes.body.data.user.id;
    }

    // Get tokens for each role
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'rbac_admin', password: 'TestPass123!' });
    adminToken = adminLogin.body.data.token;

    const operatorLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'rbac_operator', password: 'TestPass123!' });
    operatorToken = operatorLogin.body.data.token;

    const viewerLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'rbac_viewer', password: 'TestPass123!' });
    viewerToken = viewerLogin.body.data.token;
  });

  afterEach(async () => {
    await userStore.clear();
  });

  // ===========================================
  // Role Validation Tests
  // ===========================================
  describe('Role Validation', () => {
    it('should recognize valid roles: admin, operator, viewer', async () => {
      const validRoles: UserRole[] = ['admin', 'operator', 'viewer'];
      
      for (const role of validRoles) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: `role_test_${role}`,
            email: `role_test_${role}@test.com`,
            password: 'TestPass123!',
            role,
          });
        
        expect(response.status).toBe(201);
        expect(response.body.data.user.role).toBe(role);
      }
    });

    it('should reject invalid roles', async () => {
      const invalidRoles = ['superadmin', 'root', 'user', 'guest', ''];
      
      for (const role of invalidRoles) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: `invalid_role_${role || 'empty'}`,
            email: `invalid_role_${role || 'empty'}@test.com`,
            password: 'TestPass123!',
            role,
          });
        
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    });

    it('should include role in JWT token payload', async () => {
      // Login and decode token to verify role is included
      const response = await request(app)
        .get('/api/test/viewer')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe('admin');
    });
  });

  // ===========================================
  // User Management - List Users (Admin Only)
  // ===========================================
  describe('GET /api/users - List All Users', () => {
    it('should allow admin to list all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeDefined();
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.users.length).toBe(3); // admin, operator, viewer
      
      // Verify password is not exposed
      response.body.data.users.forEach((user: any) => {
        expect(user.password).toBeUndefined();
      });
    });

    it('should deny operator access to list users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${operatorToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should deny viewer access to list users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${viewerToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should deny unauthenticated access to list users', async () => {
      const response = await request(app)
        .get('/api/users');
      
      expect(response.status).toBe(401);
    });
  });

  // ===========================================
  // User Management - Update User Role (Admin Only)
  // ===========================================
  describe('PUT /api/users/:id/role - Update User Role', () => {
    it('should allow admin to change user role', async () => {
      const response = await request(app)
        .put(`/api/users/${viewerUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'operator' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('operator');
      expect(response.body.data.user.id).toBe(viewerUserId);
    });

    it('should deny operator from changing user roles', async () => {
      const response = await request(app)
        .put(`/api/users/${viewerUserId}/role`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ role: 'admin' });
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should deny viewer from changing user roles', async () => {
      const response = await request(app)
        .put(`/api/users/${viewerUserId}/role`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ role: 'admin' });
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject invalid role in update', async () => {
      const response = await request(app)
        .put(`/api/users/${viewerUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'superadmin' });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ROLE');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/api/users/non-existent-id/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'operator' });
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should prevent admin from demoting themselves', async () => {
      const response = await request(app)
        .put(`/api/users/${adminUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'viewer' });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CANNOT_DEMOTE_SELF');
    });

    it('should require role field in request body', async () => {
      const response = await request(app)
        .put(`/api/users/${viewerUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ===========================================
  // User Management - Get Single User (Admin Only)
  // ===========================================
  describe('GET /api/users/:id - Get User Details', () => {
    it('should allow admin to get any user details', async () => {
      const response = await request(app)
        .get(`/api/users/${viewerUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(viewerUserId);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should deny operator from getting other user details', async () => {
      const response = await request(app)
        .get(`/api/users/${viewerUserId}`)
        .set('Authorization', `Bearer ${operatorToken}`);
      
      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  // ===========================================
  // User Management - Delete User (Admin Only)
  // ===========================================
  describe('DELETE /api/users/:id - Delete User', () => {
    it('should allow admin to delete a user', async () => {
      const response = await request(app)
        .delete(`/api/users/${viewerUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('deleted');
      
      // Verify user is actually deleted
      const getResponse = await request(app)
        .get(`/api/users/${viewerUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(getResponse.status).toBe(404);
    });

    it('should deny operator from deleting users', async () => {
      const response = await request(app)
        .delete(`/api/users/${viewerUserId}`)
        .set('Authorization', `Bearer ${operatorToken}`);
      
      expect(response.status).toBe(403);
    });

    it('should prevent admin from deleting themselves', async () => {
      const response = await request(app)
        .delete(`/api/users/${adminUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('CANNOT_DELETE_SELF');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(404);
    });
  });

  // ===========================================
  // Agent Routes - Role Restrictions
  // ===========================================
  describe('Agent Route Permissions', () => {
    describe('Agent Viewing (all authenticated users)', () => {
      it('should allow viewer to list agents', async () => {
        const response = await request(app)
          .get('/api/test/agents')
          .set('Authorization', `Bearer ${viewerToken}`);
        
        expect(response.status).toBe(200);
      });

      it('should allow operator to list agents', async () => {
        const response = await request(app)
          .get('/api/test/agents')
          .set('Authorization', `Bearer ${operatorToken}`);
        
        expect(response.status).toBe(200);
      });

      it('should allow admin to list agents', async () => {
        const response = await request(app)
          .get('/api/test/agents')
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(response.status).toBe(200);
      });

      it('should deny unauthenticated access', async () => {
        const response = await request(app)
          .get('/api/test/agents');
        
        expect(response.status).toBe(401);
      });
    });

    describe('Agent Control Actions (operator + admin only)', () => {
      it('should allow admin to restart agent', async () => {
        const response = await request(app)
          .post('/api/test/agents/test-agent-1/restart')
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body.message).toContain('restart');
      });

      it('should allow operator to restart agent', async () => {
        const response = await request(app)
          .post('/api/test/agents/test-agent-1/restart')
          .set('Authorization', `Bearer ${operatorToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body.message).toContain('restart');
      });

      it('should deny viewer from restarting agent', async () => {
        const response = await request(app)
          .post('/api/test/agents/test-agent-1/restart')
          .set('Authorization', `Bearer ${viewerToken}`);
        
        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe('FORBIDDEN');
      });

      it('should allow admin to kill agent', async () => {
        const response = await request(app)
          .post('/api/test/agents/test-agent-1/kill')
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body.message).toContain('killed');
      });

      it('should allow operator to kill agent', async () => {
        const response = await request(app)
          .post('/api/test/agents/test-agent-1/kill')
          .set('Authorization', `Bearer ${operatorToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body.message).toContain('killed');
      });

      it('should deny viewer from killing agent', async () => {
        const response = await request(app)
          .post('/api/test/agents/test-agent-1/kill')
          .set('Authorization', `Bearer ${viewerToken}`);
        
        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe('FORBIDDEN');
      });
    });
  });

  // ===========================================
  // requireRole Middleware Tests
  // ===========================================
  describe('requireRole Middleware', () => {
    it('should pass request to next middleware when role matches', async () => {
      const response = await request(app)
        .get('/api/test/admin')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
    });

    it('should return 403 when role does not match', async () => {
      const response = await request(app)
        .get('/api/test/admin')
        .set('Authorization', `Bearer ${viewerToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.error.message).toContain('Insufficient permissions');
    });

    it('should return 401 when no user is authenticated', async () => {
      const response = await request(app)
        .get('/api/test/admin');
      
      expect(response.status).toBe(401);
    });

    it('should allow multiple roles to pass', async () => {
      // Both admin and operator should access operator route
      const adminResponse = await request(app)
        .get('/api/test/operator')
        .set('Authorization', `Bearer ${adminToken}`);
      
      const operatorResponse = await request(app)
        .get('/api/test/operator')
        .set('Authorization', `Bearer ${operatorToken}`);
      
      expect(adminResponse.status).toBe(200);
      expect(operatorResponse.status).toBe(200);
    });

    it('should include helpful error message with required roles', async () => {
      const response = await request(app)
        .get('/api/test/admin')
        .set('Authorization', `Bearer ${viewerToken}`);
      
      expect(response.body.error.details).toContain('admin');
      expect(response.body.error.details).toContain('viewer'); // User's role
    });
  });

  // ===========================================
  // Role Hierarchy Tests
  // ===========================================
  describe('Role Hierarchy', () => {
    it('admin should have highest privileges', async () => {
      // Admin can access all routes
      const viewerRoute = await request(app)
        .get('/api/test/viewer')
        .set('Authorization', `Bearer ${adminToken}`);
      const operatorRoute = await request(app)
        .get('/api/test/operator')
        .set('Authorization', `Bearer ${adminToken}`);
      const adminRoute = await request(app)
        .get('/api/test/admin')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(viewerRoute.status).toBe(200);
      expect(operatorRoute.status).toBe(200);
      expect(adminRoute.status).toBe(200);
    });

    it('operator should have medium privileges', async () => {
      // Operator can access viewer and operator routes, but not admin
      const viewerRoute = await request(app)
        .get('/api/test/viewer')
        .set('Authorization', `Bearer ${operatorToken}`);
      const operatorRoute = await request(app)
        .get('/api/test/operator')
        .set('Authorization', `Bearer ${operatorToken}`);
      const adminRoute = await request(app)
        .get('/api/test/admin')
        .set('Authorization', `Bearer ${operatorToken}`);
      
      expect(viewerRoute.status).toBe(200);
      expect(operatorRoute.status).toBe(200);
      expect(adminRoute.status).toBe(403);
    });

    it('viewer should have lowest privileges', async () => {
      // Viewer can only access viewer routes
      const viewerRoute = await request(app)
        .get('/api/test/viewer')
        .set('Authorization', `Bearer ${viewerToken}`);
      const operatorRoute = await request(app)
        .get('/api/test/operator')
        .set('Authorization', `Bearer ${viewerToken}`);
      const adminRoute = await request(app)
        .get('/api/test/admin')
        .set('Authorization', `Bearer ${viewerToken}`);
      
      expect(viewerRoute.status).toBe(200);
      expect(operatorRoute.status).toBe(403);
      expect(adminRoute.status).toBe(403);
    });
  });
});
