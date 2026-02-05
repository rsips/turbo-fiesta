// Agent API routes

import { Router, Request, Response } from 'express';
import { gatewayClient } from '../services/gateway';
import { gatewayRealClient } from '../services/gatewayReal';
import { transformSessions } from '../services/transformer';
import { transformSessionsReal } from '../services/transformerReal';
import { getMockSessions } from '../services/mockData';
import { cache } from '../utils/cache';
import { logger } from '../utils/logger';
import { config } from '../config';
import { AgentsResponse, AgentResponse } from '../types/agent';
import { requireRole } from '../middleware/auth';
import { logAuditEvent } from '../middleware/auditLogger';

const router = Router();

// Role-based access control:
// - GET (viewing): all authenticated users
// - POST (control actions): admin or operator only

// Environment flag to use mock data
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';

/**
 * GET /api/agents
 * List all agents with optional filtering and sorting
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Check cache
    const cacheKey = 'agents';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      logger.debug('Returning cached agents data');
      return res.json(cached);
    }

    logger.info('Fetching agents from Gateway');

    let agents;
    
    if (USE_MOCK_DATA) {
      logger.info('Using mock data (USE_MOCK_DATA=true)');
      const sessions = getMockSessions();
      agents = transformSessions(sessions);
    } else {
      // Fetch from real Gateway using CLI
      logger.info('Fetching from real Gateway using CLI');
      const sessions = await gatewayRealClient.getSessions();
      agents = transformSessionsReal(sessions);
    }

    const response: AgentsResponse = {
      success: true,
      data: {
        agents,
        count: agents.length,
        timestamp: new Date().toISOString(),
      },
    };

    // Cache for 5 seconds
    cache.set(cacheKey, response, config.cache.ttlSeconds);

    res.json(response);
  } catch (error: any) {
    logger.error('Failed to fetch agents', { error: error.message });

    const errorCode = error.message?.startsWith('GATEWAY_') 
      ? error.message.split(':')[0]
      : 'INTERNAL_ERROR';

    const response: AgentsResponse = {
      success: false,
      data: {
        agents: [],
        count: 0,
        timestamp: new Date().toISOString(),
      },
      error: {
        code: errorCode,
        message: 'Unable to fetch agent data from OpenClaw Gateway',
        details: error.message,
      },
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/agents/:id
 * Get detailed information for a specific agent
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    logger.info('Fetching agent details', { id });

    let agents;
    
    if (USE_MOCK_DATA) {
      const sessions = getMockSessions();
      agents = transformSessions(sessions);
    } else {
      const sessions = await gatewayRealClient.getSessions();
      agents = transformSessionsReal(sessions);
    }

    // Find the requested agent
    const searchId = typeof id === 'string' ? id : id[0];
    const agent = agents.find(a => 
      a.id === searchId || 
      a.session_id === searchId || 
      a.name.toLowerCase().includes(searchId.toLowerCase())
    );

    if (!agent) {
      const response: AgentResponse = {
        success: false,
        error: {
          code: 'AGENT_NOT_FOUND',
          message: 'Agent not found or no longer active',
          details: `No agent found with ID: ${id}`,
        },
      };
      return res.status(404).json(response);
    }

    const response: AgentResponse = {
      success: true,
      data: agent,
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Failed to fetch agent details', { error: error.message });

    const response: AgentResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unable to fetch agent details',
        details: error.message,
      },
    };

    res.status(500).json(response);
  }
});

/**
 * POST /api/agents/:id/stop
 * Get heartbeat status for an agent (read-only for now)
 * 
 * Note: OpenClaw doesn't expose a direct API to disable agent heartbeats.
 * Heartbeat control is done via CLI: `openclaw system heartbeat disable`
 * or by modifying the agent's HEARTBEAT.md file.
 * 
 * Requires: admin or operator role
 */
router.post('/:id/stop', requireRole(['admin', 'operator']), async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

    logger.info('Checking agent heartbeat status', { id });

    // Extract agentId from session ID (format: agent:agentId:channel:...)
    const agentId = extractAgentId(id);
    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AGENT_ID',
          message: 'Invalid agent ID format',
          details: 'Could not extract agent ID from session ID',
        },
      });
    }

    if (!USE_MOCK_DATA) {
      // Get Gateway status to check heartbeat settings
      const status = await gatewayRealClient.getStatus();
      
      // Verify agent exists
      const sessions = await gatewayRealClient.getSessions();
      const agentExists = sessions.some(s => s.agentId === agentId);
      
      if (!agentExists) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'AGENT_NOT_FOUND',
            message: 'Agent not found',
            details: `No agent found with ID: ${agentId}`,
          },
        });
      }

      // Find heartbeat settings for this agent
      const heartbeatAgent = status.heartbeat?.agents?.find((a: any) => a.agentId === agentId);
      const isEnabled = heartbeatAgent?.enabled || false;

      // Audit: agent stop action
      await logAuditEvent(
        req,
        'agent.stop',
        `agent:${agentId}`,
        'success',
        `Checked stop status for agent ${agentId}`
      );

      logger.info('Agent heartbeat status retrieved', { agentId, isEnabled });

      res.json({
        success: true,
        data: {
          agentId,
          action: 'stop-check',
          heartbeatEnabled: isEnabled,
          heartbeatInterval: heartbeatAgent?.every || 'disabled',
          message: isEnabled 
            ? 'Agent heartbeat is currently enabled. Use CLI to disable: openclaw system heartbeat disable'
            : 'Agent heartbeat is already disabled',
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      // Mock mode - also audit
      await logAuditEvent(
        req,
        'agent.stop',
        `agent:${agentId}`,
        'success',
        `Checked stop status for agent ${agentId} (mock mode)`
      );

      logger.info('Mock mode: Agent heartbeat status check', { agentId });
      res.json({
        success: true,
        data: {
          agentId,
          action: 'stop-check',
          heartbeatEnabled: true,
          heartbeatInterval: '30m',
          message: 'Mock: Agent heartbeat is enabled',
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error: any) {
    logger.error('Failed to check agent status', { error: error.message });

    res.status(500).json({
      success: false,
      error: {
        code: 'STATUS_CHECK_FAILED',
        message: 'Failed to check agent heartbeat status',
        details: error.message,
      },
    });
  }
});

/**
 * POST /api/agents/:id/restart
 * Get heartbeat status for an agent (read-only for now)
 * 
 * Note: OpenClaw doesn't expose a direct API to enable agent heartbeats.
 * Heartbeat control is done via CLI: `openclaw system heartbeat enable`
 * or by adding tasks to the agent's HEARTBEAT.md file.
 * 
 * Requires: admin or operator role
 */
router.post('/:id/restart', requireRole(['admin', 'operator']), async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

    logger.info('Checking agent heartbeat status for restart', { id });

    // Extract agentId from session ID
    const agentId = extractAgentId(id);
    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AGENT_ID',
          message: 'Invalid agent ID format',
          details: 'Could not extract agent ID from session ID',
        },
      });
    }

    if (!USE_MOCK_DATA) {
      // Get Gateway status to check heartbeat settings
      const status = await gatewayRealClient.getStatus();
      
      // Verify agent exists
      const sessions = await gatewayRealClient.getSessions();
      const agentExists = sessions.some(s => s.agentId === agentId);
      
      if (!agentExists) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'AGENT_NOT_FOUND',
            message: 'Agent not found',
            details: `No agent found with ID: ${agentId}`,
          },
        });
      }

      // Find heartbeat settings for this agent
      const heartbeatAgent = status.heartbeat?.agents?.find((a: any) => a.agentId === agentId);
      const isEnabled = heartbeatAgent?.enabled || false;

      // Audit: agent restart action
      await logAuditEvent(
        req,
        'agent.restart',
        `agent:${agentId}`,
        'success',
        `Checked restart status for agent ${agentId}`
      );

      logger.info('Agent heartbeat status retrieved for restart', { agentId, isEnabled });

      res.json({
        success: true,
        data: {
          agentId,
          action: 'restart-check',
          heartbeatEnabled: isEnabled,
          heartbeatInterval: heartbeatAgent?.every || 'disabled',
          message: isEnabled
            ? 'Agent heartbeat is already enabled'
            : 'Agent heartbeat is disabled. Use CLI to enable: openclaw system heartbeat enable',
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      // Mock mode - also audit
      await logAuditEvent(
        req,
        'agent.restart',
        `agent:${agentId}`,
        'success',
        `Checked restart status for agent ${agentId} (mock mode)`
      );

      logger.info('Mock mode: Agent restart check', { agentId });
      res.json({
        success: true,
        data: {
          agentId,
          action: 'restart-check',
          heartbeatEnabled: false,
          heartbeatInterval: 'disabled',
          message: 'Mock: Agent heartbeat can be enabled',
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error: any) {
    logger.error('Failed to check agent status for restart', { error: error.message });

    res.status(500).json({
      success: false,
      error: {
        code: 'STATUS_CHECK_FAILED',
        message: 'Failed to check agent heartbeat status',
        details: error.message,
      },
    });
  }
});

/**
 * POST /api/agents/:id/message
 * Send a message to a specific agent session
 * 
 * Requires: admin or operator role
 */
router.post('/:id/message', requireRole(['admin', 'operator']), async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MESSAGE',
          message: 'Message is required and must be a non-empty string',
          details: 'Request body must include { "message": "text" }',
        },
      });
    }

    logger.info('Sending message to agent', { id, messageLength: message.length });

    if (!USE_MOCK_DATA) {
      // Verify agent/session exists first
      const sessions = await gatewayRealClient.getSessions();
      const session = sessions.find(s => s.key === id || s.sessionId === id);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Agent session not found',
            details: `No session found with ID: ${id}`,
          },
        });
      }

      // Send message to the session
      const result = await gatewayRealClient.sendMessage(session.sessionId, message);

      // Audit: agent message sent
      await logAuditEvent(
        req,
        'agent.message',
        `agent:${session.agentId}`,
        'success',
        `Sent message to agent (${message.length} chars)`
      );

      logger.info('Message sent successfully', { sessionId: session.sessionId });

      res.json({
        success: true,
        data: {
          sessionId: session.sessionId,
          agentId: session.agentId,
          action: 'message',
          result: result.message,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      // Mock mode - also audit
      await logAuditEvent(
        req,
        'agent.message',
        `agent:${id}`,
        'success',
        `Sent message to agent (${message.length} chars) (mock mode)`
      );

      logger.info('Mock mode: Message send simulated', { id });
      res.json({
        success: true,
        data: {
          sessionId: id,
          action: 'message',
          result: 'Mock: Message sent to agent',
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error: any) {
    logger.error('Failed to send message', { error: error.message });

    res.status(500).json({
      success: false,
      error: {
        code: 'MESSAGE_FAILED',
        message: 'Failed to send message to agent',
        details: error.message,
      },
    });
  }
});

/**
 * GET /api/agents/:id/settings
 * Get agent configuration settings (read-only)
 * 
 * Note: Agent settings are managed via CLI and config files.
 * This endpoint provides visibility into current settings.
 */
router.get('/:id/settings', async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

    logger.info('Fetching agent settings', { id });

    // Extract agentId from session ID
    const agentId = extractAgentId(id);
    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AGENT_ID',
          message: 'Invalid agent ID format',
          details: 'Could not extract agent ID from session ID',
        },
      });
    }

    if (!USE_MOCK_DATA) {
      // Get Gateway status to check settings
      const status = await gatewayRealClient.getStatus();
      
      // Verify agent exists
      const sessions = await gatewayRealClient.getSessions();
      const session = sessions.find(s => s.agentId === agentId);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'AGENT_NOT_FOUND',
            message: 'Agent not found',
            details: `No agent found with ID: ${agentId}`,
          },
        });
      }

      // Find heartbeat settings for this agent
      const heartbeatAgent = status.heartbeat?.agents?.find((a: any) => a.agentId === agentId);

      const settings = {
        agentId,
        model: session.model || status.sessions.defaults.model,
        contextTokens: session.contextTokens || status.sessions.defaults.contextTokens,
        heartbeat: {
          enabled: heartbeatAgent?.enabled || false,
          interval: heartbeatAgent?.every || 'disabled',
          intervalMs: heartbeatAgent?.everyMs || null,
        },
        session: {
          totalTokens: session.totalTokens,
          remainingTokens: session.remainingTokens,
          percentUsed: session.percentUsed,
        },
      };

      logger.info('Agent settings retrieved', { agentId, settings });

      res.json({
        success: true,
        data: {
          agentId,
          action: 'settings',
          settings,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      // Mock mode
      logger.info('Mock mode: Settings retrieval', { agentId });
      res.json({
        success: true,
        data: {
          agentId,
          action: 'settings',
          settings: {
            agentId,
            model: 'claude-sonnet-4-5',
            contextTokens: 200000,
            heartbeat: {
              enabled: true,
              interval: '30m',
              intervalMs: 1800000,
            },
            session: {
              totalTokens: 50000,
              remainingTokens: 150000,
              percentUsed: 25,
            },
          },
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error: any) {
    logger.error('Failed to fetch agent settings', { error: error.message });

    res.status(500).json({
      success: false,
      error: {
        code: 'SETTINGS_FETCH_FAILED',
        message: 'Failed to fetch agent settings',
        details: error.message,
      },
    });
  }
});

/**
 * Helper: Extract agent ID from session key or ID
 * Session format: agent:agentId:channel:...
 */
function extractAgentId(sessionKeyOrId: string): string | null {
  // If it's already just an agent ID, return it
  if (!sessionKeyOrId.includes(':')) {
    return sessionKeyOrId;
  }

  // Parse session key format: agent:agentId:channel:...
  const parts = sessionKeyOrId.split(':');
  if (parts.length >= 2 && parts[0] === 'agent') {
    return parts[1];
  }

  return null;
}

export default router;
