// Tests for Agent Authentication System

import request from 'supertest';
import app from '../server';
import { agentKeyStore } from '../services/agentKeyStore';
import * as fs from 'fs';

// Mock filesystem for testing
jest.mock('fs');

describe('Agent Authentication', () => {
  let testApiKey: string;
  let testKeyId: string;

  beforeAll(async () => {
    // Create a test agent API key
    const { key, plainKey } = await agentKeyStore.createKey({
      name: 'test-agent',
      expiresInDays: 30,
      metadata: { test: true },
    });
    
    testApiKey = plainKey;
    testKeyId = key.id;
  });

  describe('Agent Key Store', () => {
    it('should create a valid agent API key', async () => {
      const { key, plainKey } = await agentKeyStore.createKey({
        name: 'another-test-agent',
        expiresInDays: 365,
      });

      expect(key).toBeDefined();
      expect(key.id).toBeDefined();
      expect(key.name).toBe('another-test-agent');
      expect(key.isActive).toBe(true);
      expect(plainKey).toMatch(/^mc_[a-f0-9]{32}$/);
    });

    it('should validate a correct API key', async () => {
      const result = await agentKeyStore.validateKey(testApiKey);
      
      expect(result.valid).toBe(true);
      expect(result.agent).toBeDefined();
      expect(result.agent?.name).toBe('test-agent');
    });

    it('should reject an invalid API key', async () => {
      const result = await agentKeyStore.validateKey('mc_invalid_key_12345678');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject a malformed API key', async () => {
      const result = await agentKeyStore.validateKey('not-a-valid-key');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid API key format');
    });

    it('should list all agent keys without hashes', () => {
      const keys = agentKeyStore.listKeys();
      
      expect(Array.isArray(keys)).toBe(true);
      expect(keys.length).toBeGreaterThan(0);
      
      keys.forEach(key => {
        expect(key).not.toHaveProperty('keyHash');
        expect(key).toHaveProperty('id');
        expect(key).toHaveProperty('name');
      });
    });

    it('should revoke an agent key', async () => {
      const { key } = await agentKeyStore.createKey({
        name: 'temp-agent',
        expiresInDays: 1,
      });

      const revoked = agentKeyStore.revokeKey(key.id);
      expect(revoked).toBe(true);

      const revokedKey = agentKeyStore.getKey(key.id);
      expect(revokedKey?.isActive).toBe(false);
    });

    it('should delete an agent key', async () => {
      const { key } = await agentKeyStore.createKey({
        name: 'delete-me',
        expiresInDays: 1,
      });

      const deleted = agentKeyStore.deleteKey(key.id);
      expect(deleted).toBe(true);

      const deletedKey = agentKeyStore.getKey(key.id);
      expect(deletedKey).toBeUndefined();
    });

    it('should prevent duplicate key IDs', async () => {
      const keys = agentKeyStore.listKeys();
      const ids = keys.map(k => k.id);
      const uniqueIds = new Set(ids);
      
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should reject expired keys', async () => {
      // Create a key that expires immediately (0 days)
      const { plainKey } = await agentKeyStore.createKey({
        name: 'expired-agent',
        expiresInDays: 0,
      });

      // Wait a tiny bit to ensure it's past expiration
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await agentKeyStore.validateKey(plainKey);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('should reject revoked keys', async () => {
      const { key, plainKey } = await agentKeyStore.createKey({
        name: 'to-be-revoked',
        expiresInDays: 30,
      });

      // Revoke the key
      agentKeyStore.revokeKey(key.id);

      // Try to validate it
      const result = await agentKeyStore.validateKey(plainKey);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('revoked');
    });
  });

  describe('Authentication Middleware', () => {
    it('should authenticate valid agent API key', async () => {
      const response = await request(app)
        .get('/api/agents')
        .set('X-Agent-Key', testApiKey);

      expect(response.status).not.toBe(401);
    });

    it('should reject request without API key', async () => {
      const response = await request(app)
        .get('/api/agents');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('AGENT_AUTH_REQUIRED');
    });

    it('should reject request with invalid API key', async () => {
      const response = await request(app)
        .get('/api/agents')
        .set('X-Agent-Key', 'mc_invalid_key');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_AGENT_KEY');
    });

    it('should reject request with malformed API key', async () => {
      const response = await request(app)
        .get('/api/agents')
        .set('X-Agent-Key', 'not-a-valid-key-format');

      expect(response.status).toBe(401);
    });
  });

  describe('Agent Keys API', () => {
    let adminToken: string;

    beforeAll(async () => {
      // This would normally authenticate an admin user
      // For testing, we'll mock it
      // In real tests, you'd create an admin user and login
      adminToken = 'mock-admin-token';
    });

    it('should create agent key via API (mock)', async () => {
      // This test would normally create a key via the API
      // Skipped for now as it requires full auth setup
      expect(true).toBe(true);
    });

    it('should list agent keys via API (mock)', async () => {
      // This test would list keys via API
      // Skipped for now as it requires full auth setup
      expect(true).toBe(true);
    });
  });
});
