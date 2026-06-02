import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { LabAccessLevel } from '@prisma/client';

export class LabAccessService {
  /**
   * Grant or update access for a user to a lab.
   */
  async grantAccess(data: {
    userId: string;
    labId: string;
    accessLevel: LabAccessLevel;
    grantedBy: string;
    isTemporary?: boolean;
    expiresAt?: string | null;
  }) {
    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new AppError('User not found', 404);

    // Verify lab exists
    const lab = await prisma.lab.findUnique({ where: { id: data.labId } });
    if (!lab) throw new AppError('Lab not found', 404);

    // Upsert — create or update
    return prisma.labAccess.upsert({
      where: {
        userId_labId: { userId: data.userId, labId: data.labId },
      },
      create: {
        userId: data.userId,
        labId: data.labId,
        accessLevel: data.accessLevel,
        grantedBy: data.grantedBy,
        isTemporary: data.isTemporary || false,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
      update: {
        accessLevel: data.accessLevel,
        grantedBy: data.grantedBy,
        isTemporary: data.isTemporary || false,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  }

  /**
   * Revoke access — delete the record entirely.
   */
  async revokeAccess(userId: string, labId: string) {
    const existing = await prisma.labAccess.findUnique({
      where: { userId_labId: { userId, labId } },
    });

    if (!existing) {
      throw new AppError('Access record not found', 404);
    }

    return prisma.labAccess.delete({
      where: { userId_labId: { userId, labId } },
    });
  }

  /**
   * Get all access records for a lab (admin view).
   */
  async getAccessForLab(labId: string) {
    return prisma.labAccess.findMany({
      where: { labId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            department: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a user's effective access level for a specific lab.
   * Returns null if no access record exists.
   * Returns NONE if access has expired.
   */
  async getUserAccessLevel(userId: string, labId: string): Promise<LabAccessLevel | null> {
    const access = await prisma.labAccess.findUnique({
      where: { userId_labId: { userId, labId } },
    });

    if (!access) return null;

    // Check if temporary access has expired
    if (access.isTemporary && access.expiresAt && new Date() > access.expiresAt) {
      return 'NONE';
    }

    return access.accessLevel;
  }

  /**
   * Get all labs a user has active access to.
   */
  async getUserAccessibleLabIds(userId: string): Promise<string[]> {
    const records = await prisma.labAccess.findMany({
      where: {
        userId,
        accessLevel: { not: 'NONE' },
      },
      select: { labId: true, isTemporary: true, expiresAt: true },
    });

    // Filter out expired temporary access
    return records
      .filter((r) => {
        if (r.isTemporary && r.expiresAt && new Date() > r.expiresAt) return false;
        return true;
      })
      .map((r) => r.labId);
  }

  /**
   * Get all users who are NOT yet assigned to a specific lab.
   */
  async getUnassignedUsers(labId: string) {
    const existingAccess = await prisma.labAccess.findMany({
      where: { labId },
      select: { userId: true },
    });
    const assignedIds = existingAccess.map((a) => a.userId);

    return prisma.user.findMany({
      where: {
        id: { notIn: assignedIds },
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
      },
      orderBy: { firstName: 'asc' },
    });
  }

  /**
   * Cleanup expired temporary access (called by scheduler).
   */
  async cleanupExpiredAccess() {
    const result = await prisma.labAccess.updateMany({
      where: {
        isTemporary: true,
        expiresAt: { lt: new Date() },
        accessLevel: { not: 'NONE' },
      },
      data: { accessLevel: 'NONE' },
    });
    return result.count;
  }
}

export default new LabAccessService();
