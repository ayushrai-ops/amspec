import { Request } from 'express';
import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ChemicalFilters extends PaginationQuery {
  search?: string;
  status?: string;
  hazardClass?: string;
  unit?: string;
  storageLocation?: string;
  expiryBefore?: string;
  expiryAfter?: string;
  labId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalChemicals: number;
  expiredChemicals: number;
  nearExpiryChemicals: number;
  lowStockChemicals: number;
  totalCertificates: number;
  recentlyAdded: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
