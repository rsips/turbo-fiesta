/**
 * Authentication & Access Control Tests
 * 
 * TDD Approach: These tests are written FIRST, then we implement to make them pass.
 * 
 * Test coverage:
 * - User registration
 * - User login
 * - JWT token generation/validation
 * - Password hashing
 * - Protected route middleware
 * - Role-based access control (RBAC)
 */

import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// We'll import these once implemented
import { authRouter } from '../routes/auth';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserStore, userStore as singletonUserStore } from '../services/userStore';
import { generateToken, verifyToken } from '../utils/jwt';
import { UserRole } from '../types/auth';

// Test app setup
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  
  // Protected test route
  app.get('/api/protected', authenticateToken, (req: Request, res: Response) => {
    res.json({ message: 'Protected content', user: (req as any).user });
  });
  
  // Admin-only test route
  app.get('/api/admin', authenticateToken, requireRole(['admin']), (req: Request, res: Response) => {
    res.json({ message: 'Admin content' });
  });
  
  // Operator-only test route
  app.get('/api/operator', authenticateToken, requireRole(['admin', 'operator']), (req: Request, res: Response) => {
    res.json({ message: 'Operator content' });
  });
  
  return app;
};

describe('Authentication & Access Control', () => {
  let app: express.Express;
  let userStore: UserStore;

  beforeAll(() => {
    app = createTestApp();
    userStore = new UserStore(':memory:'); // Use in-memory for tests
  });

  afterEach(async () => {
    // Clear users between tests - clear both local and singleton stores
    await userStore.clear();
    await singletonUserStore.clear();
  });

  // ===========================================
  // User Registration Tests
  // ===========================================
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'SecurePass123!',
          role: 'viewer',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.username).toBe('testuser');
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.role).toBe('viewer');
      expect(response.body.data.user.password).toBeUndefined(); // Password should not be returned
    });

    it('should reject registration with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          // missing email and password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'not-an-email',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: '123', // Too short/weak
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with duplicate username', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test1@example.com',
          password: 'SecurePass123!',
        });

      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test2@example.com',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_EXISTS');
    });

    it('should reject registration with duplicate email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser1',
          email: 'test@example.com',
          password: 'SecurePass123!',
        });

      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          email: 'test@example.com',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_EXISTS');
    });

    it('should default role to viewer if not specified', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'defaultroleuser',
          email: 'defaultrole@example.com',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.user.role).toBe('viewer');
    });

    it('should reject invalid role', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'SecurePass123!',
          role: 'superadmin', // Invalid role
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ===========================================
  // User Login Tests
  // ===========================================
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'loginuser',
          email: 'login@example.com',
          password: 'SecurePass123!',
          role: 'operator',
        });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.username).toBe('loginuser');
      expect(response.body.data.user.role).toBe('operator');
      expect(response.body.data.expiresIn).toBe('24h');
    });

    it('should login with email instead of username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ===========================================
  // Logout Tests
  // ===========================================
  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      // Register and login first
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'logoutuser',
          email: 'logout@example.com',
          password: 'SecurePass123!',
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'logoutuser',
          password: 'SecurePass123!',
        });

      const token = loginResponse.body.data.token;

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('logged out');
    });
  });

  // ===========================================
  // JWT Token Tests
  // ===========================================
  describe('JWT Token Generation & Validation', () => {
    it('should generate a valid JWT token', () => {
      const payload = {
        userId: 'test-user-id',
        username: 'testuser',
        role: 'viewer' as UserRole,
      };

      const token = generateToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should verify a valid token', () => {
      const payload = {
        userId: 'test-user-id',
        username: 'testuser',
        role: 'admin' as UserRole,
      };

      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe('test-user-id');
      expect(decoded.username).toBe('testuser');
      expect(decoded.role).toBe('admin');
    });

    it('should reject an invalid token', () => {
      expect(() => verifyToken('invalid.token.here')).toThrow();
    });

    it('should reject an expired token', () => {
      // Generate token with very short expiration
      const payload = { userId: 'test', username: 'test', role: 'viewer' };
      const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1ms' });
      
      // Wait for expiration
      return new Promise(resolve => setTimeout(resolve, 10)).then(() => {
        expect(() => verifyToken(token)).toThrow();
      });
    });
  });

  // ===========================================
  // Password Hashing Tests
  // ===========================================
  describe('Password Hashing', () => {
    it('should hash passwords securely', async () => {
      const password = 'SecurePass123!';
      const hash = await bcrypt.hash(password, 10);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should verify correct password against hash', async () => {
      const password = 'SecurePass123!';
      const hash = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password against hash', async () => {
      const password = 'SecurePass123!';
      const hash = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare('WrongPassword', hash);
      expect(isValid).toBe(false);
    });
  });

  // ===========================================
  // Protected Route Middleware Tests
  // ===========================================
  describe('Protected Route Middleware', () => {
    let validToken: string;

    beforeEach(async () => {
      // Create user and get token
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'protecteduser',
          email: 'protected@example.com',
          password: 'SecurePass123!',
          role: 'operator',
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'protecteduser',
          password: 'SecurePass123!',
        });

      validToken = loginResponse.body.data.token;
    });

    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Protected content');
      expect(response.body.user.username).toBe('protecteduser');
    });

    it('should reject access without token', async () => {
      const response = await request(app)
        .get('/api/protected');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    it('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should reject access with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'NotBearer token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // ===========================================
  // Role-Based Access Control (RBAC) Tests
  // ===========================================
  describe('Role-Based Access Control', () => {
    let adminToken: string;
    let operatorToken: string;
    let viewerToken: string;

    beforeEach(async () => {
      // Create users with different roles
      const users = [
        { username: 'adminuser', email: 'admin@example.com', role: 'admin' },
        { username: 'operatoruser', email: 'operator@example.com', role: 'operator' },
        { username: 'vieweruser', email: 'viewer@example.com', role: 'viewer' },
      ];

      for (const user of users) {
        await request(app)
          .post('/api/auth/register')
          .send({
            ...user,
            password: 'SecurePass123!',
          });
      }

      // Get tokens
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'adminuser', password: 'SecurePass123!' });
      adminToken = adminLogin.body.data.token;

      const operatorLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'operatoruser', password: 'SecurePass123!' });
      operatorToken = operatorLogin.body.data.token;

      const viewerLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'vieweruser', password: 'SecurePass123!' });
      viewerToken = viewerLogin.body.data.token;
    });

    describe('Admin-only routes', () => {
      it('should allow admin access', async () => {
        const response = await request(app)
          .get('/api/admin')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Admin content');
      });

      it('should deny operator access to admin routes', async () => {
        const response = await request(app)
          .get('/api/admin')
          .set('Authorization', `Bearer ${operatorToken}`);

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('FORBIDDEN');
      });

      it('should deny viewer access to admin routes', async () => {
        const response = await request(app)
          .get('/api/admin')
          .set('Authorization', `Bearer ${viewerToken}`);

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('FORBIDDEN');
      });
    });

    describe('Operator routes (admin + operator access)', () => {
      it('should allow admin access', async () => {
        const response = await request(app)
          .get('/api/operator')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Operator content');
      });

      it('should allow operator access', async () => {
        const response = await request(app)
          .get('/api/operator')
          .set('Authorization', `Bearer ${operatorToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Operator content');
      });

      it('should deny viewer access to operator routes', async () => {
        const response = await request(app)
          .get('/api/operator')
          .set('Authorization', `Bearer ${viewerToken}`);

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('FORBIDDEN');
      });
    });
  });

  // ===========================================
  // User Store Tests
  // ===========================================
  describe('UserStore', () => {
    let store: UserStore;

    beforeEach(() => {
      store = new UserStore(':memory:');
    });

    afterEach(async () => {
      await store.clear();
    });

    it('should create a new user', async () => {
      const user = await store.createUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'viewer',
      });

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('viewer');
    });

    it('should find user by username', async () => {
      await store.createUser({
        username: 'findme',
        email: 'find@example.com',
        password: 'hashedpassword',
        role: 'operator',
      });

      const user = await store.findByUsername('findme');
      expect(user).toBeDefined();
      expect(user?.username).toBe('findme');
    });

    it('should find user by email', async () => {
      await store.createUser({
        username: 'emailuser',
        email: 'email@example.com',
        password: 'hashedpassword',
        role: 'admin',
      });

      const user = await store.findByEmail('email@example.com');
      expect(user).toBeDefined();
      expect(user?.email).toBe('email@example.com');
    });

    it('should find user by id', async () => {
      const created = await store.createUser({
        username: 'iduser',
        email: 'id@example.com',
        password: 'hashedpassword',
        role: 'viewer',
      });

      const user = await store.findById(created.id);
      expect(user).toBeDefined();
      expect(user?.id).toBe(created.id);
    });

    it('should return null for non-existent user', async () => {
      const user = await store.findByUsername('nonexistent');
      expect(user).toBeNull();
    });

    it('should list all users', async () => {
      await store.createUser({
        username: 'user1',
        email: 'user1@example.com',
        password: 'hash1',
        role: 'viewer',
      });
      await store.createUser({
        username: 'user2',
        email: 'user2@example.com',
        password: 'hash2',
        role: 'operator',
      });

      const users = await store.listUsers();
      expect(users).toHaveLength(2);
    });
  });
});
