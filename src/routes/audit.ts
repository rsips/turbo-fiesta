/**
 * Audit Log API Routes
 * 
 * GET /api/audit-logs - Query audit logs (admin only)
 * 
 * Query Parameters:
 * - userId: Filter by user ID
 * - action: Filter by action type (can be comma-separated for multiple)
 * - startDate: Filter by start date (ISO 8601)
 * - endDate: Filter by end date (ISO 8601)
 * - limit: Max results (default 100, max 1000)
 * - offset: Pagination offset
 * - result: Filter by result (success/failure/denied)
 */

import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { requireRole } from '../middleware/auth';
import { getAuditLogService } from '../services/auditLogService';
import { AuditLogResponse, AuditAction, AuditResult } from '../types/audit';
import { logger } from '../utils/logger';

const router = Router();

// All audit log routes require admin role
router.use(requireRole(['admin']));

// Validation for query params
const auditLogQueryValidation = [
  query('userId').optional().isString(),
  query('action').optional().isString(),
  query('startDate').optional().isISO8601().withMessage('startDate must be ISO 8601 format'),
  query('endDate').optional().isISO8601().withMessage('endDate must be ISO 8601 format'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  query('result').optional().isIn(['success', 'failure', 'denied']),
];

/**
 * GET /api/audit-logs
 * Query audit logs with filters
 */
router.get('/', auditLogQueryValidation, async (req: Request, res: Response) => {
  try {
    // Validate query params
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response: AuditLogResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: errors.array().map(e => e.msg).join(', '),
        },
      };
      return res.status(400).json(response);
    }

    const { userId, action, startDate, endDate, limit, offset, result } = req.query;

    // Parse action - can be comma-separated for multiple
    let actionFilter: AuditAction | AuditAction[] | undefined;
    if (action) {
      const actionStr = action as string;
      if (actionStr.includes(',')) {
        actionFilter = actionStr.split(',').map(a => a.trim()) as AuditAction[];
      } else {
        actionFilter = actionStr as AuditAction;
      }
    }

    const auditService = getAuditLogService();
    const queryResult = await auditService.query({
      userId: userId as string | undefined,
      action: actionFilter,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      result: result as AuditResult | undefined,
    });

    logger.info('Admin queried audit logs', {
      adminId: req.user!.userId,
      filters: { userId, action, startDate, endDate, limit, offset, result },
      resultCount: queryResult.count,
      total: queryResult.total,
    });

    const response: AuditLogResponse = {
      success: true,
      data: {
        logs: queryResult.logs,
        count: queryResult.count,
        total: queryResult.total,
        hasMore: queryResult.hasMore,
      },
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Failed to query audit logs', { error: error.message });

    const response: AuditLogResponse = {
      success: false,
      error: {
        code: 'QUERY_FAILED',
        message: 'Failed to query audit logs',
        details: error.message,
      },
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/audit-logs/stats
 * Get audit log statistics (for dashboard)
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const auditService = getAuditLogService();
    
    // Get last 24 hours of logs
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 24);
    
    const recentLogs = await auditService.query({
      startDate: startDate.toISOString(),
      limit: 1000,
    });

    // Calculate stats
    const stats = {
      last24Hours: {
        total: recentLogs.total,
        byAction: {} as Record<string, number>,
        byResult: {
          success: 0,
          failure: 0,
          denied: 0,
        },
      },
    };

    for (const log of recentLogs.logs) {
      // Count by action
      stats.last24Hours.byAction[log.action] = 
        (stats.last24Hours.byAction[log.action] || 0) + 1;
      
      // Count by result
      stats.last24Hours.byResult[log.result]++;
    }

    logger.info('Admin retrieved audit log stats', {
      adminId: req.user!.userId,
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error('Failed to get audit log stats', { error: error.message });

    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_FAILED',
        message: 'Failed to get audit log statistics',
        details: error.message,
      },
    });
  }
});

export { router as auditRouter };
