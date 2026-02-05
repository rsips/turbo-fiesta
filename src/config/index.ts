// Configuration for Mission Control Backend

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '8080', 10),
  
  // TLS/HTTPS configuration
  tls: {
    enabled: process.env.TLS_ENABLED === 'true',
    certPath: process.env.TLS_CERT_PATH || './certs/server.crt',
    keyPath: process.env.TLS_KEY_PATH || './certs/server.key',
  },
  
  // OpenClaw Gateway configuration
  gateway: {
    baseUrl: process.env.GATEWAY_URL || 'http://localhost:18789',
    timeout: parseInt(process.env.GATEWAY_TIMEOUT || '2000', 10),
    sessionsPath: '/sessions',
  },
  
  // Cache configuration
  cache: {
    ttlSeconds: 5, // Match frontend polling interval
  },
  
  // CORS configuration
  cors: {
    enabled: process.env.CORS_ENABLED !== 'false',
    origin: process.env.CORS_ORIGIN || '*',
  },
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Authentication configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'change-this-in-production',
    jwtExpiration: process.env.JWT_EXPIRATION || '24h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  },
  
  // Agent authentication
  agentAuth: {
    enabled: process.env.AGENT_AUTH_ENABLED !== 'false',
    keysFile: process.env.AGENT_KEYS_FILE || './data/agent-keys.json',
  },
};
