// WebSocket Real-Time Communication Tests

import { createServer, Server as HttpServer } from 'http';
import WebSocket from 'ws';
import express from 'express';
import { WebSocketServer, WebSocketManager } from '../services/websocket';
import { generateToken } from '../utils/jwt';
import { TokenPayload } from '../types/auth';

describe('WebSocket Real-Time Communication', () => {
  let httpServer: HttpServer;
  let wsManager: WebSocketManager;
  let port: number;
  let validToken: string;
  let validTokenPayload: Omit<TokenPayload, 'iat' | 'exp'>;

  beforeAll(() => {
    // Generate a valid JWT token for testing
    validTokenPayload = {
      userId: 'test-user-123',
      username: 'testuser',
      role: 'operator',
    };
    validToken = generateToken(validTokenPayload);
  });

  beforeEach((done) => {
    // Create a fresh HTTP server for each test
    const app = express();
    httpServer = createServer(app);

    // Initialize WebSocket manager
    wsManager = new WebSocketManager(httpServer);

    // Find an available port
    httpServer.listen(0, () => {
      const address = httpServer.address();
      port = typeof address === 'object' ? address!.port : 0;
      done();
    });
  });

  afterEach((done) => {
    // Clean up
    wsManager.close();
    httpServer.close(() => {
      done();
    });
  });

  describe('Authentication during handshake', () => {
    it('should accept connections with valid JWT in Authorization header', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}`, {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      });

      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.close();
        done();
      });

      ws.on('error', (err) => {
        done(new Error(`Connection failed: ${err.message}`));
      });
    });

    it('should accept connections with valid JWT in query parameter', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}?token=${validToken}`);

      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.close();
        done();
      });

      ws.on('error', (err) => {
        done(new Error(`Connection failed: ${err.message}`));
      });
    });

    it('should reject connections without token', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}`);
      let errorOccurred = false;

      ws.on('error', () => {
        // Expected - connection should be rejected during upgrade
        errorOccurred = true;
      });

      ws.on('close', (code, reason) => {
        // Connection rejected during handshake results in 1006 (Abnormal Closure)
        // or error event, both indicate successful rejection
        expect(errorOccurred || code === 1006).toBe(true);
        done();
      });
    });

    it('should reject connections with invalid token', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}?token=invalid-token-here`);
      let errorOccurred = false;

      ws.on('error', () => {
        // Expected - connection should be rejected
        errorOccurred = true;
      });

      ws.on('close', (code, reason) => {
        expect(errorOccurred || code === 1006).toBe(true);
        done();
      });
    });

    it('should reject connections with expired token', (done) => {
      // Create an expired token (manually craft one with past exp)
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { ...validTokenPayload, exp: Math.floor(Date.now() / 1000) - 3600 },
        process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only'
      );

      const ws = new WebSocket(`ws://localhost:${port}?token=${expiredToken}`);
      let errorOccurred = false;

      ws.on('error', () => {
        errorOccurred = true;
      });

      ws.on('close', (code) => {
        expect(errorOccurred || code === 1006).toBe(true);
        done();
      });
    });
  });

  describe('Broadcasting events to all authenticated clients', () => {
    it('should broadcast agent status updates to all connected clients', (done) => {
      let client1Received = false;
      let client2Received = false;

      const checkDone = () => {
        if (client1Received && client2Received) {
          client1.close();
          client2.close();
          done();
        }
      };

      const client1 = new WebSocket(`ws://localhost:${port}?token=${validToken}`);
      const client2 = new WebSocket(`ws://localhost:${port}?token=${validToken}`);

      let openCount = 0;
      const onOpen = () => {
        openCount++;
        if (openCount === 2) {
          // Both clients connected, broadcast a status update
          wsManager.broadcastAgentStatus('agent-123', 'online');
        }
      };

      client1.on('open', onOpen);
      client2.on('open', onOpen);

      client1.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'agent:status') {
          expect(message.payload.agentId).toBe('agent-123');
          expect(message.payload.status).toBe('online');
          expect(message.payload.timestamp).toBeDefined();
          client1Received = true;
          checkDone();
        }
      });

      client2.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'agent:status') {
          expect(message.payload.agentId).toBe('agent-123');
          expect(message.payload.status).toBe('online');
          client2Received = true;
          checkDone();
        }
      });
    });

    it('should broadcast session activity updates to all clients', (done) => {
      const client = new WebSocket(`ws://localhost:${port}?token=${validToken}`);

      client.on('open', () => {
        // Send session activity broadcast
        wsManager.broadcastSessionActivity('agent-456', 'session-789', 'Hello from agent!');
      });

      client.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'session:activity') {
          expect(message.payload.agentId).toBe('agent-456');
          expect(message.payload.sessionId).toBe('session-789');
          expect(message.payload.lastMessage).toBe('Hello from agent!');
          expect(message.payload.timestamp).toBeDefined();
          client.close();
          done();
        }
      });
    });

    it('should support different agent statuses (online, offline, error)', (done) => {
      const client = new WebSocket(`ws://localhost:${port}?token=${validToken}`);
      const receivedStatuses: string[] = [];

      client.on('open', () => {
        wsManager.broadcastAgentStatus('agent-1', 'online');
        wsManager.broadcastAgentStatus('agent-2', 'offline');
        wsManager.broadcastAgentStatus('agent-3', 'error');
      });

      client.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'agent:status') {
          receivedStatuses.push(message.payload.status);
          if (receivedStatuses.length === 3) {
            expect(receivedStatuses).toContain('online');
            expect(receivedStatuses).toContain('offline');
            expect(receivedStatuses).toContain('error');
            client.close();
            done();
          }
        }
      });
    });
  });

  describe('Handling disconnections gracefully', () => {
    it('should clean up connection on client disconnect', (done) => {
      const client = new WebSocket(`ws://localhost:${port}?token=${validToken}`);

      client.on('open', () => {
        expect(wsManager.getConnectionCount()).toBe(1);
        client.close();
      });

      client.on('close', () => {
        // Give the server time to clean up
        setTimeout(() => {
          expect(wsManager.getConnectionCount()).toBe(0);
          done();
        }, 100);
      });
    });

    it('should track multiple connections and clean up properly', (done) => {
      const client1 = new WebSocket(`ws://localhost:${port}?token=${validToken}`);
      const client2 = new WebSocket(`ws://localhost:${port}?token=${validToken}`);
      
      let openCount = 0;

      const onOpen = () => {
        openCount++;
        if (openCount === 2) {
          expect(wsManager.getConnectionCount()).toBe(2);
          client1.close();
        }
      };

      client1.on('open', onOpen);
      client2.on('open', onOpen);

      client1.on('close', () => {
        setTimeout(() => {
          expect(wsManager.getConnectionCount()).toBe(1);
          client2.close();
        }, 100);
      });

      client2.on('close', () => {
        setTimeout(() => {
          expect(wsManager.getConnectionCount()).toBe(0);
          done();
        }, 100);
      });
    });

    it('should not crash when broadcasting to empty client list', () => {
      // No clients connected, should not throw
      expect(() => {
        wsManager.broadcastAgentStatus('agent-1', 'online');
      }).not.toThrow();
    });

    it('should handle sudden disconnect (no close handshake)', (done) => {
      const client = new WebSocket(`ws://localhost:${port}?token=${validToken}`);

      client.on('open', () => {
        expect(wsManager.getConnectionCount()).toBe(1);
        // Forcefully terminate without close handshake
        client.terminate();
      });

      // Give server time to detect and clean up
      setTimeout(() => {
        expect(wsManager.getConnectionCount()).toBe(0);
        done();
      }, 200);
    });
  });

  describe('Message format validation', () => {
    it('should send messages in the correct format with type and payload', (done) => {
      const client = new WebSocket(`ws://localhost:${port}?token=${validToken}`);

      client.on('open', () => {
        wsManager.broadcastAgentStatus('test-agent', 'online');
      });

      client.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        // Verify message structure
        expect(message).toHaveProperty('type');
        expect(message).toHaveProperty('payload');
        expect(typeof message.type).toBe('string');
        expect(typeof message.payload).toBe('object');
        expect(message.payload).toHaveProperty('timestamp');
        expect(typeof message.payload.timestamp).toBe('number');
        
        client.close();
        done();
      });
    });

    it('should include all required fields in agent:status messages', (done) => {
      const client = new WebSocket(`ws://localhost:${port}?token=${validToken}`);

      client.on('open', () => {
        wsManager.broadcastAgentStatus('agent-abc', 'offline');
      });

      client.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'agent:status') {
          expect(message.payload).toHaveProperty('agentId');
          expect(message.payload).toHaveProperty('status');
          expect(message.payload).toHaveProperty('timestamp');
          expect(message.payload.agentId).toBe('agent-abc');
          expect(message.payload.status).toBe('offline');
          
          client.close();
          done();
        }
      });
    });

    it('should include all required fields in session:activity messages', (done) => {
      const client = new WebSocket(`ws://localhost:${port}?token=${validToken}`);

      client.on('open', () => {
        wsManager.broadcastSessionActivity('agent-x', 'session-y', 'Test message');
      });

      client.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'session:activity') {
          expect(message.payload).toHaveProperty('agentId');
          expect(message.payload).toHaveProperty('sessionId');
          expect(message.payload).toHaveProperty('lastMessage');
          expect(message.payload).toHaveProperty('timestamp');
          expect(message.payload.agentId).toBe('agent-x');
          expect(message.payload.sessionId).toBe('session-y');
          expect(message.payload.lastMessage).toBe('Test message');
          
          client.close();
          done();
        }
      });
    });
  });

  describe('Heartbeat mechanism', () => {
    it('should send heartbeat messages to connected clients', (done) => {
      const client = new WebSocket(`ws://localhost:${port}?token=${validToken}`);

      client.on('open', () => {
        // Manually trigger heartbeat
        wsManager.sendHeartbeat();
      });

      client.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'heartbeat') {
          expect(message.payload).toHaveProperty('timestamp');
          expect(typeof message.payload.timestamp).toBe('number');
          client.close();
          done();
        }
      });
    });
  });

  describe('Connection management', () => {
    it('should track connections by user ID', (done) => {
      // Create a second token with different user ID
      const user2Token = generateToken({
        userId: 'user-456',
        username: 'user2',
        role: 'viewer',
      });

      const client1 = new WebSocket(`ws://localhost:${port}?token=${validToken}`);
      const client2 = new WebSocket(`ws://localhost:${port}?token=${user2Token}`);

      let openCount = 0;
      const onOpen = () => {
        openCount++;
        if (openCount === 2) {
          // Both users should have connections
          const user1Connections = wsManager.getConnectionsForUser('test-user-123');
          const user2Connections = wsManager.getConnectionsForUser('user-456');
          
          expect(user1Connections).toBe(1);
          expect(user2Connections).toBe(1);
          expect(wsManager.getConnectionCount()).toBe(2);
          
          client1.close();
          client2.close();
          done();
        }
      };

      client1.on('open', onOpen);
      client2.on('open', onOpen);
    });

    it('should support multiple connections from same user', (done) => {
      const client1 = new WebSocket(`ws://localhost:${port}?token=${validToken}`);
      const client2 = new WebSocket(`ws://localhost:${port}?token=${validToken}`);

      let openCount = 0;
      const onOpen = () => {
        openCount++;
        if (openCount === 2) {
          // Same user should have 2 connections
          const userConnections = wsManager.getConnectionsForUser('test-user-123');
          
          expect(userConnections).toBe(2);
          expect(wsManager.getConnectionCount()).toBe(2);
          
          client1.close();
          client2.close();
          done();
        }
      };

      client1.on('open', onOpen);
      client2.on('open', onOpen);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed upgrade requests gracefully', (done) => {
      // This test ensures the server doesn't crash on bad requests
      // We'll make a regular HTTP request to the WebSocket endpoint
      const http = require('http');
      
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/',
        method: 'GET',
      }, (res: any) => {
        // Should not crash - we don't care about the response
        done();
      });

      req.on('error', () => {
        // Connection might be refused, that's okay
        done();
      });

      req.end();
    });
  });
});

describe('WebSocket Server Integration', () => {
  let httpServer: HttpServer;
  let wsManager: WebSocketManager;
  let port: number;
  let token: string;

  beforeAll(() => {
    token = generateToken({
      userId: 'integration-user',
      username: 'integrationtest',
      role: 'admin',
    });
  });

  beforeEach((done) => {
    const app = express();
    httpServer = createServer(app);
    wsManager = new WebSocketManager(httpServer);
    
    httpServer.listen(0, () => {
      const address = httpServer.address();
      port = typeof address === 'object' ? address!.port : 0;
      done();
    });
  });

  afterEach((done) => {
    wsManager.close();
    httpServer.close(() => done());
  });

  it('should handle rapid connect/disconnect cycles without memory leaks', async () => {
    const iterations = 50; // Reduced for faster tests
    
    for (let i = 0; i < iterations; i++) {
      await new Promise<void>((resolve) => {
        const client = new WebSocket(`ws://localhost:${port}?token=${token}`);
        
        client.on('open', () => {
          client.close();
        });
        
        client.on('close', () => {
          resolve();
        });
        
        client.on('error', () => {
          resolve();
        });
      });
    }

    // After all connections closed, count should be 0
    expect(wsManager.getConnectionCount()).toBe(0);
  });

  it('should broadcast to multiple clients concurrently', (done) => {
    const clientCount = 10;
    const clients: WebSocket[] = [];
    let messageReceivedCount = 0;
    let openCount = 0;
    let closeCount = 0;

    for (let i = 0; i < clientCount; i++) {
      const client = new WebSocket(`ws://localhost:${port}?token=${token}`);
      clients.push(client);

      client.on('open', () => {
        openCount++;
        if (openCount === clientCount) {
          // All connected, broadcast
          wsManager.broadcastAgentStatus('test-agent', 'online');
        }
      });

      client.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'agent:status') {
          messageReceivedCount++;
          if (messageReceivedCount === clientCount) {
            // All clients received the message, close them all
            clients.forEach(c => c.close());
          }
        }
      });

      client.on('close', () => {
        closeCount++;
        if (closeCount === clientCount) {
          // All clients closed, test complete
          done();
        }
      });
    }
  });
});
