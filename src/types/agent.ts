export type AgentStatus = 'online' | 'busy' | 'offline' | 'error';

export interface Agent {
  id: string;
  name: string;
  session_id: string;
  status: AgentStatus;
  current_task: string | null;
  task_started_at: string | null;
  last_activity: string;
  started_at: string;
  uptime_seconds: number;
  metadata?: {
    channel?: string;
    model?: string;
    host?: string;
    capabilities?: string[];
    [key: string]: any;
  };
}

export interface AgentsResponse {
  success: boolean;
  data: {
    agents: Agent[];
    count: number;
    timestamp: string;
  };
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface AgentDetailResponse {
  success: boolean;
  data: Agent;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export type SortField = 'name' | 'status' | 'last_activity' | 'uptime';
export type SortOrder = 'asc' | 'desc';

export interface Filters {
  search: string;
  status: AgentStatus | 'all';
}

export interface Sort {
  field: SortField;
  order: SortOrder;
}
