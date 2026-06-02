import prisma from '../config/database';
import { ChemicalInput } from '../utils/validation';
import { ChemicalFilters, PaginatedResponse } from '../types';
import { calculateChemicalStatus, parsePagination, generateBarcodeString } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';
import { Chemical, Prisma } from '@prisma/client';

export class ChemicalService {
  /**
   * Get all chemicals with pagination, sorting, and filtering
   */
  async getAll(filters: ChemicalFilters): Promise<PaginatedResponse<Chemical>> {
    const { page, limit, skip } = parsePagination(filters.page, filters.limit);

    const where: Prisma.ChemicalWhereInput = {};

    // Search filter
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { casNumber: { contains: filters.search } },
        { batchNumber: { contains: filters.search } },
        { manufacturer: { contains: filters.search } },
        { supplierName: { contains: filters.search } },
      ];
    }

    // Status filter
    if (filters.status) {
      where.status = filters.status as any;
    }

    // Hazard class filter
    if (filters.hazardClass) {
      where.hazardClass = filters.hazardClass as any;
    }

    // Unit filter
    if (filters.unit) {
      where.unit = filters.unit as any;
    }

    // Storage location filter
    if (filters.storageLocation) {
      where.storageLocation = { contains: filters.storageLocation };
    }

    // Expiry date range filters
    if (filters.expiryBefore) {
      where.expiryDate = { ...where.expiryDate as any, lte: new Date(filters.expiryBefore) };
    }
    if (filters.expiryAfter) {
      where.expiryDate = { ...where.expiryDate as any, gte: new Date(filters.expiryAfter) };
    }

    // Lab ID filter
    if (filters.labId) {
      where.labId = filters.labId;
    }

    // Sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    const orderBy: Prisma.ChemicalOrderByWithRelationInput = { [sortBy]: sortOrder };

    const [data, total] = await Promise.all([
      prisma.chemical.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          addedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          lab: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.chemical.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single chemical by ID
   */
  async getById(id: string) {
    const chemical = await prisma.chemical.findUnique({
      where: { id },
      include: {
        addedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        lab: {
          select: { id: true, name: true },
        },
        certificates: {
          include: {
            uploadedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            performedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!chemical) {
      throw new AppError('Chemical not found', 404);
    }

    return chemical;
  }

  /**
   * Create a new chemical
   */
  async create(data: ChemicalInput, userId: string) {
    const status = calculateChemicalStatus(new Date(data.expiryDate));
    const barcodeData = generateBarcodeString(data.name);

    const chemical = await prisma.chemical.create({
      data: {
        ...data,
        purchaseDate: new Date(data.purchaseDate),
        expiryDate: new Date(data.expiryDate),
        status,
        barcodeData,
        addedById: userId,
      },
      include: {
        addedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // Create initial inventory transaction
    await prisma.inventoryTransaction.create({
      data: {
        chemicalId: chemical.id,
        transactionType: 'PURCHASE',
        quantity: data.quantity,
        balanceBefore: 0,
        balanceAfter: data.quantity,
        reason: 'Initial stock entry',
        performedById: userId,
      },
    });

    return chemical;
  }

  /**
   * Update an existing chemical
   */
  async update(id: string, data: Partial<ChemicalInput>) {
    const existing = await prisma.chemical.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Chemical not found', 404);
    }

    const updateData: any = { ...data };

    if (data.purchaseDate) updateData.purchaseDate = new Date(data.purchaseDate);
    if (data.expiryDate) {
      updateData.expiryDate = new Date(data.expiryDate);
      updateData.status = calculateChemicalStatus(new Date(data.expiryDate));
    }

    const chemical = await prisma.chemical.update({
      where: { id },
      data: updateData,
      include: {
        addedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return { chemical, previousData: existing };
  }

  /**
   * Delete a chemical
   */
  async delete(id: string) {
    const existing = await prisma.chemical.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Chemical not found', 404);
    }

    await prisma.chemical.delete({ where: { id } });
    return existing;
  }

  /**
   * Update statuses for all chemicals based on current dates
   */
  async updateAllStatuses() {
    const chemicals = await prisma.chemical.findMany();
    let updated = 0;

    for (const chemical of chemicals) {
      const newStatus = calculateChemicalStatus(chemical.expiryDate);
      if (newStatus !== chemical.status) {
        await prisma.chemical.update({
          where: { id: chemical.id },
          data: { status: newStatus },
        });
        updated++;
      }
    }

    return { updated, total: chemicals.length };
  }
}

export default new ChemicalService();
