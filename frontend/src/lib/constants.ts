export const ROLES = {
  ADMIN: 'ADMIN',
  LAB_MANAGER: 'LAB_MANAGER',
  CHEMIST: 'CHEMIST',
  STORE_KEEPER: 'STORE_KEEPER',
  AUDITOR: 'AUDITOR',
} as const;

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  LAB_MANAGER: 'Lab Manager',
  CHEMIST: 'Chemist',
  STORE_KEEPER: 'Store Keeper',
  AUDITOR: 'Auditor',
};

export const HAZARD_CLASSES = [
  { value: 'FLAMMABLE', label: 'Flammable', icon: '🔥' },
  { value: 'OXIDIZER', label: 'Oxidizer', icon: '⚡' },
  { value: 'CORROSIVE', label: 'Corrosive', icon: '⚠️' },
  { value: 'TOXIC', label: 'Toxic', icon: '☠️' },
  { value: 'IRRITANT', label: 'Irritant', icon: '⚠️' },
  { value: 'EXPLOSIVE', label: 'Explosive', icon: '💥' },
  { value: 'COMPRESSED_GAS', label: 'Compressed Gas', icon: '🫧' },
  { value: 'ENVIRONMENTAL_HAZARD', label: 'Environmental Hazard', icon: '🌍' },
  { value: 'HEALTH_HAZARD', label: 'Health Hazard', icon: '🏥' },
  { value: 'NON_HAZARDOUS', label: 'Non-Hazardous', icon: '✅' },
];

export const UNITS = [
  { value: 'L', label: 'Liters (L)' },
  { value: 'mL', label: 'Milliliters (mL)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'mg', label: 'Milligrams (mg)' },
  { value: 'oz', label: 'Ounces (oz)' },
  { value: 'gal', label: 'Gallons (gal)' },
];

export const CERTIFICATE_TYPES = [
  { value: 'COA', label: 'Certificate of Analysis' },
  { value: 'CALIBRATION', label: 'Calibration Certificate' },
  { value: 'ISO', label: 'ISO Certification' },
  { value: 'SDS_MSDS', label: 'SDS/MSDS Document' },
  { value: 'COMPLIANCE', label: 'Compliance Document' },
  { value: 'OTHER', label: 'Other' },
];

export const STATUS_CONFIG = {
  SAFE: { label: 'Safe', color: '#10b981', bgClass: 'status-safe' },
  NEAR_EXPIRY: { label: 'Near Expiry', color: '#f59e0b', bgClass: 'status-warning' },
  EXPIRED: { label: 'Expired', color: '#ef4444', bgClass: 'status-danger' },
};
