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

  /**
   * Send a message to a specific agent session
   */
  async sendMessage(sessionId: string, message: string): Promise<{ success: boolean; message: string }> {
    try {
      logger.info('Sending message to agent session', { sessionId, messageLength: message.length });
      
      // Use openclaw agent command to send message to specific session
      const { stdout, stderr } = await execAsync(
        `openclaw agent --session-id "${sessionId}" --message "${message.replace(/"/g, '\\"')}" --json`,
        {
          timeout: 60000, // 60 seconds for agent to process
          maxBuffer: 1024 * 1024 * 10,
        }
      );
      
      if (stderr && !stderr.includes('🦞')) {
        logger.warn('Agent message stderr', { stderr });
      }
      
      logger.info('Message sent successfully', { sessionId });
      
      return {
        success: true,
        message: 'Message sent to agent session',
      };
    } catch (error: any) {
      logger.error('Failed to send message to agent', { 
        sessionId,
        error: error.message,
        stderr: error.stderr 
      });
      
      throw new Error(`SEND_MESSAGE_FAILED: ${error.message}`);
    }
  }

  /**
   * Disable heartbeat for an agent (pause/stop)
   * Note: This doesn't kill active sessions, just prevents automatic check-ins
   */
  async disableHeartbeat(agentId: string): Promise<{ success: boolean; message: string }> {
    try {
      logger.info('Disabling heartbeat for agent', { agentId });
      
      // Use config set to disable the agent's heartbeat
      const { stdout, stderr } = await execAsync(
        `openclaw config set "heartbeat.agents.${agentId}.enabled" false --json`,
        {
          timeout: 5000,
        }
      );
      
      if (stderr && !stderr.includes('🦞')) {
        logger.warn('Heartbeat disable stderr', { stderr });
      }
      
      logger.info('Heartbeat disabled', { agentId });
      
      return {
        success: true,
        message: `Heartbeat disabled for agent ${agentId}`,
      };
    } catch (error: any) {
      logger.error('Failed to disable heartbeat', { 
        agentId,
        error: error.message 
      });
      
      throw new Error(`DISABLE_HEARTBEAT_FAILED: ${error.message}`);
    }
  }

  /**
   * Enable heartbeat for an agent (restart/resume)
   */
  async enableHeartbeat(agentId: string, interval: string = '30m'): Promise<{ success: boolean; message: string }> {
    try {
      logger.info('Enabling heartbeat for agent', { agentId, interval });
      
      // Use config set to enable the agent's heartbeat
      await execAsync(
        `openclaw config set "heartbeat.agents.${agentId}.enabled" true --json`,
        {
          timeout: 5000,
        }
      );
      
      // Set the interval
      await execAsync(
        `openclaw config set "heartbeat.agents.${agentId}.every" "${interval}" --json`,
        {
          timeout: 5000,
        }
      );
      
      logger.info('Heartbeat enabled', { agentId, interval });
      
      return {
        success: true,
        message: `Heartbeat enabled for agent ${agentId} (every ${interval})`,
      };
    } catch (error: any) {
      logger.error('Failed to enable heartbeat', { 
        agentId,
        error: error.message 
      });
      
      throw new Error(`ENABLE_HEARTBEAT_FAILED: ${error.message}`);
    }
  }

  /**
   * Get full Gateway status including heartbeat settings
   */
  async getStatus(): Promise<GatewayStatusResponse> {
    try {
      const { stdout } = await execAsync('openclaw gateway call status --json', {
        timeout: 5000,
        maxBuffer: 1024 * 1024 * 10,
      });
      
      return JSON.parse(stdout);
    } catch (error: any) {
      throw new Error(`GET_STATUS_FAILED: ${error.message}`);
    }
  }
}

// Singleton instance
export const gatewayRealClient = new GatewayRealClient();
