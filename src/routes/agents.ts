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

const router = Router();

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

export default router;
