// Types for Agent Authentication

export interface AgentApiKey {
  id: string;              // Unique identifier
  name: string;            // Friendly name (e.g., "openclaw-agent-1")
  keyHash: string;         // Bcrypt hash of the API key
  createdAt: Date;         // When the key was created
  lastUsedAt?: Date;       // Last time the key was used
  expiresAt?: Date;        // Optional expiration date
  isActive: boolean;       // Can be disabled without deleting
  permissions?: string[];  // Optional: specific permissions
  metadata?: {
    agentId?: string;      // OpenClaw agent session ID
    nodeId?: string;       // Node identifier
    [key: string]: any;
  };
}

export interface CreateAgentApiKeyRequest {
  name: string;
  expiresInDays?: number;
  permissions?: string[];
  metadata?: Record<string, any>;
}

export interface CreateAgentApiKeyResponse {
  success: boolean;
  data?: {
    id: string;
    name: string;
    apiKey: string;        // Plain text key (ONLY returned once!)
    createdAt: string;
    expiresAt?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface ValidateAgentKeyResult {
  valid: boolean;
  agent?: AgentApiKey;
  error?: string;
}
