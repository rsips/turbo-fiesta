// Configuration for Mission Control Backend

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '8080', 10),
  
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
};
