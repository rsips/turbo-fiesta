// OpenClaw Gateway client using CLI (real implementation)

import { exec } from 'child_process';
import { promisify } from 'util';
import { GatewayStatusResponse, GatewaySessionItem } from '../types/gateway';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

export class GatewayRealClient {
  /**
   * Fetch sessions from Gateway using CLI
   */
  async getSessions(): Promise<GatewaySessionItem[]> {
    try {
      logger.debug('Fetching sessions from Gateway CLI');
      
      const { stdout, stderr } = await execAsync('openclaw gateway call status --json', {
        timeout: 5000,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });
      
      if (stderr && !stderr.includes('🦞')) {
        // Ignore the OpenClaw banner in stderr
        logger.warn('Gateway CLI stderr', { stderr });
      }
      
      const response: GatewayStatusResponse = JSON.parse(stdout);
      
      if (!response.sessions || !response.sessions.recent) {
        logger.warn('No sessions found in Gateway response');
        return [];
      }
      
      logger.debug('Received Gateway sessions', { 
        count: response.sessions.count,
        recent: response.sessions.recent.length 
      });
      
      return response.sessions.recent;
    } catch (error: any) {
      if (error.code === 'ETIMEDOUT') {
        logger.error('Gateway CLI timeout');
        throw new Error('GATEWAY_TIMEOUT: OpenClaw Gateway CLI did not respond in time');
      }
      
      if (error.message?.includes('command not found')) {
        logger.error('OpenClaw CLI not found');
        throw new Error('GATEWAY_UNAVAILABLE: openclaw command not found');
      }
      
      logger.error('Gateway CLI request failed', { 
        error: error.message,
        stderr: error.stderr 
      });
      
      throw new Error(`GATEWAY_ERROR: ${error.message}`);
    }
  }

  /**
   * Health check for Gateway using CLI
   */
  async checkHealth(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('openclaw gateway call health --json', {
        timeout: 2000,
      });
      const health = JSON.parse(stdout);
      return health.status === 'ok' || health.healthy === true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const gatewayRealClient = new GatewayRealClient();
