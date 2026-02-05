// WebSocket Real-Time Communication Types

export type AgentStatus = 'online' | 'offline' | 'error';

// Server → Client message types
export interface AgentStatusMessage {
  type: 'agent:status';
  payload: {
    agentId: string;
    status: AgentStatus;
    timestamp: number;
  };
}

export interface SessionActivityMessage {
  type: 'session:activity';
  payload: {
    agentId: string;
    sessionId: string;
    lastMessage: string;
    timestamp: number;
  };
}

export interface HeartbeatMessage {
  type: 'heartbeat';
  payload: {
    timestamp: number;
  };
}

export interface ErrorMessage {
  type: 'error';
  payload: {
    code: string;
    message: string;
    timestamp: number;
  };
}

export type WebSocketMessage = 
  | AgentStatusMessage 
  | SessionActivityMessage 
  | HeartbeatMessage
  | ErrorMessage;

// Client connection info
export interface ClientConnection {
  userId: string;
  username: string;
  role: string;
  connectedAt: number;
}

// WebSocket close codes
export const WS_CLOSE_CODES = {
  NORMAL: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNAUTHORIZED: 4001,
  INVALID_TOKEN: 4002,
  SERVER_ERROR: 4500,
} as const;
