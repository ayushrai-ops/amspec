import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class GlasswareService {
  async getAll(filters: { labId?: string }) {
    const where: any = {};
    if (filters.labId) {
      where.labId = filters.labId;
    }
    return prisma.glassware.findMany({
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
    const glassware = await prisma.glassware.findUnique({
      where: { id },
      include: {
        lab: {
          select: { id: true, name: true },
        },
      },
    });

    if (!glassware) {
      throw new AppError('Glassware item not found', 404);
    }

    return glassware;
  }

  async create(data: {
    name: string;
    type: string;
    size?: string;
    quantity: number;
    minStockLevel?: number;
    storageLocation?: string;
    labId: string;
  }) {
    // Validate lab exists
    const lab = await prisma.lab.findUnique({ where: { id: data.labId } });
    if (!lab) {
      throw new AppError('Associated Lab not found', 400);
    }

    return prisma.glassware.create({
      data,
    });
  }

  async update(id: string, data: any) {
    const existing = await prisma.glassware.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Glassware item not found', 404);
    }

    if (data.labId) {
      const lab = await prisma.lab.findUnique({ where: { id: data.labId } });
      if (!lab) {
        throw new AppError('Associated Lab not found', 400);
      }
    }

    return prisma.glassware.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const existing = await prisma.glassware.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Glassware item not found', 404);
    }

    return prisma.glassware.delete({ where: { id } });
  }
}

export default new GlasswareService();
