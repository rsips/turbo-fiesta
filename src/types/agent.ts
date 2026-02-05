// Mission Control Agent Types (Frontend-facing)

export type AgentStatus = 'online' | 'busy' | 'offline' | 'error';

export interface Agent {
  id: string;                    // Unique agent identifier
  name: string;                  // Human-readable name
  session_id: string;            // Session/instance ID
  status: AgentStatus;           // Current status
  current_task: string | null;   // Task description, null if idle
  task_started_at: string | null; // ISO 8601, null if idle
  last_activity: string;         // ISO 8601 timestamp
  started_at: string;            // ISO 8601 timestamp
  uptime_seconds: number;        // Seconds since started_at
  metadata?: {                   // Optional additional data
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
    timestamp: string;  // ISO 8601
  };
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface AgentResponse {
  success: boolean;
  data?: Agent;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

// Agent control action response types
export interface AgentActionResponse {
  success: boolean;
  data?: {
    agentId?: string;
    sessionId?: string;
    action: 'stop' | 'restart' | 'message' | 'settings';
    result: string;
    updatedSettings?: Record<string, any>;
    timestamp: string;
  };
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}
