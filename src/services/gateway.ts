// OpenClaw Gateway client service

import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { GatewaySession, GatewaySessionsResponse } from '../types/gateway';
import { logger } from '../utils/logger';

export class GatewayClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.gateway.baseUrl,
      timeout: config.gateway.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Fetch all sessions from Gateway
   */
  async getSessions(): Promise<GatewaySession[]> {
    try {
      logger.debug('Fetching sessions from Gateway', { 
        url: config.gateway.baseUrl + config.gateway.sessionsPath 
      });
      
      const response = await this.client.get<GatewaySessionsResponse>(
        config.gateway.sessionsPath
      );
      
      logger.debug('Received Gateway response', { 
        sessionCount: response.data.sessions?.length || 0 
      });
      
      return response.data.sessions || [];
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        logger.error('Gateway connection refused', { 
          url: config.gateway.baseUrl 
        });
        throw new Error('GATEWAY_UNAVAILABLE: Cannot connect to OpenClaw Gateway');
      }
      
      if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
        logger.error('Gateway timeout', { 
          timeout: config.gateway.timeout 
        });
        throw new Error('GATEWAY_TIMEOUT: OpenClaw Gateway did not respond in time');
      }
      
      logger.error('Gateway request failed', { 
        error: error.message,
        code: error.code 
      });
      
      throw new Error(`GATEWAY_ERROR: ${error.message}`);
    }
  }

  /**
   * Health check for Gateway
   */
  async checkHealth(): Promise<boolean> {
    try {
      await this.client.get('/health', { timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const gatewayClient = new GatewayClient();
