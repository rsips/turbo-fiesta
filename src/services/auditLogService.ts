/**
 * Audit Log Service
 * 
 * Provides immutable, append-only audit logging with:
 * - Async/non-blocking logging
 * - Query with filters (userId, action, date range, pagination)
 * - 90-day retention policy with auto-cleanup
 * - JSON file storage (easy to migrate to DB later)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { 
  AuditLogEntry, 
  AuditLogCreateInput, 
  AuditLogQuery,
  AuditAction,
  AuditResult 
} from '../types/audit';
import { logger } from '../utils/logger';

// Default retention period in days
const DEFAULT_RETENTION_DAYS = 90;
const MAX_QUERY_LIMIT = 1000;
const DEFAULT_QUERY_LIMIT = 100;

export class AuditLogService {
  private storagePath: string;
  private logs: AuditLogEntry[] = [];
  private isMemory: boolean;
  private writeQueue: AuditLogEntry[] = [];
  private writeTimeout: NodeJS.Timeout | null = null;
  private readonly WRITE_DEBOUNCE_MS = 100;

  constructor(storagePath: string = 'data/audit-logs.json') {
    this.storagePath = storagePath;
    this.isMemory = storagePath === ':memory:';
    
    if (!this.isMemory) {
      this.loadFromDisk();
    }
  }

  /**
   * Log an audit entry (async, non-blocking)
   */
  async log(input: AuditLogCreateInput): Promise<AuditLogEntry> {
    const entry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userId: input.userId ?? null,
      username: input.username ?? null,
      action: input.action,
      resource: input.resource,
      result: input.result,
      details: input.details,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent,
    };

    // Sanitize: ensure no sensitive data in details
    if (entry.details) {
      entry.details = this.sanitizeDetails(entry.details);
    }

    // Append to in-memory log (immutable - no modification after creation)
    this.logs.push(entry);

    // Schedule async write to disk
    if (!this.isMemory) {
      this.scheduleWrite(entry);
    }

    logger.debug('Audit log created', { 
      id: entry.id, 
      action: entry.action, 
      userId: entry.userId 
    });

    return entry;
  }

  /**
   * Query audit logs with filters
   */
  async query(filters: AuditLogQuery): Promise<{
    logs: AuditLogEntry[];
    count: number;
    total: number;
    hasMore: boolean;
  }> {
    let results = [...this.logs];

    // Filter by userId
    if (filters.userId) {
      results = results.filter(log => log.userId === filters.userId);
    }

    // Filter by action(s)
    if (filters.action) {
      const actions = Array.isArray(filters.action) ? filters.action : [filters.action];
      results = results.filter(log => actions.includes(log.action));
    }

    // Filter by result
    if (filters.result) {
      results = results.filter(log => log.result === filters.result);
    }

    // Filter by date range
    if (filters.startDate) {
      const startTime = new Date(filters.startDate).getTime();
      results = results.filter(log => new Date(log.timestamp).getTime() >= startTime);
    }

    if (filters.endDate) {
      const endTime = new Date(filters.endDate).getTime();
      results = results.filter(log => new Date(log.timestamp).getTime() <= endTime);
    }

    // Sort by timestamp descending (newest first)
    results.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const total = results.length;

    // Apply pagination
    const limit = Math.min(filters.limit || DEFAULT_QUERY_LIMIT, MAX_QUERY_LIMIT);
    const offset = filters.offset || 0;
    
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      logs: paginatedResults,
      count: paginatedResults.length,
      total,
      hasMore: offset + paginatedResults.length < total,
    };
  }

  /**
   * Cleanup logs older than retention period
   * @param retentionDays Number of days to retain logs (default: 90)
   * @returns Number of logs removed
   */
  async cleanup(retentionDays: number = DEFAULT_RETENTION_DAYS): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffTime = cutoffDate.getTime();

    const originalCount = this.logs.length;

    // Remove old logs
    this.logs = this.logs.filter(
      log => new Date(log.timestamp).getTime() > cutoffTime
    );

    const removedCount = originalCount - this.logs.length;

    if (removedCount > 0) {
      logger.info('Audit log cleanup completed', { 
        removedCount, 
        retentionDays,
        remainingCount: this.logs.length,
      });

      // Persist changes
      if (!this.isMemory) {
        await this.saveToDisk();
      }
    }

    return removedCount;
  }

  /**
   * Clear all logs (for testing only)
   */
  async clear(): Promise<void> {
    this.logs = [];
    if (!this.isMemory) {
      await this.saveToDisk();
    }
  }

  /**
   * Get total count of logs
   */
  async count(): Promise<number> {
    return this.logs.length;
  }

  // ===========================================
  // Private Methods
  // ===========================================

  /**
   * Sanitize details to remove any sensitive information
   */
  private sanitizeDetails(details: string): string {
    // Remove potential passwords, tokens, secrets
    const sensitivePatterns = [
      /password[:\s]*[^\s,}]*/gi,
      /token[:\s]*[^\s,}]*/gi,
      /secret[:\s]*[^\s,}]*/gi,
      /api[_-]?key[:\s]*[^\s,}]*/gi,
      /bearer\s+[a-zA-Z0-9._-]+/gi,
      /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+/g, // JWT pattern
    ];

    let sanitized = details;
    for (const pattern of sensitivePatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }

    return sanitized;
  }

  /**
   * Schedule debounced write to disk
   */
  private scheduleWrite(entry: AuditLogEntry): void {
    this.writeQueue.push(entry);

    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
    }

    this.writeTimeout = setTimeout(async () => {
      await this.saveToDisk();
      this.writeQueue = [];
    }, this.WRITE_DEBOUNCE_MS);
  }

  /**
   * Load logs from disk
   */
  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.storagePath)) {
        const data = fs.readFileSync(this.storagePath, 'utf-8');
        this.logs = JSON.parse(data);
        logger.info('Audit logs loaded from disk', { count: this.logs.length });
      }
    } catch (error: any) {
      logger.warn('Failed to load audit logs from disk', { error: error.message });
      this.logs = [];
    }
  }

  /**
   * Save logs to disk (append-only semantics preserved in memory)
   */
  private async saveToDisk(): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write atomically using temp file
      const tempPath = `${this.storagePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.logs, null, 2));
      fs.renameSync(tempPath, this.storagePath);

      logger.debug('Audit logs saved to disk', { count: this.logs.length });
    } catch (error: any) {
      logger.error('Failed to save audit logs to disk', { error: error.message });
    }
  }
}

// Singleton instance for application use
let auditLogServiceInstance: AuditLogService | null = null;

export function getAuditLogService(): AuditLogService {
  if (!auditLogServiceInstance) {
    const storagePath = process.env.AUDIT_LOG_PATH || 'data/audit-logs.json';
    auditLogServiceInstance = new AuditLogService(storagePath);
  }
  return auditLogServiceInstance;
}

// Export convenience function for logging (async, non-blocking)
export async function auditLog(input: AuditLogCreateInput): Promise<void> {
  try {
    await getAuditLogService().log(input);
  } catch (error: any) {
    // Never let audit logging crash the application
    logger.error('Audit logging failed (non-critical)', { error: error.message });
  }
}
