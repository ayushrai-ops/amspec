import { ChemicalStatus } from '@prisma/client';

/**
 * Calculate chemical status based on expiry date
 */
export const calculateChemicalStatus = (expiryDate: Date): ChemicalStatus => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'EXPIRED';
  if (diffDays <= 30) return 'NEAR_EXPIRY';
  return 'SAFE';
};

/**
 * Calculate days until expiry
 */
export const daysUntilExpiry = (expiryDate: Date): number => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Format date to readable string
 */
export const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Parse pagination params with defaults
 */
export const parsePagination = (page?: string, limit?: string) => {
  const p = Math.max(1, parseInt(page || '1', 10));
  const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));
  return { page: p, limit: l, skip: (p - 1) * l };
};

/**
 * Generate a unique barcode string
 */
export const generateBarcodeString = (chemicalName: string): string => {
  const prefix = 'AMS';
  const timestamp = Date.now().toString(36).toUpperCase();
  const nameCode = chemicalName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  return `${prefix}-${nameCode}-${timestamp}`;
};
