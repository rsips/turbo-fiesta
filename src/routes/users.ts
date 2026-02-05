// User Management Routes (Admin Only)

import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { userStore } from '../services/userStore';
import { requireRole } from '../middleware/auth';
import { logAuditEvent } from '../middleware/auditLogger';
import { UserRole, AuthResponse } from '../types/auth';
import { logger } from '../utils/logger';

const router = Router();

const VALID_ROLES: UserRole[] = ['admin', 'operator', 'viewer'];

// All routes in this file require admin role
router.use(requireRole(['admin']));

/**
 * GET /api/users
 * List all users (admin only)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await userStore.listUsers();
    
    logger.info('Admin listed all users', { 
      adminId: req.user!.userId,
      count: users.length,
    });

    const response: AuthResponse = {
      success: true,
      data: {
        users,
        count: users.length,
      } as any,
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Failed to list users', { error: error.message });
    const response: AuthResponse = {
      success: false,
      error: {
        code: 'LIST_USERS_FAILED',
        message: 'Failed to list users',
        details: error.message,
      },
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/users/:id
 * Get single user details (admin only)
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    const user = await userStore.findById(id);

    if (!user) {
      const response: AuthResponse = {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          details: `No user with ID: ${id}`,
        },
      };
      return res.status(404).json(response);
    }

    logger.info('Admin retrieved user details', { 
      adminId: req.user!.userId,
      targetUserId: id,
    });

    // Return public user info (without password)
    const { password, ...publicUser } = user;

    const response: AuthResponse = {
      success: true,
      data: {
        user: publicUser,
      },
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Failed to get user', { error: error.message });
    const response: AuthResponse = {
      success: false,
      error: {
        code: 'GET_USER_FAILED',
        message: 'Failed to get user',
        details: error.message,
      },
    };
    res.status(500).json(response);
  }
});

/**
 * PUT /api/users/:id/role
 * Update user role (admin only)
 */
router.put(
  '/:id/role',
  [
    body('role')
      .notEmpty()
      .withMessage('Role is required')
      .isIn(VALID_ROLES)
      .withMessage(`Role must be one of: ${VALID_ROLES.join(', ')}`),
  ],
  async (req: Request, res: Response) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMsg = errors.array().map(e => e.msg).join(', ');
        const isRoleInvalid = errorMsg.toLowerCase().includes('role must be');
        
        const response: AuthResponse = {
          success: false,
          error: {
            code: isRoleInvalid ? 'INVALID_ROLE' : 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errorMsg,
          },
        };
        return res.status(400).json(response);
      }

      const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
      const { role } = req.body as { role: UserRole };

      // Check if user exists
      const user = await userStore.findById(id);
      if (!user) {
        const response: AuthResponse = {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            details: `No user with ID: ${id}`,
          },
        };
        return res.status(404).json(response);
      }

      // Prevent admin from demoting themselves
      if (id === req.user!.userId && role !== 'admin') {
        const response: AuthResponse = {
          success: false,
          error: {
            code: 'CANNOT_DEMOTE_SELF',
            message: 'Cannot demote yourself',
            details: 'Admins cannot change their own role to a lower privilege level',
          },
        };
        return res.status(400).json(response);
      }

      // Update the role
      const updatedUser = await userStore.updateUser(id, { role });

      // Audit: role change
      await logAuditEvent(
        req,
        'user.role.changed',
        `user:${id}`,
        'success',
        `Changed role from ${user.role} to ${role} for user ${user.username}`
      );

      logger.info('Admin updated user role', {
        adminId: req.user!.userId,
        targetUserId: id,
        oldRole: user.role,
        newRole: role,
      });

      const response: AuthResponse = {
        success: true,
        data: {
          user: updatedUser || undefined,
          message: `User role updated from ${user.role} to ${role}`,
        },
      };

      res.json(response);
    } catch (error: any) {
      logger.error('Failed to update user role', { error: error.message });
      const response: AuthResponse = {
        success: false,
        error: {
          code: 'UPDATE_ROLE_FAILED',
          message: 'Failed to update user role',
          details: error.message,
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * DELETE /api/users/:id
 * Delete a user (admin only)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

    // Prevent admin from deleting themselves
    if (id === req.user!.userId) {
      const response: AuthResponse = {
        success: false,
        error: {
          code: 'CANNOT_DELETE_SELF',
          message: 'Cannot delete yourself',
          details: 'Admins cannot delete their own account',
        },
      };
      return res.status(400).json(response);
    }

    // Check if user exists
    const user = await userStore.findById(id);
    if (!user) {
      const response: AuthResponse = {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          details: `No user with ID: ${id}`,
        },
      };
      return res.status(404).json(response);
    }

    // Delete the user
    const deleted = await userStore.deleteUser(id);

    // Audit: user deletion
    await logAuditEvent(
      req,
      'user.deleted',
      `user:${id}`,
      'success',
      `Deleted user ${user.username}`
    );

    logger.info('Admin deleted user', {
      adminId: req.user!.userId,
      deletedUserId: id,
      deletedUsername: user.username,
    });

    const response: AuthResponse = {
      success: true,
      data: {
        message: `User ${user.username} has been deleted`,
      },
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Failed to delete user', { error: error.message });
    const response: AuthResponse = {
      success: false,
      error: {
        code: 'DELETE_USER_FAILED',
        message: 'Failed to delete user',
        details: error.message,
      },
    };
    res.status(500).json(response);
  }
});

export { router as usersRouter };
