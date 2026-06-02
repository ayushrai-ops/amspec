import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { hashPassword } from '../utils/password';
import { registerSchema } from '../utils/validation';
import { AuthRequest } from '../types';
import { parsePagination } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';

export class UserController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = parsePagination(req.query.page as string, req.query.limit as string);
      const search = req.query.search as string;

      const where: any = {};
      if (search) {
        where.OR = [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { email: { contains: search } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            phone: true,
            department: true,
            lastLogin: true,
            createdAt: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        success: true,
        data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) throw new AppError('Email already registered', 409);

      const hashedPassword = await hashPassword(data.password);
      const user = await prisma.user.create({
        data: { ...data, password: hashedPassword },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, isActive: true, department: true, createdAt: true,
        },
      });

      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { firstName, lastName, role, department, phone, isActive } = req.body;

      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(role && { role }),
          ...(department !== undefined && { department }),
          ...(phone !== undefined && { phone }),
          ...(isActive !== undefined && { isActive }),
        },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, isActive: true, department: true, phone: true,
        },
      });

      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (id === req.user!.id) {
        throw new AppError('Cannot deactivate your own account', 400);
      }

      const user = await prisma.user.update({
        where: { id },
        data: { isActive: false },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      res.json({ success: true, data: user, message: 'User deactivated' });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
