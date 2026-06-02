import prisma from '../config/database';
import { parsePagination } from '../utils/helpers';

export class AuditService {
  /**
   * Get audit logs with pagination and filtering
   */
  async getLogs(filters: {
    page?: string;
    limit?: string;
    userId?: string;
    entityType?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page, limit, skip } = parsePagination(filters.page, filters.limit);
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' };
    if (filters.startDate) where.createdAt = { gte: new Date(filters.startDate) };
    if (filters.endDate) where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate) };

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, role: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}

export default new AuditService();
