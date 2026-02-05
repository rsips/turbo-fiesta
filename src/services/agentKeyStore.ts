// Agent API Key Store - Manages agent authentication keys

import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { AgentApiKey, CreateAgentApiKeyRequest, ValidateAgentKeyResult } from '../types/agentAuth';
import { logger } from '../utils/logger';

const AGENT_KEYS_FILE = process.env.AGENT_KEYS_FILE || './data/agent-keys.json';

class AgentKeyStore {
  private keys: Map<string, AgentApiKey> = new Map();
  private initialized = false;

  constructor() {
    this.load();
  }

  /**
   * Load agent keys from disk
   */
  private load(): void {
    try {
      // Ensure data directory exists
      const dir = path.dirname(AGENT_KEYS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(AGENT_KEYS_FILE)) {
        const data = fs.readFileSync(AGENT_KEYS_FILE, 'utf-8');
        const keys: AgentApiKey[] = JSON.parse(data);
        
        keys.forEach(key => {
          // Convert date strings back to Date objects
          key.createdAt = new Date(key.createdAt);
          if (key.lastUsedAt) key.lastUsedAt = new Date(key.lastUsedAt);
          if (key.expiresAt) key.expiresAt = new Date(key.expiresAt);
          
          this.keys.set(key.id, key);
        });
        
        logger.info('Agent keys loaded', { count: this.keys.size });
      } else {
        logger.info('No agent keys file found, starting fresh');
      }
      
      this.initialized = true;
    } catch (error: any) {
      logger.error('Failed to load agent keys', { error: error.message });
      this.initialized = true; // Continue with empty store
    }
  }

  /**
   * Save agent keys to disk
   */
  private save(): void {
    try {
      const keysArray = Array.from(this.keys.values());
      const data = JSON.stringify(keysArray, null, 2);
      
      // Ensure data directory exists
      const dir = path.dirname(AGENT_KEYS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(AGENT_KEYS_FILE, data, 'utf-8');
      logger.debug('Agent keys saved', { count: this.keys.size });
    } catch (error: any) {
      logger.error('Failed to save agent keys', { error: error.message });
    }
  }

  /**
   * Generate a secure API key
   */
  private generateApiKey(): string {
    // Format: mc_<32 hex chars> (mission-control prefix)
    const randomPart = randomBytes(16).toString('hex');
    return `mc_${randomPart}`;
  }

  /**
   * Create a new agent API key
   */
  async createKey(request: CreateAgentApiKeyRequest): Promise<{ key: AgentApiKey; plainKey: string }> {
    const plainKey = this.generateApiKey();
    const keyHash = await bcrypt.hash(plainKey, 10);
    
    const key: AgentApiKey = {
      id: randomBytes(8).toString('hex'),
      name: request.name,
      keyHash,
      createdAt: new Date(),
      isActive: true,
      permissions: request.permissions,
      metadata: request.metadata,
    };
    
    // Set expiration if requested
    if (request.expiresInDays) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + request.expiresInDays);
      key.expiresAt = expiresAt;
    }
    
    this.keys.set(key.id, key);
    this.save();
    
    logger.info('Agent API key created', { 
      id: key.id, 
      name: key.name,
      expiresAt: key.expiresAt?.toISOString(),
    });
    
    return { key, plainKey };
  }

  /**
   * Validate an API key
   */
  async validateKey(apiKey: string): Promise<ValidateAgentKeyResult> {
    if (!apiKey || !apiKey.startsWith('mc_')) {
      return { valid: false, error: 'Invalid API key format' };
    }

    // Find matching key by comparing hashes
    for (const [id, key] of this.keys.entries()) {
      if (!key.isActive) continue;
      
      // Check expiration
      if (key.expiresAt && key.expiresAt < new Date()) {
        continue;
      }
      
      // Compare hash
      const match = await bcrypt.compare(apiKey, key.keyHash);
      if (match) {
        // Update last used timestamp
        key.lastUsedAt = new Date();
        this.save();
        
        return { valid: true, agent: key };
      }
    }

    return { valid: false, error: 'Invalid or expired API key' };
  }

  /**
   * List all agent keys (without sensitive data)
   */
  listKeys(): Omit<AgentApiKey, 'keyHash'>[] {
    return Array.from(this.keys.values()).map(({ keyHash, ...key }) => key);
  }

  /**
   * Get a specific key by ID
   */
  getKey(id: string): AgentApiKey | undefined {
    return this.keys.get(id);
  }

  /**
   * Revoke (deactivate) an agent key
   */
  revokeKey(id: string): boolean {
    const key = this.keys.get(id);
    if (!key) return false;
    
    key.isActive = false;
    this.save();
    
    logger.info('Agent API key revoked', { id, name: key.name });
    return true;
  }

  /**
   * Delete an agent key permanently
   */
  deleteKey(id: string): boolean {
    const key = this.keys.get(id);
    if (!key) return false;
    
    this.keys.delete(id);
    this.save();
    
    logger.info('Agent API key deleted', { id, name: key.name });
    return true;
  }
}

// Singleton instance
export const agentKeyStore = new AgentKeyStore();
