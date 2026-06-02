import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { CertificateInput } from '../utils/validation';
import { parsePagination } from '../utils/helpers';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

export class CertificateService {
  /**
   * Upload a new certificate
   */
  async create(data: CertificateInput, file: Express.Multer.File, userId: string) {
    // Validate that chemical exists if chemicalId is provided
    if (data.chemicalId) {
      const chemical = await prisma.chemical.findUnique({ where: { id: data.chemicalId } });
      if (!chemical) throw new AppError('Associated chemical not found', 404);
    }

    const certificate = await prisma.certificate.create({
      data: {
        name: data.name,
        type: data.type as any,
        filePath: file.path,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        reminderDays: data.reminderDays || 30,
        chemicalId: data.chemicalId || null,
        uploadedById: userId,
      },
      include: {
        chemical: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return certificate;
  }

  /**
   * Get all certificates with pagination
   */
  async getAll(filters: {
    page?: string;
    limit?: string;
    type?: string;
    chemicalId?: string;
    search?: string;
  }) {
    const { page, limit, skip } = parsePagination(filters.page, filters.limit);
    const where: any = {};

    if (filters.type) where.type = filters.type;
    if (filters.chemicalId) where.chemicalId = filters.chemicalId;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { originalFilename: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          chemical: { select: { id: true, name: true } },
          uploadedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.certificate.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get certificate by ID
   */
  async getById(id: string) {
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        chemical: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!certificate) throw new AppError('Certificate not found', 404);
    return certificate;
  }

  /**
   * Download certificate file
   */
  async getFilePath(id: string) {
    const certificate = await prisma.certificate.findUnique({ where: { id } });
    if (!certificate) throw new AppError('Certificate not found', 404);

    const filePath = path.resolve(certificate.filePath);
    if (!fs.existsSync(filePath)) {
      throw new AppError('Certificate file not found on disk', 404);
    }

    return {
      filePath,
      originalFilename: certificate.originalFilename,
      mimeType: certificate.mimeType,
    };
  }

  /**
   * Delete certificate
   */
  async delete(id: string) {
    const certificate = await prisma.certificate.findUnique({ where: { id } });
    if (!certificate) throw new AppError('Certificate not found', 404);

    // Delete file from disk
    try {
      if (fs.existsSync(certificate.filePath)) {
        fs.unlinkSync(certificate.filePath);
      }
    } catch (err) {
      console.error('Error deleting file:', err);
    }

    await prisma.certificate.delete({ where: { id } });
    return certificate;
  }
}

export default new CertificateService();
