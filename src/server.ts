// Mission Control Backend API Server

import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import * as fs from 'fs';
import cors from 'cors';
import { config } from './config';
import { logger } from './utils/logger';
import agentsRouter from './routes/agents';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import agentKeysRouter from './routes/agentKeys';
import { authenticateToken, optionalAuth } from './middleware/auth';
import { gatewayClient } from './services/gateway';
import { initializeWebSocket, getWebSocketManager } from './services/websocket';

// Initialize Express app
const app = express();

// Middleware
if (config.cors.enabled) {
  app.use(cors({
    origin: config.cors.origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  logger.info('CORS enabled', { origin: config.cors.origin });
}

app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  
  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check if using mock data
    const useMock = process.env.USE_MOCK_DATA === 'true';
    
    let gatewayStatus = 'unknown';
    
    if (!useMock) {
      // Check real Gateway connectivity via CLI
      const { gatewayRealClient } = await import('./services/gatewayReal');
      const isHealthy = await gatewayRealClient.checkHealth();
      gatewayStatus = isHealthy ? 'connected' : 'disconnected';
    } else {
      gatewayStatus = 'mock';
    }

    // Get WebSocket status
    const wsMgr = getWebSocketManager();
    const wsStatus = wsMgr ? {
      status: 'running',
      connections: wsMgr.getConnectionCount(),
      connectedUsers: wsMgr.getConnectedUsers().length,
    } : { status: 'not_initialized' };

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      gateway: gatewayStatus,
      websocket: wsStatus,
      config: {
        gatewayUrl: config.gateway.baseUrl,
        useMockData: useMock,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      gateway: 'error',
      error: error.message,
    });
  }
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/users', authenticateToken, usersRouter); // Admin-only user management
app.use('/api/agents', authenticateToken, agentsRouter); // Protected route
app.use('/api/agent-keys', agentKeysRouter); // Agent API key management

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      details: `${req.method} ${req.path} does not exist`,
    },
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: err.message,
    },
  });
});

// Create HTTP/HTTPS server
let httpServer: ReturnType<typeof createServer> | ReturnType<typeof createHttpsServer>;

if (config.tls.enabled) {
  try {
    // Load TLS certificates
    const tlsOptions = {
      key: fs.readFileSync(config.tls.keyPath),
      cert: fs.readFileSync(config.tls.certPath),
    };
    
    httpServer = createHttpsServer(tlsOptions, app);
    logger.info('TLS/HTTPS enabled', { 
      certPath: config.tls.certPath,
      keyPath: config.tls.keyPath,
    });
  } catch (error: any) {
    logger.error('Failed to load TLS certificates, falling back to HTTP', { 
      error: error.message,
      certPath: config.tls.certPath,
      keyPath: config.tls.keyPath,
    });
    httpServer = createServer(app);
  }
} else {
  httpServer = createServer(app);
  logger.info('TLS/HTTPS disabled, using HTTP');
}

// Initialize WebSocket server
const wsManager = initializeWebSocket(httpServer);

// Start server
const server = httpServer.listen(config.port, () => {
  const protocol = config.tls.enabled ? 'https' : 'http';
  logger.info('Mission Control Backend API started', {
    url: `${protocol}://localhost:${config.port}`,
    port: config.port,
    protocol,
    gatewayUrl: config.gateway.baseUrl,
    useMockData: process.env.USE_MOCK_DATA === 'true',
    environment: process.env.NODE_ENV || 'development',
    websocket: 'enabled',
    agentAuth: config.agentAuth.enabled,
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  wsManager.close();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  wsManager.close();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;
