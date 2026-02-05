// Agent API Key Management Routes
// These endpoints are for administrators to manage agent authentication

import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { agentKeyStore } from '../services/agentKeyStore';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// All routes require admin authentication
// TODO: Add admin role check middleware

/**
 * POST /api/agent-keys
 * Create a new agent API key
 */
router.post(
  '/',
  authenticateToken, // Must be authenticated user
  [
    body('name').isString().trim().isLength({ min: 3, max: 100 })
      .withMessage('Name must be 3-100 characters'),
    body('expiresInDays').optional().isInt({ min: 1, max: 365 })
      .withMessage('Expiration must be 1-365 days'),
    body('permissions').optional().isArray()
      .withMessage('Permissions must be an array'),
    body('metadata').optional().isObject()
      .withMessage('Metadata must be an object'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: errors.array(),
          },
        });
        return;
      }

      const { key, plainKey } = await agentKeyStore.createKey(req.body);

      logger.info('Agent API key created', { 
        keyId: key.id, 
        name: key.name,
        createdBy: req.user?.username,
      });

      res.status(201).json({
        success: true,
        data: {
          id: key.id,
          name: key.name,
          apiKey: plainKey, // ⚠️ ONLY TIME THIS IS RETURNED!
          createdAt: key.createdAt.toISOString(),
          expiresAt: key.expiresAt?.toISOString(),
          message: '⚠️ Save this API key now! It will not be shown again.',
        },
      });
    } catch (error: any) {
      logger.error('Failed to create agent API key', { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_KEY_ERROR',
          message: 'Failed to create API key',
          details: error.message,
        },
      });
    }
  }
);

/**
 * GET /api/agent-keys
 * List all agent API keys (without sensitive data)
 */
router.get(
  '/',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const keys = agentKeyStore.listKeys();
      
      res.json({
        success: true,
        data: keys.map(key => ({
          id: key.id,
          name: key.name,
          createdAt: key.createdAt,
          lastUsedAt: key.lastUsedAt,
          expiresAt: key.expiresAt,
          isActive: key.isActive,
          permissions: key.permissions,
          metadata: key.metadata,
        })),
      });
    } catch (error: any) {
      logger.error('Failed to list agent keys', { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'LIST_KEYS_ERROR',
          message: 'Failed to list API keys',
          details: error.message,
        },
      });
    }
  }
);

/**
 * GET /api/agent-keys/:id
 * Get details of a specific agent API key
 */
router.get(
  '/:id',
  authenticateToken,
  param('id').isString(),
  async (req: Request, res: Response) => {
    try {
      const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
      const key = agentKeyStore.getKey(id);
      
      if (!key) {
        res.status(404).json({
          success: false,
          error: {
            code: 'KEY_NOT_FOUND',
            message: 'Agent API key not found',
          },
        });
        return;
      }

      const { keyHash, ...keyWithoutHash } = key;
      
      res.json({
        success: true,
        data: keyWithoutHash,
      });
    } catch (error: any) {
      logger.error('Failed to get agent key', { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_KEY_ERROR',
          message: 'Failed to get API key',
          details: error.message,
        },
      });
    }
  }
);

/**
 * POST /api/agent-keys/:id/revoke
 * Revoke (deactivate) an agent API key
 */
router.post(
  '/:id/revoke',
  authenticateToken,
  param('id').isString(),
  async (req: Request, res: Response) => {
    try {
      const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
      const success = agentKeyStore.revokeKey(id);
      
      if (!success) {
        res.status(404).json({
          success: false,
          error: {
            code: 'KEY_NOT_FOUND',
            message: 'Agent API key not found',
          },
        });
        return;
      }

      logger.info('Agent API key revoked', { 
        keyId: req.params.id,
        revokedBy: req.user?.username,
      });

      res.json({
        success: true,
        message: 'Agent API key revoked successfully',
      });
    } catch (error: any) {
      logger.error('Failed to revoke agent key', { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'REVOKE_KEY_ERROR',
          message: 'Failed to revoke API key',
          details: error.message,
        },
      });
    }
  }
);

/**
 * DELETE /api/agent-keys/:id
 * Permanently delete an agent API key
 */
router.delete(
  '/:id',
  authenticateToken,
  param('id').isString(),
  async (req: Request, res: Response) => {
    try {
      const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
      const success = agentKeyStore.deleteKey(id);
      
      if (!success) {
        res.status(404).json({
          success: false,
          error: {
            code: 'KEY_NOT_FOUND',
            message: 'Agent API key not found',
          },
        });
        return;
      }

      logger.info('Agent API key deleted', { 
        keyId: req.params.id,
        deletedBy: req.user?.username,
      });

      res.json({
        success: true,
        message: 'Agent API key deleted successfully',
      });
    } catch (error: any) {
      logger.error('Failed to delete agent key', { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_KEY_ERROR',
          message: 'Failed to delete API key',
          details: error.message,
        },
      });
    }
  }
);

export default router;
