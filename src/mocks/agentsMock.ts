import { Agent } from '../types/agent';

const now = Date.now();

export const mockAgents: Agent[] = [
  {
    id: 'agent:main:msteams:group:19:abc123',
    name: 'Main Agent',
    session_id: 'agent:main:msteams:group:19:abc123',
    status: 'busy',
    current_task: 'Processing user request about calendar integration',
    task_started_at: new Date(now - 125000).toISOString(), // Started 2m 5s ago
    last_activity: new Date(now - 5000).toISOString(), // Active 5s ago
    started_at: new Date(now - 12690000).toISOString(), // Started 3h 31m 30s ago
    uptime_seconds: 12690,
    metadata: {
      channel: 'msteams',
      model: 'claude-sonnet-4-5',
      host: 'openclaw-7fe23249-head',
      capabilities: ['read', 'write', 'web_search', 'browser']
    }
  },
  {
    id: 'agent:architect:subagent:xyz789',
    name: 'System Architect',
    session_id: 'agent:architect:subagent:xyz789',
    status: 'online',
    current_task: null,
    task_started_at: null,
    last_activity: new Date(now - 15000).toISOString(), // Active 15s ago
    started_at: new Date(now - 1800000).toISOString(), // Started 30m ago
    uptime_seconds: 1800,
    metadata: {
      channel: 'subagent',
      model: 'claude-sonnet-4-5',
      host: 'openclaw-7fe23249-head',
      capabilities: ['read', 'write']
    }
  },
  {
    id: 'agent:pm:subagent:def456',
    name: 'Product Manager',
    session_id: 'agent:pm:subagent:def456',
    status: 'busy',
    current_task: 'Writing requirements document for Phase 2 features',
    task_started_at: new Date(now - 420000).toISOString(), // Started 7m ago
    last_activity: new Date(now - 3000).toISOString(), // Active 3s ago
    started_at: new Date(now - 2100000).toISOString(), // Started 35m ago
    uptime_seconds: 2100,
    metadata: {
      channel: 'subagent',
      model: 'claude-sonnet-4-5',
      host: 'openclaw-7fe23249-head'
    }
  },
  {
    id: 'agent:frontend-dev:subagent:ghi789',
    name: 'Frontend Developer',
    session_id: 'agent:frontend-dev:subagent:ghi789',
    status: 'busy',
    current_task: 'Building React dashboard for agent list view',
    task_started_at: new Date(now - 60000).toISOString(), // Started 1m ago
    last_activity: new Date(now - 2000).toISOString(), // Active 2s ago
    started_at: new Date(now - 300000).toISOString(), // Started 5m ago
    uptime_seconds: 300,
    metadata: {
      channel: 'subagent',
      model: 'claude-sonnet-4-5',
      host: 'openclaw-7fe23249-head',
      capabilities: ['read', 'write', 'web_search']
    }
  },
  {
    id: 'agent:backend-dev:subagent:jkl012',
    name: 'Backend Developer',
    session_id: 'agent:backend-dev:subagent:jkl012',
    status: 'offline',
    current_task: null,
    task_started_at: null,
    last_activity: new Date(now - 45000).toISOString(), // Last active 45s ago
    started_at: new Date(now - 900000).toISOString(), // Started 15m ago
    uptime_seconds: 900,
    metadata: {
      channel: 'subagent',
      model: 'claude-sonnet-4-5',
      host: 'openclaw-7fe23249-head'
    }
  },
  {
    id: 'agent:monitor:service:mno345',
    name: 'System Monitor',
    session_id: 'agent:monitor:service:mno345',
    status: 'error',
    current_task: 'Health check failed - database connection lost',
    task_started_at: new Date(now - 180000).toISOString(), // Error started 3m ago
    last_activity: new Date(now - 10000).toISOString(), // Last activity 10s ago
    started_at: new Date(now - 7200000).toISOString(), // Started 2h ago
    uptime_seconds: 7200,
    metadata: {
      channel: 'service',
      model: 'claude-haiku',
      host: 'openclaw-7fe23249-head',
      error: 'Connection timeout'
    }
  },
  {
    id: 'agent:scheduler:service:pqr678',
    name: 'Task Scheduler',
    session_id: 'agent:scheduler:service:pqr678',
    status: 'online',
    current_task: null,
    task_started_at: null,
    last_activity: new Date(now - 8000).toISOString(), // Active 8s ago
    started_at: new Date(now - 28800000).toISOString(), // Started 8h ago
    uptime_seconds: 28800,
    metadata: {
      channel: 'service',
      model: 'claude-haiku',
      host: 'openclaw-7fe23249-head'
    }
  }
];
