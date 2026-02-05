// Audit Logging Types

export type AuditAction = 
  // Authentication
  | 'user.login'
  | 'user.logout'
  | 'user.login.failed'
  // User Management (Admin)
  | 'user.role.changed'
  | 'user.created'
  | 'user.deleted'
  // Agent Control
  | 'agent.stop'
  | 'agent.restart'
  | 'agent.message'
  // Agent Connections
  | 'agent.connected'
  | 'agent.disconnected';

export type AuditResult = 'success' | 'failure' | 'denied';

export interface AuditLogEntry {
  id: string;
  timestamp: string;       // ISO 8601
  userId: string | null;   // null for unauthenticated actions
  username: string | null;
  action: AuditAction;
  resource: string;        // e.g., "user:123", "agent:main"
  result: AuditResult;
  details?: string;        // Additional context (no sensitive data!)
  ipAddress: string | null;
  userAgent?: string;
}

export interface AuditLogQuery {
  userId?: string;
  action?: AuditAction | AuditAction[];
  startDate?: string;      // ISO 8601
  endDate?: string;        // ISO 8601
  limit?: number;          // Default 100, max 1000
  offset?: number;         // For pagination
  result?: AuditResult;
}

export interface AuditLogResponse {
  success: boolean;
  data?: {
    logs: Omit<AuditLogEntry, 'id'>[];
    count: number;
    total: number;
    hasMore: boolean;
  };
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface AuditLogCreateInput {
  userId?: string | null;
  username?: string | null;
  action: AuditAction;
  resource: string;
  result: AuditResult;
  details?: string;
  ipAddress?: string | null;
  userAgent?: string;
}
