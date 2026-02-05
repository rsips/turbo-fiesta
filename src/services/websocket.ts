// WebSocket Real-Time Communication Service

import { Server as HttpServer, IncomingMessage } from 'http';
import WebSocket, { WebSocketServer as WSServer } from 'ws';
import { URL } from 'url';
import { verifyToken } from '../utils/jwt';
import { TokenPayload } from '../types/auth';
import {
  AgentStatus,
  WebSocketMessage,
  ClientConnection,
  WS_CLOSE_CODES,
} from '../types/websocket';
import { logger } from '../utils/logger';

// Extended WebSocket with user info
interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  username?: string;
  role?: string;
  connectedAt?: number;
  isAlive?: boolean;
}

/**
 * WebSocket Manager - handles real-time communication
 */
export class WebSocketManager {
  private wss: WSServer;
  private connections: Map<string, Set<AuthenticatedWebSocket>>; // userId -> Set of connections
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds

  constructor(server: HttpServer) {
    this.connections = new Map();

    // Create WebSocket server attached to HTTP server
    this.wss = new WSServer({
      server,
      verifyClient: this.verifyClient.bind(this),
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.wss.on('error', this.handleServerError.bind(this));

    // Start heartbeat interval
    this.startHeartbeat();

    logger.info('WebSocket server initialized');
  }

  /**
   * Verify client during WebSocket handshake
   */
  private verifyClient(
    info: { origin: string; secure: boolean; req: IncomingMessage },
    callback: (result: boolean, code?: number, message?: string) => void
  ): void {
    try {
      const token = this.extractToken(info.req);

      if (!token) {
        logger.warn('WebSocket connection rejected: No token provided');
        callback(false, 4001, 'Authorization token required');
        return;
      }

      try {
        const decoded = verifyToken(token);
        // Attach user info to request for later use in connection handler
        (info.req as any).user = decoded;
        callback(true);
      } catch (error: any) {
        logger.warn('WebSocket connection rejected: Invalid token', { error: error.message });
        callback(false, 4001, 'Invalid or expired token');
      }
    } catch (error: any) {
      logger.error('WebSocket verification error', { error: error.message });
      callback(false, 4500, 'Server error during authentication');
    }
  }

  /**
   * Extract JWT token from request (header or query param)
   */
  private extractToken(req: IncomingMessage): string | null {
    // Try Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    // Fall back to query parameter
    try {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      if (token) {
        return token;
      }
    } catch {
      // URL parsing failed
    }

    return null;
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: AuthenticatedWebSocket, req: IncomingMessage): void {
    const user = (req as any).user as TokenPayload;

    if (!user) {
      ws.close(WS_CLOSE_CODES.UNAUTHORIZED, 'Unauthorized');
      return;
    }

    // Set up authenticated connection
    ws.userId = user.userId;
    ws.username = user.username;
    ws.role = user.role;
    ws.connectedAt = Date.now();
    ws.isAlive = true;

    // Track connection by user ID
    if (!this.connections.has(user.userId)) {
      this.connections.set(user.userId, new Set());
    }
    this.connections.get(user.userId)!.add(ws);

    logger.info('WebSocket client connected', {
      userId: user.userId,
      username: user.username,
      totalConnections: this.getConnectionCount(),
    });

    // Handle pong responses (for heartbeat)
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle client messages
    ws.on('message', (data) => {
      this.handleClientMessage(ws, data);
    });

    // Handle disconnect
    ws.on('close', (code, reason) => {
      this.handleDisconnect(ws, code, reason.toString());
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error('WebSocket client error', {
        userId: ws.userId,
        error: error.message,
      });
    });
  }

  /**
   * Handle incoming client messages
   */
  private handleClientMessage(ws: AuthenticatedWebSocket, data: WebSocket.RawData): void {
    try {
      const message = JSON.parse(data.toString());
      logger.debug('WebSocket message received', {
        userId: ws.userId,
        type: message.type,
      });

      // Handle client-initiated messages if needed
      // For now, clients only listen to broadcasts
    } catch (error: any) {
      logger.warn('Invalid WebSocket message', {
        userId: ws.userId,
        error: error.message,
      });
    }
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(ws: AuthenticatedWebSocket, code: number, reason: string): void {
    if (ws.userId) {
      const userConnections = this.connections.get(ws.userId);
      if (userConnections) {
        userConnections.delete(ws);
        if (userConnections.size === 0) {
          this.connections.delete(ws.userId);
        }
      }
    }

    logger.info('WebSocket client disconnected', {
      userId: ws.userId,
      code,
      reason,
      totalConnections: this.getConnectionCount(),
    });
  }

  /**
   * Handle server-level errors
   */
  private handleServerError(error: Error): void {
    logger.error('WebSocket server error', { error: error.message });
  }

  /**
   * Start heartbeat interval to detect dead connections
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          // Connection is dead, terminate it
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Send heartbeat message to all clients
   */
  public sendHeartbeat(): void {
    const message: WebSocketMessage = {
      type: 'heartbeat',
      payload: {
        timestamp: Date.now(),
      },
    };
    this.broadcast(message);
  }

  /**
   * Broadcast message to all connected clients
   */
  public broadcast(message: WebSocketMessage): void {
    const data = JSON.stringify(message);

    this.wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }

  /**
   * Broadcast agent status update
   */
  public broadcastAgentStatus(agentId: string, status: AgentStatus): void {
    const message: WebSocketMessage = {
      type: 'agent:status',
      payload: {
        agentId,
        status,
        timestamp: Date.now(),
      },
    };

    logger.debug('Broadcasting agent status', { agentId, status });
    this.broadcast(message);
  }

  /**
   * Broadcast session activity update
   */
  public broadcastSessionActivity(
    agentId: string,
    sessionId: string,
    lastMessage: string
  ): void {
    const message: WebSocketMessage = {
      type: 'session:activity',
      payload: {
        agentId,
        sessionId,
        lastMessage,
        timestamp: Date.now(),
      },
    };

    logger.debug('Broadcasting session activity', { agentId, sessionId });
    this.broadcast(message);
  }

  /**
   * Send message to specific user (all their connections)
   */
  public sendToUser(userId: string, message: WebSocketMessage): void {
    const userConnections = this.connections.get(userId);
    if (!userConnections) {
      return;
    }

    const data = JSON.stringify(message);
    userConnections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }

  /**
   * Get total number of connections
   */
  public getConnectionCount(): number {
    let count = 0;
    this.connections.forEach((connections) => {
      count += connections.size;
    });
    return count;
  }

  /**
   * Get number of connections for a specific user
   */
  public getConnectionsForUser(userId: string): number {
    return this.connections.get(userId)?.size || 0;
  }

  /**
   * Get list of connected users
   */
  public getConnectedUsers(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Close the WebSocket server
   */
  public close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Close all client connections
    this.wss.clients.forEach((ws) => {
      ws.close(WS_CLOSE_CODES.GOING_AWAY, 'Server shutting down');
    });

    // Close the server
    this.wss.close();

    // Clear connections map
    this.connections.clear();

    logger.info('WebSocket server closed');
  }
}

// Singleton instance for use across the application
let wsManagerInstance: WebSocketManager | null = null;

/**
 * Initialize WebSocket manager with HTTP server
 */
export function initializeWebSocket(server: HttpServer): WebSocketManager {
  if (wsManagerInstance) {
    logger.warn('WebSocket manager already initialized');
    return wsManagerInstance;
  }

  wsManagerInstance = new WebSocketManager(server);
  return wsManagerInstance;
}

/**
 * Get the WebSocket manager instance
 */
export function getWebSocketManager(): WebSocketManager | null {
  return wsManagerInstance;
}

/**
 * Helper to broadcast agent status from anywhere in the app
 */
export function broadcastAgentStatus(agentId: string, status: AgentStatus): void {
  if (wsManagerInstance) {
    wsManagerInstance.broadcastAgentStatus(agentId, status);
  }
}

/**
 * Helper to broadcast session activity from anywhere in the app
 */
export function broadcastSessionActivity(
  agentId: string,
  sessionId: string,
  lastMessage: string
): void {
  if (wsManagerInstance) {
    wsManagerInstance.broadcastSessionActivity(agentId, sessionId, lastMessage);
  }
}

// Re-export types
export { WebSocketServer } from 'ws';
