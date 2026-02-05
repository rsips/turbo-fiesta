// OpenClaw Gateway Types (Backend-facing)
// Based on actual `openclaw gateway call status --json` output

export interface GatewaySessionItem {
  agentId: string;               // e.g., "main", "backend-dev"
  key: string;                   // e.g., "agent:main:msteams:group:19:..."
  kind: 'direct' | 'group';      // Session type
  sessionId: string;             // UUID
  updatedAt: number;             // Unix timestamp in milliseconds
  age: number;                   // Age in milliseconds
  systemSent?: boolean;          // System message flag
  abortedLastRun?: boolean;      // Whether last run was aborted
  inputTokens?: number;          // Last input tokens
  outputTokens?: number;         // Last output tokens
  totalTokens: number;           // Total tokens used
  remainingTokens: number;       // Remaining tokens
  percentUsed: number;           // Percentage of context used
  model: string;                 // Model name
  contextTokens: number;         // Context window size
  flags: string[];               // Additional flags
}

export interface GatewayAgentSessions {
  agentId: string;
  path: string;
  count: number;
  recent: GatewaySessionItem[];
}

export interface GatewayStatusResponse {
  sessions: {
    paths: string[];
    count: number;
    defaults: {
      model: string;
      contextTokens: number;
    };
    recent: GatewaySessionItem[];
    byAgent: GatewayAgentSessions[];
  };
  heartbeat?: any;
  linkChannel?: any;
  channelSummary?: string[];
  queuedSystemEvents?: string[];
}

// Legacy Gateway schema (kept for mock data compatibility)
export interface GatewaySession {
  session: string;           // e.g., "agent:main:msteams:group:19:abc123"
  type?: string;             // e.g., "agent", "subagent"
  label?: string;            // e.g., "main", "architect"
  channel?: string;          // e.g., "msteams", "subagent"
  model?: string;            // e.g., "claude-sonnet-4-5"
  host?: string;             // e.g., "openclaw-7fe23249-head"
  created_at?: number;       // Unix timestamp
  last_activity?: number;    // Unix timestamp
  current_message?: {        // If agent is processing a message
    content: string;
    timestamp: number;
  } | null;
  metadata?: Record<string, any>;
  status?: string;           // Gateway may provide explicit status
  error?: string;            // Error message if in error state
}

export interface GatewaySessionsResponse {
  sessions: GatewaySession[];
  // May include other fields like total, timestamp, etc.
  [key: string]: any;
}
