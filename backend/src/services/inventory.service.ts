import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { parsePagination } from '../utils/helpers';

export class InventoryService {
  /**
   * Record chemical consumption
   */
  async consume(chemicalId: string, quantity: number, reason: string | undefined, userId: string) {
    const chemical = await prisma.chemical.findUnique({ where: { id: chemicalId } });
    if (!chemical) throw new AppError('Chemical not found', 404);
    if (chemical.quantity < quantity) throw new AppError('Insufficient stock', 400);

    const balanceBefore = chemical.quantity;
    const balanceAfter = chemical.quantity - quantity;

    // Update chemical quantity
    await prisma.chemical.update({
      where: { id: chemicalId },
      data: { quantity: balanceAfter },
    });

    // Check low stock
    if (balanceAfter <= chemical.minStockLevel) {
      // Create low stock notification for lab managers
      const managers = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'LAB_MANAGER'] }, isActive: true },
      });
      for (const manager of managers) {
        await prisma.notification.create({
          data: {
            title: 'Low Stock Alert',
            message: `${chemical.name} is running low. Remaining: ${balanceAfter} ${chemical.unit}`,
            type: 'LOW_STOCK',
            priority: 'HIGH',
            userId: manager.id,
            chemicalId: chemical.id,
          },
        });
      }
    }

    // Create transaction record
    const transaction = await prisma.inventoryTransaction.create({
      data: {
        chemicalId,
        transactionType: 'CONSUMPTION',
        quantity,
        balanceBefore,
        balanceAfter,
        reason,
        performedById: userId,
      },
      include: {
        chemical: { select: { name: true } },
        performedBy: { select: { firstName: true, lastName: true } },
      },
    });

    return transaction;
  }

  /**
   * Record chemical disposal
   */
  async dispose(chemicalId: string, quantity: number, reason: string, userId: string) {
    const chemical = await prisma.chemical.findUnique({ where: { id: chemicalId } });
    if (!chemical) throw new AppError('Chemical not found', 404);
    if (chemical.quantity < quantity) throw new AppError('Cannot dispose more than available stock', 400);

    const balanceBefore = chemical.quantity;
    const balanceAfter = chemical.quantity - quantity;

    await prisma.chemical.update({
      where: { id: chemicalId },
      data: { quantity: balanceAfter },
    });

    const transaction = await prisma.inventoryTransaction.create({
      data: {
        chemicalId,
        transactionType: 'DISPOSAL',
        quantity,
        balanceBefore,
        balanceAfter,
        reason,
        performedById: userId,
      },
      include: {
        chemical: { select: { name: true } },
        performedBy: { select: { firstName: true, lastName: true } },
      },
    });

    return transaction;
  }

  /**
   * Get transaction history
   */
  async getTransactions(filters: {
    page?: string;
    limit?: string;
    chemicalId?: string;
    transactionType?: string;
  }) {
    const { page, limit, skip } = parsePagination(filters.page, filters.limit);
    const where: any = {};

    if (filters.chemicalId) where.chemicalId = filters.chemicalId;
    if (filters.transactionType) where.transactionType = filters.transactionType;

    const [data, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          chemical: { select: { id: true, name: true, unit: true } },
          performedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.inventoryTransaction.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}

export default new InventoryService();
