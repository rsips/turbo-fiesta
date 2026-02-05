/**
 * Audit Logging Middleware
 * 
 * Helper functions to easily integrate audit logging into routes.
 * Extracts IP address, user agent, and user info from requests.
 */

import { Request, Response, NextFunction } from 'express';
import { auditLog, getAuditLogService } from '../services/auditLogService';
import { AuditAction, AuditResult, AuditLogCreateInput } from '../types/audit';

/**
 * Extract client IP address from request
 */
export function getClientIp(req: Request): string | null {
  // Check common proxy headers
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) 
      ? forwardedFor[0] 
      : forwardedFor.split(',')[0];
    return ips.trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fall back to socket address
  return req.socket?.remoteAddress || null;
}

/**
 * Extract user agent from request
 */
export function getUserAgent(req: Request): string | undefined {
  const ua = req.headers['user-agent'];
  return Array.isArray(ua) ? ua[0] : ua;
}

/**
 * Create audit log entry from request context
 * Non-blocking - errors are logged but don't affect request
 */
export async function logAuditEvent(
  req: Request,
  action: AuditAction,
  resource: string,
  result: AuditResult,
  details?: string
): Promise<void> {
  const input: AuditLogCreateInput = {
    userId: req.user?.userId || null,
    username: req.user?.username || null,
    action,
    resource,
    result,
    details,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  };

  await auditLog(input);
}

/**
 * Log audit event with explicit user info (for login/failed login)
 */
export async function logAuditEventWithUser(
  req: Request,
  userId: string | null,
  username: string | null,
  action: AuditAction,
  resource: string,
  result: AuditResult,
  details?: string
): Promise<void> {
  const input: AuditLogCreateInput = {
    userId,
    username,
    action,
    resource,
    result,
    details,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  };

  await auditLog(input);
}

/**
 * Middleware factory for automatic audit logging
 * Logs after response is sent (non-blocking)
 */
export function auditMiddleware(
  action: AuditAction,
  getResource: (req: Request) => string,
  getDetails?: (req: Request, res: Response) => string | undefined
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Store original end function
    const originalEnd = res.end;
    
    // Override end to capture response
    res.end = function(chunk?: any, encoding?: any, callback?: any): Response {
      // Restore original end
      res.end = originalEnd;
      
      // Call original end
      const result = res.end(chunk, encoding, callback);
      
      // Determine result based on status code
      let auditResult: AuditResult;
      if (res.statusCode >= 200 && res.statusCode < 300) {
        auditResult = 'success';
      } else if (res.statusCode === 403) {
        auditResult = 'denied';
      } else {
        auditResult = 'failure';
      }
      
      // Log async (don't block response)
      setImmediate(async () => {
        const details = getDetails ? getDetails(req, res) : undefined;
        await logAuditEvent(req, action, getResource(req), auditResult, details);
      });
      
      return result;
    };
    
    next();
  };
}
