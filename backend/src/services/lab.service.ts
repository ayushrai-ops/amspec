import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthUser } from '../types';
import labAccessService from './labAccess.service';

export class LabService {
  /**
   * Get all labs. Admins see all; others see only labs they have active access to.
   */
  async getAll(user: AuthUser) {
    let where: any = {};

    // Non-admin users can only see labs they have access to
    if (user.role !== 'ADMIN') {
      const accessibleLabIds = await labAccessService.getUserAccessibleLabIds(user.id);
      if (accessibleLabIds.length === 0) {
        return [];
      }
      where.id = { in: accessibleLabIds };
    }

    return prisma.lab.findMany({
      where,
      include: {
        _count: {
          select: {
            chemicals: true,
            glassware: true,
            consumables: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get lab by ID. Admins can access any lab; others need active access.
   */
  async getById(id: string, user: AuthUser) {
    // Non-admin: verify they have access
    if (user.role !== 'ADMIN') {
      const accessLevel = await labAccessService.getUserAccessLevel(user.id, id);
      if (!accessLevel || accessLevel === 'NONE') {
        throw new AppError('Access denied: you do not have permission to view this lab', 403);
      }
    }

    const lab = await prisma.lab.findUnique({
      where: { id },
      include: {
        chemicals: {
          orderBy: { name: 'asc' },
        },
        glassware: {
          orderBy: { name: 'asc' },
        },
        consumables: {
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!lab) {
      throw new AppError('Lab not found', 404);
    }

    // Attach the user's access level to the response
    let userAccessLevel = 'FULL_ACCESS'; // Admin default
    if (user.role !== 'ADMIN') {
      userAccessLevel = (await labAccessService.getUserAccessLevel(user.id, id)) || 'NONE';
    }

    return { ...lab, userAccessLevel };
  }

  async create(data: { name: string; description?: string; continent?: string; country?: string }) {
    const existing = await prisma.lab.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new AppError('A lab with this name already exists', 400);
    }

    return prisma.lab.create({
      data,
    });
  }

  async update(id: string, data: { name?: string; description?: string; continent?: string; country?: string }) {
    const existing = await prisma.lab.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Lab not found', 404);
    }

    if (data.name && data.name !== existing.name) {
      const nameConflict = await prisma.lab.findUnique({
        where: { name: data.name },
      });
      if (nameConflict) {
        throw new AppError('A lab with this name already exists', 400);
      }
    }

    return prisma.lab.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const existing = await prisma.lab.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Lab not found', 404);
    }

    return prisma.lab.delete({ where: { id } });
  }
}

export default new LabService();
