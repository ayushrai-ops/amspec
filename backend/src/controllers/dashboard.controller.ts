import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { daysUntilExpiry } from '../utils/helpers';
import { AuthRequest } from '../types';

export class DashboardController {
  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalChemicals,
        expiredChemicals,
        nearExpiryChemicals,
        lowStockChemicals,
        totalCertificates,
        recentlyAdded,
        unreadNotifications,
      ] = await Promise.all([
        prisma.chemical.count(),
        prisma.chemical.count({ where: { status: 'EXPIRED' } }),
        prisma.chemical.count({ where: { status: 'NEAR_EXPIRY' } }),
        prisma.chemical.count({
          where: {
            quantity: { lte: prisma.chemical.fields.minStockLevel as any },
          },
        }).catch(() => 0), // Fallback if column comparison fails
        prisma.certificate.count(),
        prisma.chemical.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
        prisma.notification.count({ where: { userId: req.user!.id, isRead: false } }),
      ]);

      // Get low stock chemicals with a raw approach
      const lowStockActual = await prisma.$queryRaw<[{count: number | bigint}]>`
        SELECT COUNT(*) as count FROM chemicals WHERE quantity <= minStockLevel AND quantity > 0
      `.catch(() => [{ count: 0 }]);

      res.json({
        success: true,
        data: {
          totalChemicals,
          expiredChemicals,
          nearExpiryChemicals,
          lowStockChemicals: Number(lowStockActual[0]?.count || 0),
          totalCertificates,
          recentlyAdded,
          unreadNotifications,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getCharts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // 1. Expiry distribution (next 12 months)
      const chemicals = await prisma.chemical.findMany({
        select: { expiryDate: true, status: true, hazardClass: true, unit: true, quantity: true, name: true },
      });

      // Monthly expiry counts
      const expiryByMonth: Record<string, number> = {};
      const now = new Date();
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        expiryByMonth[key] = 0;
      }

      chemicals.forEach(c => {
        const expiry = new Date(c.expiryDate);
        const key = expiry.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (expiryByMonth[key] !== undefined) {
          expiryByMonth[key]++;
        }
      });

      // 2. Status distribution
      const statusDistribution = {
        safe: chemicals.filter(c => c.status === 'SAFE').length,
        nearExpiry: chemicals.filter(c => c.status === 'NEAR_EXPIRY').length,
        expired: chemicals.filter(c => c.status === 'EXPIRED').length,
      };

      // 3. Hazard class distribution
      const hazardDistribution: Record<string, number> = {};
      chemicals.forEach(c => {
        const key = c.hazardClass.replace(/_/g, ' ');
        hazardDistribution[key] = (hazardDistribution[key] || 0) + 1;
      });

      // 4. Recent transactions (last 30 days)
      const recentTransactions = await prisma.inventoryTransaction.findMany({
        where: { createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          chemical: { select: { name: true } },
          performedBy: { select: { firstName: true, lastName: true } },
        },
      });

      // 5. Top consumed chemicals
      const consumptionData = await prisma.inventoryTransaction.groupBy({
        by: ['chemicalId'],
        where: { transactionType: 'CONSUMPTION' },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      });

      // Resolve chemical names
      const topConsumed = await Promise.all(
        consumptionData.map(async (item) => {
          const chemical = await prisma.chemical.findUnique({
            where: { id: item.chemicalId },
            select: { name: true, unit: true },
          });
          return {
            name: chemical?.name || 'Unknown',
            consumed: item._sum.quantity || 0,
            unit: chemical?.unit || '',
          };
        })
      );

      res.json({
        success: true,
        data: {
          expiryByMonth: Object.entries(expiryByMonth).map(([month, count]) => ({ month, count })),
          statusDistribution,
          hazardDistribution: Object.entries(hazardDistribution).map(([name, value]) => ({ name, value })),
          recentTransactions,
          topConsumed,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecentChemicals(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const chemicals = await prisma.chemical.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          addedBy: { select: { firstName: true, lastName: true } },
        },
      });

      res.json({ success: true, data: chemicals });
    } catch (error) {
      next(error);
    }
  }
}

export default new DashboardController();
