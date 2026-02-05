// Authentication Routes

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { UserStore, userStore } from '../services/userStore';
import { generateToken } from '../utils/jwt';
import { authenticateToken } from '../middleware/auth';
import { UserRole, AuthResponse, RegisterRequest, LoginRequest } from '../types/auth';
import { logger } from '../utils/logger';

const router = Router();

// Password requirements
const PASSWORD_MIN_LENGTH = 8;
const BCRYPT_ROUNDS = 10;
const VALID_ROLES: UserRole[] = ['admin', 'operator', 'viewer'];

// Validation middleware
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and dashes'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  body('password')
    .isLength({ min: PASSWORD_MIN_LENGTH })
    .withMessage(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
  body('role')
    .optional()
    .isIn(VALID_ROLES)
    .withMessage(`Role must be one of: ${VALID_ROLES.join(', ')}`),
];

const loginValidation = [
  body('username').optional().trim(),
  body('email').optional().trim().isEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required'),
];

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', registerValidation, async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response: AuthResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array().map(e => e.msg).join(', '),
        },
      };
      return res.status(400).json(response);
    }

    const { username, email, password, role = 'viewer' }: RegisterRequest = req.body;

    // Check for existing user
    if (await userStore.usernameExists(username)) {
      const response: AuthResponse = {
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'Username already taken',
          details: 'Please choose a different username',
        },
      };
      return res.status(409).json(response);
    }

    if (await userStore.emailExists(email)) {
      const response: AuthResponse = {
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'Email already registered',
          details: 'Please use a different email or login with existing account',
        },
      };
      return res.status(409).json(response);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user
    const user = await userStore.createUser({
      username,
      email,
      password: hashedPassword,
      role: role as UserRole,
    });

    logger.info('User registered', { userId: user.id, username: user.username });

    const response: AuthResponse = {
      success: true,
      data: {
        user,
        message: 'User registered successfully',
      },
    };

    res.status(201).json(response);
  } catch (error: any) {
    logger.error('Registration failed', { error: error.message });
    const response: AuthResponse = {
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: 'Failed to register user',
        details: error.message,
      },
    };
    res.status(500).json(response);
  }
});

/**
 * POST /api/auth/login
 * Login with username/email and password
 */
router.post('/login', loginValidation, async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response: AuthResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array().map(e => e.msg).join(', '),
        },
      };
      return res.status(400).json(response);
    }

    const { username, email, password }: LoginRequest = req.body;

    // Must provide username or email
    if (!username && !email) {
      const response: AuthResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Username or email required',
          details: 'Provide either username or email to login',
        },
      };
      return res.status(400).json(response);
    }

    // Find user
    let user = null;
    if (username) {
      user = await userStore.findByUsername(username);
    } else if (email) {
      user = await userStore.findByEmail(email);
    }

    if (!user) {
      const response: AuthResponse = {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials',
          details: 'Username/email or password is incorrect',
        },
      };
      return res.status(401).json(response);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      logger.warn('Failed login attempt', { username: user.username });
      const response: AuthResponse = {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials',
          details: 'Username/email or password is incorrect',
        },
      };
      return res.status(401).json(response);
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    logger.info('User logged in', { userId: user.id, username: user.username });

    const response: AuthResponse = {
      success: true,
      data: {
        token,
        expiresIn: '24h',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Login failed', { error: error.message });
    const response: AuthResponse = {
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: 'Failed to login',
        details: error.message,
      },
    };
    res.status(500).json(response);
  }
});

/**
 * POST /api/auth/logout
 * Logout current user (invalidate token on client side)
 * Note: JWTs are stateless, so logout is primarily client-side
 * For enhanced security, implement token blacklisting later
 */
router.post('/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    
    logger.info('User logged out', { userId: user.userId, username: user.username });

    const response: AuthResponse = {
      success: true,
      data: {
        message: `User ${user.username} logged out successfully`,
      },
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Logout failed', { error: error.message });
    const response: AuthResponse = {
      success: false,
      error: {
        code: 'LOGOUT_FAILED',
        message: 'Failed to logout',
        details: error.message,
      },
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tokenUser = req.user!;
    
    // Fetch fresh user data from store
    const user = await userStore.findById(tokenUser.userId);
    
    if (!user) {
      const response: AuthResponse = {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          details: 'User may have been deleted',
        },
      };
      return res.status(404).json(response);
    }

    const response: AuthResponse = {
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Failed to get user info', { error: error.message });
    const response: AuthResponse = {
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to get user info',
        details: error.message,
      },
    };
    res.status(500).json(response);
  }
});

export { router as authRouter };
