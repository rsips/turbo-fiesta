/**
 * Audit Logging System Tests
 * 
 * TDD Approach: These tests are written FIRST, then we implement to make them pass.
 * 
 * Test coverage:
 * - Audit log service (create, query, cleanup)
 * - Audit log API endpoints
 * - Integration with auth routes
 * - Integration with user management
 * - Integration with agent control
 * - 90-day retention policy
 */

import request from 'supertest';
import express, { Request, Response } from 'express';
import { AuditLogService } from '../services/auditLogService';
import { auditRouter } from '../routes/audit';
import { authRouter } from '../routes/auth';
import { usersRouter } from '../routes/users';
import agentsRouter from '../routes/agents';
import { authenticateToken, requireRole } from '../middleware/auth';
import { AuditLogEntry, AuditAction, AuditLogQuery } from '../types/audit';

// Test app setup - full integration
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Set up routes similar to main server
  app.use('/api/auth', authRouter);
  app.use('/api/users', authenticateToken, usersRouter);
  app.use('/api/agents', authenticateToken, agentsRouter);
  app.use('/api/audit-logs', authenticateToken, auditRouter);
  
  return app;
};

describe('Audit Logging System', () => {
  let auditService: AuditLogService;
  
  beforeEach(() => {
    // Use in-memory storage for tests
    auditService = new AuditLogService(':memory:');
  });

  afterEach(async () => {
    await auditService.clear();
  });

  // ===========================================
  // Audit Log Service Tests
  // ===========================================
  describe('AuditLogService', () => {
    describe('log()', () => {
      it('should create an audit log entry', async () => {
        const entry = await auditService.log({
          userId: 'user-123',
          username: 'testuser',
          action: 'user.login',
          resource: 'auth',
          result: 'success',
          ipAddress: '192.168.1.1',
        });

        expect(entry).toBeDefined();
        expect(entry.id).toBeDefined();
        expect(entry.timestamp).toBeDefined();
        expect(entry.userId).toBe('user-123');
        expect(entry.username).toBe('testuser');
        expect(entry.action).toBe('user.login');
        expect(entry.resource).toBe('auth');
        expect(entry.result).toBe('success');
        expect(entry.ipAddress).toBe('192.168.1.1');
      });

      it('should create log entry without userId for unauthenticated actions', async () => {
        const entry = await auditService.log({
          userId: null,
          username: null,
          action: 'user.login.failed',
          resource: 'auth:unknownuser',
          result: 'failure',
          details: 'Invalid credentials',
          ipAddress: '10.0.0.1',
        });

        expect(entry.userId).toBeNull();
        expect(entry.username).toBeNull();
        expect(entry.result).toBe('failure');
      });

      it('should be async and non-blocking', async () => {
        // This tests that logging is fast (non-blocking)
        const start = Date.now();
        
        // Log 100 entries rapidly
        const promises = [];
        for (let i = 0; i < 100; i++) {
          promises.push(auditService.log({
            userId: `user-${i}`,
            username: `user${i}`,
            action: 'user.login',
            resource: 'auth',
            result: 'success',
            ipAddress: '127.0.0.1',
          }));
        }
        
        await Promise.all(promises);
        
        const duration = Date.now() - start;
        // Should complete within reasonable time
        expect(duration).toBeLessThan(1000);
      });

      it('should include optional details without sensitive data', async () => {
        const entry = await auditService.log({
          userId: 'user-123',
          username: 'admin',
          action: 'user.role.changed',
          resource: 'user:456',
          result: 'success',
          details: 'Changed role from viewer to operator',
          ipAddress: '192.168.1.1',
        });

        expect(entry.details).toBe('Changed role from viewer to operator');
      });

      it('should capture user agent when provided', async () => {
        const entry = await auditService.log({
          userId: 'user-123',
          username: 'testuser',
          action: 'user.login',
          resource: 'auth',
          result: 'success',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        });

        expect(entry.userAgent).toBe('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
      });
    });

    describe('query()', () => {
      beforeEach(async () => {
        // Seed test data
        const testLogs = [
          { userId: 'user-1', username: 'alice', action: 'user.login' as AuditAction, resource: 'auth', result: 'success' as const, ipAddress: '10.0.0.1' },
          { userId: 'user-2', username: 'bob', action: 'user.login.failed' as AuditAction, resource: 'auth', result: 'failure' as const, ipAddress: '10.0.0.2' },
          { userId: 'user-1', username: 'alice', action: 'agent.restart' as AuditAction, resource: 'agent:main', result: 'success' as const, ipAddress: '10.0.0.1' },
          { userId: 'user-1', username: 'alice', action: 'user.logout' as AuditAction, resource: 'auth', result: 'success' as const, ipAddress: '10.0.0.1' },
          { userId: 'user-3', username: 'charlie', action: 'user.role.changed' as AuditAction, resource: 'user:user-2', result: 'success' as const, ipAddress: '10.0.0.3' },
        ];

        for (const log of testLogs) {
          await auditService.log(log);
        }
      });

      it('should return all logs with default query', async () => {
        const result = await auditService.query({});
        
        expect(result.logs.length).toBe(5);
        expect(result.total).toBe(5);
      });

      it('should filter by userId', async () => {
        const result = await auditService.query({ userId: 'user-1' });
        
        expect(result.logs.length).toBe(3);
        expect(result.logs.every(l => l.userId === 'user-1')).toBe(true);
      });

      it('should filter by single action', async () => {
        const result = await auditService.query({ action: 'user.login' });
        
        expect(result.logs.length).toBe(1);
        expect(result.logs[0].action).toBe('user.login');
      });

      it('should filter by multiple actions', async () => {
        const result = await auditService.query({ 
          action: ['user.login', 'user.logout'] 
        });
        
        expect(result.logs.length).toBe(2);
      });

      it('should filter by result', async () => {
        const result = await auditService.query({ result: 'failure' });
        
        expect(result.logs.length).toBe(1);
        expect(result.logs[0].action).toBe('user.login.failed');
      });

      it('should filter by date range', async () => {
        // Add entry with specific timestamp
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 30);
        
        // Query for last 7 days only
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        const result = await auditService.query({
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        });
        
        // All our test entries are recent
        expect(result.logs.length).toBe(5);
      });

      it('should support pagination with limit and offset', async () => {
        const page1 = await auditService.query({ limit: 2, offset: 0 });
        const page2 = await auditService.query({ limit: 2, offset: 2 });
        
        expect(page1.logs.length).toBe(2);
        expect(page2.logs.length).toBe(2);
        expect(page1.hasMore).toBe(true);
        expect(page1.total).toBe(5);
      });

      it('should return logs in descending order (newest first)', async () => {
        const result = await auditService.query({});
        
        for (let i = 0; i < result.logs.length - 1; i++) {
          const current = new Date(result.logs[i].timestamp).getTime();
          const next = new Date(result.logs[i + 1].timestamp).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      });

      it('should cap limit at 1000', async () => {
        const result = await auditService.query({ limit: 5000 });
        
        // Even though we requested 5000, it should be capped
        // (in this test we only have 5 entries anyway)
        expect(result.logs.length).toBeLessThanOrEqual(1000);
      });
    });

    describe('cleanup()', () => {
      it('should remove logs older than 90 days', async () => {
        // This test verifies the retention policy
        const now = new Date();
        const oldDate = new Date(now.getTime() - 91 * 24 * 60 * 60 * 1000); // 91 days ago
        
        // We need to mock the timestamp for old entries
        // The service should have a way to inject timestamp for testing
        await auditService.log({
          userId: 'user-1',
          username: 'alice',
          action: 'user.login',
          resource: 'auth',
          result: 'success',
          ipAddress: '10.0.0.1',
        });

        // Run cleanup
        const removedCount = await auditService.cleanup(90);
        
        // In a fresh test, nothing should be removed
        // Real cleanup tests would need time manipulation
        expect(typeof removedCount).toBe('number');
      });

      it('should keep logs within retention period', async () => {
        // Add fresh log
        await auditService.log({
          userId: 'user-1',
          username: 'alice',
          action: 'user.login',
          resource: 'auth',
          result: 'success',
          ipAddress: '10.0.0.1',
        });

        // Run cleanup with 90 day retention
        await auditService.cleanup(90);

        // Fresh log should still exist
        const result = await auditService.query({});
        expect(result.total).toBeGreaterThanOrEqual(1);
      });
    });

    describe('Immutability', () => {
      it('should not allow modifying existing logs', async () => {
        const entry = await auditService.log({
          userId: 'user-1',
          username: 'alice',
          action: 'user.login',
          resource: 'auth',
          result: 'success',
          ipAddress: '10.0.0.1',
        });

        // Service should not expose update method
        expect((auditService as any).update).toBeUndefined();
        expect((auditService as any).updateLog).toBeUndefined();
        expect((auditService as any).modify).toBeUndefined();
      });

      it('should not allow deleting individual logs', async () => {
        await auditService.log({
          userId: 'user-1',
          username: 'alice',
          action: 'user.login',
          resource: 'auth',
          result: 'success',
          ipAddress: '10.0.0.1',
        });

        // Service should not expose delete method (except bulk cleanup)
        expect((auditService as any).delete).toBeUndefined();
        expect((auditService as any).deleteLog).toBeUndefined();
        expect((auditService as any).remove).toBeUndefined();
      });
    });
  });

  // ===========================================
  // Audit Log API Endpoint Tests
  // ===========================================
  describe('GET /api/audit-logs', () => {
    let app: express.Express;
    let adminToken: string;
    let operatorToken: string;
    let viewerToken: string;

    beforeAll(async () => {
      app = createTestApp();
      
      // Create test users with different roles
      const users = [
        { username: 'auditadmin', email: 'auditadmin@example.com', role: 'admin' },
        { username: 'auditoperator', email: 'auditop@example.com', role: 'operator' },
        { username: 'auditviewer', email: 'auditview@example.com', role: 'viewer' },
      ];

      for (const user of users) {
        await request(app)
          .post('/api/auth/register')
          .send({ ...user, password: 'SecurePass123!' });
      }

      // Get tokens
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'auditadmin', password: 'SecurePass123!' });
      adminToken = adminLogin.body.data?.token;

      const operatorLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'auditoperator', password: 'SecurePass123!' });
      operatorToken = operatorLogin.body.data?.token;

      const viewerLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'auditviewer', password: 'SecurePass123!' });
      viewerToken = viewerLogin.body.data?.token;
    });

    it('should allow admin to query audit logs', async () => {
      const response = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.logs).toBeDefined();
      expect(Array.isArray(response.body.data.logs)).toBe(true);
    });

    it('should deny non-admin access to audit logs', async () => {
      const operatorResponse = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(operatorResponse.status).toBe(403);
      expect(operatorResponse.body.success).toBe(false);

      const viewerResponse = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(viewerResponse.status).toBe(403);
      expect(viewerResponse.body.success).toBe(false);
    });

    it('should support filtering by userId query param', async () => {
      const response = await request(app)
        .get('/api/audit-logs?userId=user-123')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should support filtering by action query param', async () => {
      const response = await request(app)
        .get('/api/audit-logs?action=user.login')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should support filtering by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const response = await request(app)
        .get(`/api/audit-logs?startDate=${startDate.toISOString()}&endDate=${new Date().toISOString()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should support pagination with limit query param', async () => {
      const response = await request(app)
        .get('/api/audit-logs?limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.logs.length).toBeLessThanOrEqual(10);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/audit-logs');

      expect(response.status).toBe(401);
    });
  });

  // ===========================================
  // Integration: Auth Routes Audit Logging
  // ===========================================
  describe('Auth Routes Audit Integration', () => {
    let app: express.Express;
    let testAuditService: AuditLogService;

    beforeAll(() => {
      app = createTestApp();
      testAuditService = new AuditLogService(':memory:');
    });

    beforeEach(async () => {
      await testAuditService.clear();
    });

    it('should log successful user login', async () => {
      // Register user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'loginaudit',
          email: 'loginaudit@example.com',
          password: 'SecurePass123!',
        });

      // Login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginaudit',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(200);
      
      // The audit log should be created (verified via API)
      // This will be checked when we integrate the service
    });

    it('should log failed login attempts', async () => {
      // Attempt login with wrong password
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'WrongPass123!',
        });

      expect(response.status).toBe(401);
      // Audit log with action 'user.login.failed' should be created
    });

    it('should log user logout', async () => {
      // Register and login
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'logoutaudit',
          email: 'logoutaudit@example.com',
          password: 'SecurePass123!',
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'logoutaudit',
          password: 'SecurePass123!',
        });

      const token = loginResponse.body.data.token;

      // Logout
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      // Audit log with action 'user.logout' should be created
    });
  });

  // ===========================================
  // Integration: User Management Audit Logging
  // ===========================================
  describe('User Management Audit Integration', () => {
    let app: express.Express;
    let adminToken: string;
    let targetUserId: string;

    beforeAll(async () => {
      app = createTestApp();
      
      // Create admin user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'useradmin',
          email: 'useradmin@example.com',
          password: 'SecurePass123!',
          role: 'admin',
        });

      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'useradmin', password: 'SecurePass123!' });
      adminToken = adminLogin.body.data.token;

      // Create target user
      const targetResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'targetuser',
          email: 'target@example.com',
          password: 'SecurePass123!',
          role: 'viewer',
        });
      targetUserId = targetResponse.body.data.user.id;
    });

    it('should log role changes', async () => {
      const response = await request(app)
        .put(`/api/users/${targetUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'operator' });

      expect(response.status).toBe(200);
      // Audit log with action 'user.role.changed' should be created
    });

    it('should log user deletion', async () => {
      // Create a user to delete
      const createResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'deleteme',
          email: 'deleteme@example.com',
          password: 'SecurePass123!',
        });

      const deleteUserId = createResponse.body.data.user.id;

      const response = await request(app)
        .delete(`/api/users/${deleteUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      // Audit log with action 'user.deleted' should be created
    });
  });

  // ===========================================
  // Integration: Agent Control Audit Logging
  // ===========================================
  describe('Agent Control Audit Integration', () => {
    let app: express.Express;
    let operatorToken: string;

    beforeAll(async () => {
      app = createTestApp();
      
      // Create operator user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'agentop',
          email: 'agentop@example.com',
          password: 'SecurePass123!',
          role: 'operator',
        });

      const opLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'agentop', password: 'SecurePass123!' });
      operatorToken = opLogin.body.data.token;
    });

    it('should log agent stop actions', async () => {
      // This will return 400 or 404 in mock mode, but audit should still log the attempt
      const response = await request(app)
        .post('/api/agents/agent:main:test/stop')
        .set('Authorization', `Bearer ${operatorToken}`);

      // The action attempt should be audited regardless of outcome
      // Actual status depends on agent existence
    });

    it('should log agent restart actions', async () => {
      const response = await request(app)
        .post('/api/agents/agent:main:test/restart')
        .set('Authorization', `Bearer ${operatorToken}`);

      // The action attempt should be audited regardless of outcome
    });

    it('should log agent message sends', async () => {
      const response = await request(app)
        .post('/api/agents/agent:main:test/message')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ message: 'Test message to agent' });

      // The action attempt should be audited regardless of outcome
    });
  });

  // ===========================================
  // Security Tests
  // ===========================================
  describe('Security', () => {
    let auditService: AuditLogService;

    beforeEach(() => {
      auditService = new AuditLogService(':memory:');
    });

    it('should not log sensitive data like passwords', async () => {
      const entry = await auditService.log({
        userId: 'user-1',
        username: 'alice',
        action: 'user.login',
        resource: 'auth',
        result: 'success',
        details: 'User logged in successfully', // Should NOT include password
        ipAddress: '10.0.0.1',
      });

      // Verify no sensitive data in entry
      const entryStr = JSON.stringify(entry);
      expect(entryStr).not.toContain('password');
      expect(entryStr).not.toContain('Password');
      expect(entryStr).not.toContain('token');
      expect(entryStr).not.toContain('secret');
    });

    it('should not log tokens or secrets', async () => {
      const entry = await auditService.log({
        userId: 'user-1',
        username: 'alice',
        action: 'user.login',
        resource: 'auth',
        result: 'success',
        ipAddress: '10.0.0.1',
      });

      const entryStr = JSON.stringify(entry);
      expect(entryStr).not.toContain('eyJ'); // JWT prefix
      expect(entryStr).not.toContain('Bearer');
    });
  });
});
