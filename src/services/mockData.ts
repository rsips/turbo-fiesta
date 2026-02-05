// Mock Gateway data for development and testing

import { GatewaySession } from '../types/gateway';

const now = Date.now() / 1000; // Convert to Unix timestamp (seconds)

export const mockGatewaySessions: GatewaySession[] = [
  {
    session: 'agent:main:msteams:group:19:0cc3b64020df41f9acf7ffac5cee62a9@thread.v2',
    type: 'agent',
    label: 'main',
    channel: 'msteams',
    model: 'anthropic/claude-sonnet-4-5-20250929',
    host: 'openclaw-7fe23249-head',
    created_at: now - 7200, // Started 2 hours ago
    last_activity: now - 30, // Active 30 seconds ago
    current_message: null, // Idle
    metadata: {
      capabilities: ['read', 'write', 'exec', 'web_search'],
    },
  },
  {
    session: 'agent:backend-dev:subagent:809e5c6f-4866-4609-8e34-8318f3967a7a',
    type: 'subagent',
    label: 'backend-dev',
    channel: 'subagent',
    model: 'anthropic/claude-sonnet-4-5-20250929',
    host: 'openclaw-7fe23249-head',
    created_at: now - 300, // Started 5 minutes ago
    last_activity: now - 2, // Active 2 seconds ago
    current_message: {
      content: 'Building Express.js API that adapts OpenClaw Gateway data for the frontend',
      timestamp: now - 120, // Task started 2 minutes ago
    },
    metadata: {
      capabilities: ['read', 'write', 'exec'],
    },
  },
  {
    session: 'agent:architect:subagent:xyz789abc',
    type: 'subagent',
    label: 'architect',
    channel: 'subagent',
    model: 'anthropic/claude-sonnet-4-5-20250929',
    host: 'openclaw-7fe23249-head',
    created_at: now - 1800, // Started 30 minutes ago
    last_activity: now - 900, // Last active 15 minutes ago (stale)
    current_message: null,
    metadata: {
      capabilities: ['read', 'write'],
    },
  },
  {
    session: 'agent:frontend-dev:subagent:abc123xyz',
    type: 'subagent',
    label: 'frontend-dev',
    channel: 'subagent',
    model: 'anthropic/claude-sonnet-4-5-20250929',
    host: 'openclaw-7fe23249-head',
    created_at: now - 600, // Started 10 minutes ago
    last_activity: now - 5, // Active 5 seconds ago
    current_message: {
      content: 'Building React components for Agent Dashboard',
      timestamp: now - 5,
    },
    metadata: {
      capabilities: ['read', 'write'],
    },
  },
  {
    session: 'agent:error-test:subagent:error123',
    type: 'subagent',
    label: 'error-test',
    channel: 'subagent',
    model: 'anthropic/claude-sonnet-4-5-20250929',
    host: 'openclaw-7fe23249-head',
    created_at: now - 120,
    last_activity: now - 60,
    current_message: null,
    metadata: {
      status: 'error',
    },
    error: 'Connection lost',
  },
];

/**
 * Get mock sessions (for development)
 */
export function getMockSessions(): GatewaySession[] {
  return mockGatewaySessions;
}
