// Agent Authentication Middleware

import { Request, Response, NextFunction } from 'express';
import { agentKeyStore } from '../services/agentKeyStore';
import { logger } from '../utils/logger';

// Extend Express Request to include agent info
declare global {
  namespace Express {
    interface Request {
      agent?: {
        id: string;
        name: string;
        permissions?: string[];
        metadata?: Record<string, any>;
      };
    }
  }
}

/**
 * Middleware to authenticate agent API requests
 * Expects API key in X-Agent-Key header
 */
export const authenticateAgent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract API key from header
    const apiKey = req.headers['x-agent-key'] as string;
    
    if (!apiKey) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AGENT_AUTH_REQUIRED',
          message: 'Agent API key required',
          details: 'Include X-Agent-Key header with your agent API key',
        },
      });
      return;
    }

    // Validate the API key
    const result = await agentKeyStore.validateKey(apiKey);
    
    if (!result.valid || !result.agent) {
      logger.warn('Invalid agent API key attempt', { 
        ip: req.ip,
        path: req.path,
      });
      
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_AGENT_KEY',
          message: 'Invalid or expired agent API key',
          details: result.error || 'The provided API key is not valid',
        },
      });
      return;
    }

    // Attach agent info to request
    req.agent = {
      id: result.agent.id,
      name: result.agent.name,
      permissions: result.agent.permissions,
      metadata: result.agent.metadata,
    };

    logger.debug('Agent authenticated', { 
      agentId: req.agent.id, 
      agentName: req.agent.name,
      path: req.path,
    });

    next();
  } catch (error: any) {
    logger.error('Agent authentication error', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error',
        details: error.message,
      },
    });
  }
};

/**
 * Optional agent authentication - doesn't reject if no key provided
 * Useful for endpoints that work for both agents and users
 */
export const optionalAgentAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const apiKey = req.headers['x-agent-key'] as string;
  
  if (apiKey) {
    try {
      const result = await agentKeyStore.validateKey(apiKey);
      if (result.valid && result.agent) {
        req.agent = {
          id: result.agent.id,
          name: result.agent.name,
          permissions: result.agent.permissions,
          metadata: result.agent.metadata,
        };
      }
    } catch (error) {
      // Silently fail for optional auth
      logger.debug('Optional agent auth failed', { error });
    }
  }
  
  next();
};
