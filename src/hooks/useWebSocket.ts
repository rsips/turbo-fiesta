/**
 * WebSocket Hook for Real-time Updates
 * Connects to audit event stream for live activity feed
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { AuditLogEntry, AuditWebSocketMessage } from '../types/audit';

interface UseWebSocketOptions {
  enabled?: boolean;
  onMessage?: (entry: AuditLogEntry) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnect: () => void;
}

export function useAuditWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    enabled = true,
    onMessage,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const onMessageRef = useRef(onMessage);

  // Keep callback ref updated
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (!enabled) return;
    
    // Get token for authentication
    const token = localStorage.getItem('mission_control_token');
    if (!token) {
      setError('Not authenticated');
      return;
    }

    // Determine WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws/audit?token=${encodeURIComponent(token)}`;

    setIsConnecting(true);
    setError(null);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectCountRef.current = 0;
        console.log('[RiskAssessment] WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const message: AuditWebSocketMessage = JSON.parse(event.data);
          if (message.type === 'audit.new' || message.type === 'audit.update') {
            onMessageRef.current?.(message.payload);
          }
        } catch (err) {
          console.warn('[RiskAssessment] Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[RiskAssessment] WebSocket error:', event);
        setError('Connection error');
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;

        if (!event.wasClean && enabled) {
          // Attempt reconnection
          if (reconnectCountRef.current < reconnectAttempts) {
            reconnectCountRef.current += 1;
            const delay = reconnectInterval * reconnectCountRef.current;
            console.log(`[RiskAssessment] Reconnecting in ${delay}ms (attempt ${reconnectCountRef.current})`);
            
            reconnectTimeoutRef.current = window.setTimeout(() => {
              connect();
            }, delay);
          } else {
            setError('Connection lost. Click to reconnect.');
          }
        }
      };
    } catch (err) {
      setIsConnecting(false);
      setError('Failed to connect');
      console.error('[RiskAssessment] WebSocket connection failed:', err);
    }
  }, [enabled, reconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const reconnect = useCallback(() => {
    reconnectCountRef.current = 0;
    disconnect();
    connect();
  }, [connect, disconnect]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (enabled) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    reconnect,
  };
}
