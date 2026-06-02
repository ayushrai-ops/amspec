import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  role: z.enum(['ADMIN', 'LAB_MANAGER', 'CHEMIST', 'STORE_KEEPER', 'AUDITOR']).optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
});

export const chemicalSchema = z.object({
  name: z.string().min(1, 'Chemical name is required').max(200),
  casNumber: z.string().optional(),
  batchNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.enum(['L', 'mL', 'kg', 'g', 'mg', 'oz', 'gal']),
  purchaseDate: z.string().refine(d => !isNaN(Date.parse(d)), 'Invalid purchase date'),
  expiryDate: z.string().refine(d => !isNaN(Date.parse(d)), 'Invalid expiry date'),
  hazardClass: z.enum([
    'FLAMMABLE', 'OXIDIZER', 'CORROSIVE', 'TOXIC', 'IRRITANT',
    'EXPLOSIVE', 'COMPRESSED_GAS', 'ENVIRONMENTAL_HAZARD', 'HEALTH_HAZARD', 'NON_HAZARDOUS'
  ]).optional(),
  storageLocation: z.string().optional(),
  supplierName: z.string().optional(),
  supplierContact: z.string().optional(),
  minStockLevel: z.number().min(0).optional(),
  notes: z.string().optional(),
  labId: z.string().optional().nullable(),
});

export const chemicalUpdateSchema = chemicalSchema.partial();

export const consumeSchema = z.object({
  chemicalId: z.string().uuid('Invalid chemical ID'),
  quantity: z.number().positive('Quantity must be positive'),
  reason: z.string().optional(),
});

export const disposeSchema = z.object({
  chemicalId: z.string().uuid('Invalid chemical ID'),
  quantity: z.number().positive('Quantity must be positive'),
  reason: z.string().min(1, 'Disposal reason is required'),
});

export const certificateSchema = z.object({
  name: z.string().min(1, 'Certificate name is required'),
  type: z.enum(['COA', 'CALIBRATION', 'ISO', 'SDS_MSDS', 'COMPLIANCE', 'OTHER']),
  expiryDate: z.string().optional(),
  reminderDays: z.number().int().min(1).max(365).optional(),
  chemicalId: z.string().uuid().optional(),
});

export const resetPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChemicalInput = z.infer<typeof chemicalSchema>;
export type ConsumeInput = z.infer<typeof consumeSchema>;
export type DisposeInput = z.infer<typeof disposeSchema>;
export type CertificateInput = z.infer<typeof certificateSchema>;
