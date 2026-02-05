// Schema transformation: Gateway → Mission Control format

import { Agent, AgentStatus } from '../types/agent';
import { GatewaySession } from '../types/gateway';
import { logger } from '../utils/logger';

/**
 * Compute agent status based on Gateway session data
 */
export function computeStatus(session: GatewaySession): AgentStatus {
  const now = Date.now();
  
  // If Gateway provides explicit error status
  if (session.error || session.status === 'error' || session.metadata?.status === 'error') {
    return 'error';
  }
  
  // Check if processing a message (busy)
  if (session.current_message) {
    const messageTimestamp = session.current_message.timestamp * 1000; // Convert to ms
    const messageAge = now - messageTimestamp;
    
    // Message is fresh (within last 10 seconds) = busy
    if (messageAge < 10000) {
      return 'busy';
    }
  }
  
  // Check last activity
  if (session.last_activity) {
    const lastActivityMs = session.last_activity * 1000;
    const timeSinceActivity = now - lastActivityMs;
    
    // Active within 30 seconds = online
    if (timeSinceActivity < 30000) {
      return 'online';
    }
  }
  
  // Otherwise, offline
  return 'offline';
}

/**
 * Extract human-readable agent name from session ID or label
 */
export function extractAgentName(session: GatewaySession): string {
  // Use label if available
  if (session.label) {
    return formatLabel(session.label);
  }
  
  // Parse session ID (e.g., "agent:main:msteams:..." → "Main")
  if (session.session) {
    const parts = session.session.split(':');
    if (parts.length >= 2) {
      const role = parts[1];
      return formatLabel(role);
    }
  }
  
  return 'Unknown Agent';
}

/**
 * Format label to title case
 */
function formatLabel(label: string): string {
  return label
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Extract task description from current message
 */
export function extractTaskDescription(session: GatewaySession): string | null {
  if (!session.current_message) {
    return null;
  }
  
  const content = session.current_message.content;
  
  // Truncate to 60 chars
  if (content.length <= 60) {
    return content;
  }
  
  return content.substring(0, 60) + '...';
}

/**
 * Convert Unix timestamp to ISO 8601 string
 */
function timestampToISO(timestamp?: number): string {
  if (!timestamp) {
    return new Date().toISOString();
  }
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Calculate uptime in seconds
 */
function calculateUptime(startedAt?: number): number {
  if (!startedAt) {
    return 0;
  }
  const now = Date.now();
  const startMs = startedAt * 1000;
  return Math.floor((now - startMs) / 1000);
}

/**
 * Transform a Gateway session to Mission Control Agent format
 */
export function transformSession(session: GatewaySession): Agent {
  const status = computeStatus(session);
  const currentTask = extractTaskDescription(session);
  
  const agent: Agent = {
    id: session.session,
    name: extractAgentName(session),
    session_id: session.session,
    status,
    current_task: currentTask,
    task_started_at: session.current_message 
      ? timestampToISO(session.current_message.timestamp) 
      : null,
    last_activity: timestampToISO(session.last_activity),
    started_at: timestampToISO(session.created_at),
    uptime_seconds: calculateUptime(session.created_at),
    metadata: {
      channel: session.channel,
      model: session.model,
      host: session.host,
      ...(session.metadata || {}),
    },
  };
  
  return agent;
}

/**
 * Transform multiple Gateway sessions
 */
export function transformSessions(sessions: GatewaySession[]): Agent[] {
  return sessions.map(session => {
    try {
      return transformSession(session);
    } catch (error) {
      logger.error('Failed to transform session', { session, error });
      // Return a minimal agent object on error
      return {
        id: session.session || 'unknown',
        name: 'Error',
        session_id: session.session || 'unknown',
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
