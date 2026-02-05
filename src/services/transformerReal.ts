// Schema transformation: Real Gateway format → Mission Control format

import { Agent, AgentStatus } from '../types/agent';
import { GatewaySessionItem } from '../types/gateway';
import { logger } from '../utils/logger';

/**
 * Compute agent status based on real Gateway session data
 */
export function computeStatusReal(session: GatewaySessionItem): AgentStatus {
  const now = Date.now();
  const ageMs = session.age || 0;
  
  // Check if aborted (error state)
  if (session.abortedLastRun || session.flags?.includes('aborted')) {
    return 'error';
  }
  
  // Check activity age
  // Active within 30 seconds = online
  if (ageMs < 30000) {
    // If very recent (< 10s), might be busy
    if (ageMs < 10000 && session.outputTokens && session.outputTokens > 0) {
      return 'busy';
    }
    return 'online';
  }
  
  // Idle for 30s - 5min = still online but idle
  if (ageMs < 300000) {
    return 'online';
  }
  
  // Otherwise, offline
  return 'offline';
}

/**
 * Extract human-readable agent name
 */
export function extractAgentNameReal(session: GatewaySessionItem): string {
  // Format agentId to title case
  const name = session.agentId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return name + ' Agent';
}

/**
 * Extract task description from session
 * For real Gateway data, we don't have current task info
 * So we'll return token usage info or null
 */
export function extractTaskDescriptionReal(session: GatewaySessionItem): string | null {
  // If very recent activity and tokens were used
  if (session.age < 10000 && session.outputTokens && session.outputTokens > 0) {
    return `Processing (${session.outputTokens} tokens output)`;
  }
  
  // If context is being used
  if (session.percentUsed > 0) {
    return `Context: ${session.percentUsed}% used (${session.totalTokens.toLocaleString()} tokens)`;
  }
  
  return null;
}

/**
 * Convert Unix timestamp (ms) to ISO 8601 string
 */
function msToISO(timestampMs: number): string {
  return new Date(timestampMs).toISOString();
}

/**
 * Calculate uptime in seconds from age
 */
function calculateUptimeReal(session: GatewaySessionItem): number {
  // updatedAt is the last activity, so we need to estimate session start
  // We don't have created_at, so we'll use age as approximate uptime
  return Math.floor(session.age / 1000);
}

/**
 * Transform a real Gateway session to Mission Control Agent format
 */
export function transformSessionReal(session: GatewaySessionItem): Agent {
  const status = computeStatusReal(session);
  const currentTask = extractTaskDescriptionReal(session);
  
  const now = Date.now();
  const lastActivityTime = now - session.age;
  const startedAtTime = session.updatedAt; // Best estimate
  
  const agent: Agent = {
    id: session.key,
    name: extractAgentNameReal(session),
    session_id: session.sessionId,
    status,
    current_task: currentTask,
    task_started_at: currentTask ? msToISO(lastActivityTime) : null,
    last_activity: msToISO(session.updatedAt),
    started_at: msToISO(startedAtTime),
    uptime_seconds: calculateUptimeReal(session),
    metadata: {
      agentId: session.agentId,
      kind: session.kind,
      model: session.model,
      totalTokens: session.totalTokens,
      remainingTokens: session.remainingTokens,
      percentUsed: session.percentUsed,
      contextTokens: session.contextTokens,
      flags: session.flags,
      abortedLastRun: session.abortedLastRun,
    },
  };
  
  return agent;
}

/**
 * Transform multiple real Gateway sessions
 */
export function transformSessionsReal(sessions: GatewaySessionItem[]): Agent[] {
  return sessions.map(session => {
    try {
      return transformSessionReal(session);
    } catch (error) {
      logger.error('Failed to transform real Gateway session', { session, error });
      // Return a minimal agent object on error
      return {
        id: session.key || 'unknown',
        name: 'Error',
        session_id: session.sessionId || 'unknown',
        status: 'error' as AgentStatus,
        current_task: null,
        task_started_at: null,
        last_activity: new Date().toISOString(),
        started_at: new Date().toISOString(),
        uptime_seconds: 0,
      };
    }
  });
}
