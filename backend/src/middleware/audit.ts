import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';

/**
 * Audit log middleware - creates audit trail entries
 * Use as: auditAction('CREATE', 'Chemical')
 */
export const auditAction = (action: string, entityType: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    // Store original json method to intercept response
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const entityId = req.params.id || body?.data?.id;

        prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action,
            entityType,
            entityId: entityId || null,
            previousData: req.method === 'PUT' || req.method === 'DELETE' ? (body?.previousData || null) : null,
            newData: req.method !== 'DELETE' ? (req.body || null) : null,
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
            userAgent: req.headers['user-agent'] || null,
          },
        }).catch(err => console.error('Audit log error:', err));
      }

      return originalJson(body);
    } as any;

    next();
  };
};
