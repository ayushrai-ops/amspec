import prisma from '../config/database';
import { parsePagination } from '../utils/helpers';

export class NotificationService {
  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string, filters: {
    page?: string;
    limit?: string;
    isRead?: string;
    type?: string;
  }) {
    const { page, limit, skip } = parsePagination(filters.page, filters.limit);
    const where: any = { userId };

    if (filters.isRead !== undefined) where.isRead = filters.isRead === 'true';
    if (filters.type) where.type = filters.type;

    const [data, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          chemical: { select: { id: true, name: true } },
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      data,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) return null;

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { updated: result.count };
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Create a notification
   */
  async create(data: {
    title: string;
    message: string;
    type: any;
    priority: any;
    userId: string;
    chemicalId?: string;
  }) {
    return prisma.notification.create({ data });
  }
}

export default new NotificationService();
