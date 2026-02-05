/**
 * Audit Log Types for Risk Assessment
 * "Agent reports from the field"
 */

export type AuditActionType =
  | 'login'
  | 'logout'
  | 'agent.start'
  | 'agent.stop'
  | 'agent.restart'
  | 'agent.task.start'
  | 'agent.task.complete'
  | 'agent.task.fail'
  | 'agent.message'
  | 'commit'
  | 'deploy'
  | 'config.update'
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'api.call'
  | 'error'
  | 'unknown';

export type AuditResult = 'success' | 'failure' | 'pending' | 'warning';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  agentId: string | null;
  agentName: string | null;
  userId: string | null;
  userName: string | null;
  action: AuditActionType;
  description: string;
  result: AuditResult;
  metadata?: {
    duration?: number;
    target?: string;
    details?: string;
    error?: string;
    [key: string]: unknown;
  };
}

export interface AuditLogsResponse {
  success: boolean;
  data: {
    logs: AuditLogEntry[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface AuditFilters {
  search: string;
  agent: string | 'all';
  action: AuditActionType | 'all';
  result: AuditResult | 'all';
  dateFrom: string | null;
  dateTo: string | null;
}

export interface AuditQueryParams {
  page?: number;
  pageSize?: number;
  agent?: string;
  action?: string;
  result?: string;
  search?: string;
  from?: string;
  to?: string;
}

// WebSocket event types
export interface AuditWebSocketMessage {
  type: 'audit.new' | 'audit.update';
  payload: AuditLogEntry;
}
