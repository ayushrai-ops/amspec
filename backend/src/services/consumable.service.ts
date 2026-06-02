import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class ConsumableService {
  async getAll(filters: { labId?: string }) {
    const where: any = {};
    if (filters.labId) {
      where.labId = filters.labId;
    }
    return prisma.consumable.findMany({
      where,
      include: {
        lab: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getById(id: string) {
    const consumable = await prisma.consumable.findUnique({
      where: { id },
      include: {
        lab: {
          select: { id: true, name: true },
        },
      },
    });

    if (!consumable) {
      throw new AppError('Consumable item not found', 404);
    }

    return consumable;
  }

  async create(data: {
    name: string;
    category?: string;
    quantity: number;
    unit?: string;
    minStockLevel?: number;
    storageLocation?: string;
    labId: string;
  }) {
    // Validate lab exists
    const lab = await prisma.lab.findUnique({ where: { id: data.labId } });
    if (!lab) {
      throw new AppError('Associated Lab not found', 400);
    }

    return prisma.consumable.create({
      data,
    });
  }

  async update(id: string, data: any) {
    const existing = await prisma.consumable.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Consumable item not found', 404);
    }

    if (data.labId) {
      const lab = await prisma.lab.findUnique({ where: { id: data.labId } });
      if (!lab) {
        throw new AppError('Associated Lab not found', 400);
      }
    }

    return prisma.consumable.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const existing = await prisma.consumable.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Consumable item not found', 404);
    }

    return prisma.consumable.delete({ where: { id } });
  }
}

export default new ConsumableService();
