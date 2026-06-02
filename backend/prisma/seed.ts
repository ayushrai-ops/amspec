import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── CREATE USERS ───────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const userPassword = await bcrypt.hash('User@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@amspecgroup.com' },
    update: {},
    create: {
      email: 'admin@amspecgroup.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: 'ADMIN',
      department: 'Administration',
      phone: '+1-555-0100',
    },
  });

  const labManager = await prisma.user.upsert({
    where: { email: 'manager@amspecgroup.com' },
    update: {},
    create: {
      email: 'manager@amspecgroup.com',
      password: userPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'LAB_MANAGER',
      department: 'Quality Control',
      phone: '+1-555-0101',
    },
  });

  const chemist = await prisma.user.upsert({
    where: { email: 'chemist@amspecgroup.com' },
    update: {},
    create: {
      email: 'chemist@amspecgroup.com',
      password: userPassword,
      firstName: 'James',
      lastName: 'Wilson',
      role: 'CHEMIST',
      department: 'Analytical Lab',
      phone: '+1-555-0102',
    },
  });

  const storeKeeper = await prisma.user.upsert({
    where: { email: 'store@amspecgroup.com' },
    update: {},
    create: {
      email: 'store@amspecgroup.com',
      password: userPassword,
      firstName: 'Maria',
      lastName: 'Garcia',
      role: 'STORE_KEEPER',
      department: 'Warehouse',
      phone: '+1-555-0103',
    },
  });

  const auditor = await prisma.user.upsert({
    where: { email: 'auditor@amspecgroup.com' },
    update: {},
    create: {
      email: 'auditor@amspecgroup.com',
      password: userPassword,
      firstName: 'Robert',
      lastName: 'Chen',
      role: 'AUDITOR',
      department: 'Compliance',
      phone: '+1-555-0104',
    },
  });

  console.log('✅ Users created');

  // ─── CREATE LABS (with geographic classification) ────────────────────────────
  const analyticalLab = await prisma.lab.upsert({
    where: { name: 'Analytical Testing Lab – Houston' },
    update: {},
    create: {
      name: 'Analytical Testing Lab – Houston',
      description: 'Main laboratory for chromatography, spectroscopy, and analytical wet chemistry.',
      continent: 'North America',
      country: 'United States',
    },
  });

  const qcLab = await prisma.lab.upsert({
    where: { name: 'Quality Control Lab – Houston' },
    update: {},
    create: {
      name: 'Quality Control Lab – Houston',
      description: 'Dedicated room for batch testing, ASTM standards validation, and purity analysis.',
      continent: 'North America',
      country: 'United States',
    },
  });

  const euroLab = await prisma.lab.upsert({
    where: { name: 'Rotterdam Marine Lab' },
    update: {},
    create: {
      name: 'Rotterdam Marine Lab',
      description: 'Marine fuel and petroleum testing laboratory serving European ports.',
      continent: 'Europe',
      country: 'Netherlands',
    },
  });

  const asiaLab = await prisma.lab.upsert({
    where: { name: 'Singapore Petrochemical Lab' },
    update: {},
    create: {
      name: 'Singapore Petrochemical Lab',
      description: 'Asia-Pacific hub for petrochemical analysis and quality assurance.',
      continent: 'Asia',
      country: 'Singapore',
    },
  });

  console.log('✅ Labs created (4 labs across 3 continents)');

  // ─── CREATE LAB ACCESS RECORDS ────────────────────────────────────────────────
  // Admin does not need LabAccess — they bypass all checks.

  // Lab Manager: FULL_ACCESS to Analytical Lab
  await prisma.labAccess.upsert({
    where: { userId_labId: { userId: labManager.id, labId: analyticalLab.id } },
    update: {},
    create: {
      userId: labManager.id,
      labId: analyticalLab.id,
      accessLevel: 'FULL_ACCESS',
      grantedBy: admin.id,
    },
  });

  // Chemist: READ_WRITE to Analytical Lab
  await prisma.labAccess.upsert({
    where: { userId_labId: { userId: chemist.id, labId: analyticalLab.id } },
    update: {},
    create: {
      userId: chemist.id,
      labId: analyticalLab.id,
      accessLevel: 'READ_WRITE',
      grantedBy: admin.id,
    },
  });

  // Store Keeper: FULL_ACCESS to QC Lab
  await prisma.labAccess.upsert({
    where: { userId_labId: { userId: storeKeeper.id, labId: qcLab.id } },
    update: {},
    create: {
      userId: storeKeeper.id,
      labId: qcLab.id,
      accessLevel: 'FULL_ACCESS',
      grantedBy: admin.id,
    },
  });

  // Auditor: READ to QC Lab (view-only for auditing)
  await prisma.labAccess.upsert({
    where: { userId_labId: { userId: auditor.id, labId: qcLab.id } },
    update: {},
    create: {
      userId: auditor.id,
      labId: qcLab.id,
      accessLevel: 'READ',
      grantedBy: admin.id,
    },
  });

  // Chemist: Temporary READ access to Rotterdam Lab (expires in 30 days)
  await prisma.labAccess.upsert({
    where: { userId_labId: { userId: chemist.id, labId: euroLab.id } },
    update: {},
    create: {
      userId: chemist.id,
      labId: euroLab.id,
      accessLevel: 'READ',
      grantedBy: admin.id,
      isTemporary: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Lab access records created');

  // ─── CREATE CHEMICALS ───────────────────────────────────────────────────────
  const now = new Date();
  const daysFromNow = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const chemicalsData = [
    {
      name: 'Methanol (HPLC Grade)',
      casNumber: '67-56-1',
      batchNumber: 'MET-2024-001',
      manufacturer: 'Merck',
      quantity: 2.5,
      unit: 'L' as const,
      purchaseDate: daysAgo(180),
      expiryDate: daysFromNow(5),
      hazardClass: 'FLAMMABLE' as const,
      storageLocation: 'Cabinet A-01',
      supplierName: 'Fisher Scientific',
      supplierContact: '+1-800-766-7000',
      minStockLevel: 1.0,
      barcodeData: 'AMS-MET-001',
      status: 'NEAR_EXPIRY' as const,
      addedById: labManager.id,
      labId: analyticalLab.id,
    },
    {
      name: 'Benzene (ACS Reagent)',
      casNumber: '71-43-2',
      batchNumber: 'BEN-2024-015',
      manufacturer: 'Sigma-Aldrich',
      quantity: 500,
      unit: 'mL' as const,
      purchaseDate: daysAgo(90),
      expiryDate: daysFromNow(-3),
      hazardClass: 'TOXIC' as const,
      storageLocation: 'Fume Hood B-03',
      supplierName: 'VWR International',
      supplierContact: '+1-800-932-5000',
      minStockLevel: 200,
      barcodeData: 'AMS-BEN-015',
      status: 'EXPIRED' as const,
      addedById: chemist.id,
      labId: qcLab.id,
    },
    {
      name: 'Sulfuric Acid (95-98%)',
      casNumber: '7664-93-9',
      batchNumber: 'SA-2024-042',
      manufacturer: 'Fisher Chemical',
      quantity: 1.0,
      unit: 'L' as const,
      purchaseDate: daysAgo(60),
      expiryDate: daysFromNow(300),
      hazardClass: 'CORROSIVE' as const,
      storageLocation: 'Acid Cabinet C-02',
      supplierName: 'Fisher Scientific',
      supplierContact: '+1-800-766-7000',
      minStockLevel: 0.5,
      barcodeData: 'AMS-SA-042',
      status: 'SAFE' as const,
      addedById: storeKeeper.id,
      labId: analyticalLab.id,
    },
    {
      name: 'Acetonitrile (HPLC Grade)',
      casNumber: '75-05-8',
      batchNumber: 'ACN-2024-078',
      manufacturer: 'J.T.Baker',
      quantity: 4.0,
      unit: 'L' as const,
      purchaseDate: daysAgo(120),
      expiryDate: daysFromNow(20),
      hazardClass: 'FLAMMABLE' as const,
      storageLocation: 'Solvent Cabinet A-03',
      supplierName: 'Avantor',
      supplierContact: '+1-800-234-7437',
      minStockLevel: 2.0,
      barcodeData: 'AMS-ACN-078',
      status: 'NEAR_EXPIRY' as const,
      addedById: labManager.id,
    },
    {
      name: 'Hydrochloric Acid (37%)',
      casNumber: '7647-01-0',
      batchNumber: 'HCL-2024-023',
      manufacturer: 'Merck',
      quantity: 2.5,
      unit: 'L' as const,
      purchaseDate: daysAgo(30),
      expiryDate: daysFromNow(700),
      hazardClass: 'CORROSIVE' as const,
      storageLocation: 'Acid Cabinet C-01',
      supplierName: 'Merck Direct',
      supplierContact: '+1-800-437-1000',
      minStockLevel: 1.0,
      barcodeData: 'AMS-HCL-023',
      status: 'SAFE' as const,
      addedById: storeKeeper.id,
    },
    {
      name: 'Sodium Hydroxide Pellets',
      casNumber: '1310-73-2',
      batchNumber: 'NaOH-2024-011',
      manufacturer: 'Sigma-Aldrich',
      quantity: 500,
      unit: 'g' as const,
      purchaseDate: daysAgo(200),
      expiryDate: daysFromNow(160),
      hazardClass: 'CORROSIVE' as const,
      storageLocation: 'Base Cabinet D-01',
      supplierName: 'Sigma-Aldrich',
      supplierContact: '+1-800-325-3010',
      minStockLevel: 100,
      barcodeData: 'AMS-NaOH-011',
      status: 'SAFE' as const,
      addedById: labManager.id,
    },
    {
      name: 'Toluene (ACS Grade)',
      casNumber: '108-88-3',
      batchNumber: 'TOL-2024-033',
      manufacturer: 'Fisher Chemical',
      quantity: 1.0,
      unit: 'L' as const,
      purchaseDate: daysAgo(150),
      expiryDate: daysFromNow(12),
      hazardClass: 'FLAMMABLE' as const,
      storageLocation: 'Solvent Cabinet A-02',
      supplierName: 'Fisher Scientific',
      supplierContact: '+1-800-766-7000',
      minStockLevel: 0.5,
      barcodeData: 'AMS-TOL-033',
      status: 'NEAR_EXPIRY' as const,
      addedById: chemist.id,
    },
    {
      name: 'Potassium Permanganate',
      casNumber: '7722-64-7',
      batchNumber: 'KMnO4-2024-007',
      manufacturer: 'Merck',
      quantity: 250,
      unit: 'g' as const,
      purchaseDate: daysAgo(100),
      expiryDate: daysFromNow(260),
      hazardClass: 'OXIDIZER' as const,
      storageLocation: 'Oxidizer Cabinet E-01',
      supplierName: 'VWR International',
      supplierContact: '+1-800-932-5000',
      minStockLevel: 50,
      barcodeData: 'AMS-KMnO4-007',
      status: 'SAFE' as const,
      addedById: storeKeeper.id,
    },
    {
      name: 'Ethanol (200 Proof)',
      casNumber: '64-17-5',
      batchNumber: 'ETH-2024-091',
      manufacturer: 'Decon Labs',
      quantity: 0.3,
      unit: 'L' as const,
      purchaseDate: daysAgo(240),
      expiryDate: daysFromNow(120),
      hazardClass: 'FLAMMABLE' as const,
      storageLocation: 'Solvent Cabinet A-01',
      supplierName: 'Fisher Scientific',
      supplierContact: '+1-800-766-7000',
      minStockLevel: 1.0,
      barcodeData: 'AMS-ETH-091',
      status: 'SAFE' as const,
      addedById: labManager.id,
    },
    {
      name: 'Chloroform (Stabilized)',
      casNumber: '67-66-3',
      batchNumber: 'CHCl3-2024-055',
      manufacturer: 'Honeywell',
      quantity: 2.0,
      unit: 'L' as const,
      purchaseDate: daysAgo(45),
      expiryDate: daysFromNow(320),
      hazardClass: 'HEALTH_HAZARD' as const,
      storageLocation: 'Fume Hood B-01',
      supplierName: 'Avantor',
      supplierContact: '+1-800-234-7437',
      minStockLevel: 0.5,
      barcodeData: 'AMS-CHCl3-055',
      status: 'SAFE' as const,
      addedById: chemist.id,
    },
    {
      name: 'Isopropanol (IPA)',
      casNumber: '67-63-0',
      batchNumber: 'IPA-2025-003',
      manufacturer: 'Fisher Chemical',
      quantity: 5.0,
      unit: 'L' as const,
      purchaseDate: daysAgo(15),
      expiryDate: daysFromNow(720),
      hazardClass: 'FLAMMABLE' as const,
      storageLocation: 'Solvent Cabinet A-04',
      supplierName: 'Fisher Scientific',
      supplierContact: '+1-800-766-7000',
      minStockLevel: 2.0,
      barcodeData: 'AMS-IPA-003',
      status: 'SAFE' as const,
      addedById: storeKeeper.id,
    },
    {
      name: 'Nitric Acid (70%)',
      casNumber: '7697-37-2',
      batchNumber: 'HNO3-2024-019',
      manufacturer: 'Merck',
      quantity: 1.0,
      unit: 'L' as const,
      purchaseDate: daysAgo(75),
      expiryDate: daysFromNow(-10),
      hazardClass: 'CORROSIVE' as const,
      storageLocation: 'Acid Cabinet C-03',
      supplierName: 'Merck Direct',
      supplierContact: '+1-800-437-1000',
      minStockLevel: 0.5,
      barcodeData: 'AMS-HNO3-019',
      status: 'EXPIRED' as const,
      addedById: labManager.id,
    },
    {
      name: 'Hexane (HPLC Grade)',
      casNumber: '110-54-3',
      batchNumber: 'HEX-2025-008',
      manufacturer: 'Honeywell',
      quantity: 3.0,
      unit: 'L' as const,
      purchaseDate: daysAgo(10),
      expiryDate: daysFromNow(355),
      hazardClass: 'FLAMMABLE' as const,
      storageLocation: 'Solvent Cabinet A-05',
      supplierName: 'Sigma-Aldrich',
      supplierContact: '+1-800-325-3010',
      minStockLevel: 1.0,
      barcodeData: 'AMS-HEX-008',
      status: 'SAFE' as const,
      addedById: chemist.id,
    },
    {
      name: 'Phosphoric Acid (85%)',
      casNumber: '7664-38-2',
      batchNumber: 'H3PO4-2024-031',
      manufacturer: 'Fisher Chemical',
      quantity: 500,
      unit: 'mL' as const,
      purchaseDate: daysAgo(130),
      expiryDate: daysFromNow(230),
      hazardClass: 'CORROSIVE' as const,
      storageLocation: 'Acid Cabinet C-04',
      supplierName: 'Fisher Scientific',
      supplierContact: '+1-800-766-7000',
      minStockLevel: 200,
      barcodeData: 'AMS-H3PO4-031',
      status: 'SAFE' as const,
      addedById: storeKeeper.id,
    },
    {
      name: 'Dichloromethane (DCM)',
      casNumber: '75-09-2',
      batchNumber: 'DCM-2024-067',
      manufacturer: 'Sigma-Aldrich',
      quantity: 2.5,
      unit: 'L' as const,
      purchaseDate: daysAgo(90),
      expiryDate: daysFromNow(28),
      hazardClass: 'HEALTH_HAZARD' as const,
      storageLocation: 'Fume Hood B-02',
      supplierName: 'Sigma-Aldrich',
      supplierContact: '+1-800-325-3010',
      minStockLevel: 1.0,
      barcodeData: 'AMS-DCM-067',
      status: 'NEAR_EXPIRY' as const,
      addedById: labManager.id,
    },
    {
      name: 'Calcium Chloride Dihydrate',
      casNumber: '10035-04-8',
      batchNumber: 'CaCl2-2025-002',
      manufacturer: 'Merck',
      quantity: 1000,
      unit: 'g' as const,
      purchaseDate: daysAgo(5),
      expiryDate: daysFromNow(730),
      hazardClass: 'IRRITANT' as const,
      storageLocation: 'Shelf F-02',
      supplierName: 'VWR International',
      supplierContact: '+1-800-932-5000',
      minStockLevel: 200,
      barcodeData: 'AMS-CaCl2-002',
      status: 'SAFE' as const,
      addedById: storeKeeper.id,
    },
    {
      name: 'Diethyl Ether (Anhydrous)',
      casNumber: '60-29-7',
      batchNumber: 'DEE-2024-044',
      manufacturer: 'Honeywell',
      quantity: 1.0,
      unit: 'L' as const,
      purchaseDate: daysAgo(200),
      expiryDate: daysFromNow(2),
      hazardClass: 'FLAMMABLE' as const,
      storageLocation: 'Explosion-proof Fridge R-01',
      supplierName: 'Avantor',
      supplierContact: '+1-800-234-7437',
      minStockLevel: 0.5,
      barcodeData: 'AMS-DEE-044',
      status: 'NEAR_EXPIRY' as const,
      addedById: chemist.id,
    },
    {
      name: 'Acetic Acid (Glacial)',
      casNumber: '64-19-7',
      batchNumber: 'AA-2025-001',
      manufacturer: 'Fisher Chemical',
      quantity: 2.5,
      unit: 'L' as const,
      purchaseDate: daysAgo(20),
      expiryDate: daysFromNow(345),
      hazardClass: 'CORROSIVE' as const,
      storageLocation: 'Acid Cabinet C-05',
      supplierName: 'Fisher Scientific',
      supplierContact: '+1-800-766-7000',
      minStockLevel: 1.0,
      barcodeData: 'AMS-AA-001',
      status: 'SAFE' as const,
      addedById: labManager.id,
    },
    {
      name: 'Hydrogen Peroxide (30%)',
      casNumber: '7722-84-1',
      batchNumber: 'H2O2-2024-056',
      manufacturer: 'Sigma-Aldrich',
      quantity: 500,
      unit: 'mL' as const,
      purchaseDate: daysAgo(160),
      expiryDate: daysFromNow(200),
      hazardClass: 'OXIDIZER' as const,
      storageLocation: 'Oxidizer Cabinet E-02',
      supplierName: 'Sigma-Aldrich',
      supplierContact: '+1-800-325-3010',
      minStockLevel: 100,
      barcodeData: 'AMS-H2O2-056',
      status: 'SAFE' as const,
      addedById: storeKeeper.id,
    },
    {
      name: 'Petroleum Ether (60-80°C)',
      casNumber: '8032-32-4',
      batchNumber: 'PE-2024-089',
      manufacturer: 'Merck',
      quantity: 0.2,
      unit: 'L' as const,
      purchaseDate: daysAgo(250),
      expiryDate: daysFromNow(-20),
      hazardClass: 'FLAMMABLE' as const,
      storageLocation: 'Solvent Cabinet A-06',
      supplierName: 'Merck Direct',
      supplierContact: '+1-800-437-1000',
      minStockLevel: 1.0,
      barcodeData: 'AMS-PE-089',
      status: 'EXPIRED' as const,
      addedById: chemist.id,
    },
  ];

  for (const chemData of chemicalsData) {
    await prisma.chemical.create({ data: chemData });
  }

  console.log(`✅ ${chemicalsData.length} chemicals created`);

  // ─── CREATE GLASSWARE ───────────────────────────────────────────────────────
  const glasswareData = [
    {
      name: 'Pyrex Glass Beaker',
      type: 'Beaker',
      size: '250mL',
      quantity: 12,
      minStockLevel: 5,
      storageLocation: 'Shelf G-01',
      labId: analyticalLab.id,
    },
    {
      name: 'Borosilicate Erlenmeyer Flask',
      type: 'Flask',
      size: '500mL',
      quantity: 8,
      minStockLevel: 3,
      storageLocation: 'Shelf G-02',
      labId: analyticalLab.id,
    },
    {
      name: 'Graduated Cylinder',
      type: 'Graduated Cylinder',
      size: '100mL',
      quantity: 4,
      minStockLevel: 2,
      storageLocation: 'Shelf G-03',
      labId: qcLab.id,
    },
    {
      name: 'Volumetric Pipette',
      type: 'Pipette',
      size: '10mL',
      quantity: 15,
      minStockLevel: 5,
      storageLocation: 'Drawer G-04',
      labId: qcLab.id,
    },
  ];

  for (const item of glasswareData) {
    await prisma.glassware.create({ data: item });
  }
  console.log(`✅ ${glasswareData.length} glassware items created`);

  // ─── CREATE CONSUMABLES ──────────────────────────────────────────────────────
  const consumablesData = [
    {
      name: 'Nitrile Gloves (Medium)',
      category: 'Safety Wear',
      quantity: 10,
      unit: 'Boxes',
      minStockLevel: 3,
      storageLocation: 'Safety Cabinet 1',
      labId: analyticalLab.id,
    },
    {
      name: 'Syringe Filters (0.45μm)',
      category: 'Filters',
      quantity: 100,
      unit: 'pcs',
      minStockLevel: 20,
      storageLocation: 'Drawer C-09',
      labId: analyticalLab.id,
    },
    {
      name: 'Whatman Filter Paper Grade 1',
      category: 'Filters',
      quantity: 5,
      unit: 'Packs',
      minStockLevel: 2,
      storageLocation: 'Drawer C-10',
      labId: qcLab.id,
    },
    {
      name: 'Disposable Pipette Tips (1000μL)',
      category: 'Tips',
      quantity: 500,
      unit: 'pcs',
      minStockLevel: 100,
      storageLocation: 'Shelf D-05',
      labId: qcLab.id,
    },
  ];

  for (const item of consumablesData) {
    await prisma.consumable.create({ data: item });
  }
  console.log(`✅ ${consumablesData.length} consumables created`);

  // ─── CREATE SAMPLE NOTIFICATIONS ────────────────────────────────────────────
  const notifications = [
    {
      title: 'Chemical Expired: Benzene',
      message: 'Benzene (ACS Reagent) batch BEN-2024-015 has expired. Please arrange for disposal.',
      type: 'EXPIRY_ALERT' as const,
      priority: 'CRITICAL' as const,
      userId: labManager.id,
    },
    {
      title: 'Low Stock Alert: Ethanol',
      message: 'Ethanol (200 Proof) is running low. Current stock: 0.3 L (Min: 1.0 L)',
      type: 'LOW_STOCK' as const,
      priority: 'HIGH' as const,
      userId: labManager.id,
    },
    {
      title: 'Chemical Expiring Soon: Methanol',
      message: 'Methanol (HPLC Grade) will expire in 5 days. Please plan accordingly.',
      type: 'EXPIRY_WARNING' as const,
      priority: 'HIGH' as const,
      userId: labManager.id,
    },
    {
      title: 'New Chemical Added',
      message: 'Calcium Chloride Dihydrate has been added to the inventory by Store Keeper.',
      type: 'SYSTEM' as const,
      priority: 'LOW' as const,
      userId: admin.id,
    },
  ];

  for (const notif of notifications) {
    await prisma.notification.create({ data: notif });
  }

  console.log('✅ Sample notifications created');

  // ─── SYSTEM SETTINGS ────────────────────────────────────────────────────────
  const settings = [
    { key: 'expiry_reminder_days', value: '30,15,7', description: 'Days before expiry to send reminders' },
    { key: 'low_stock_threshold', value: '10', description: 'Percentage of min stock level to trigger alerts' },
    { key: 'email_notifications_enabled', value: 'true', description: 'Enable/disable email notifications' },
    { key: 'company_name', value: 'AmSpec Group', description: 'Company name for reports' },
  ];

  for (const setting of settings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log('✅ System settings configured');
  console.log('');
  console.log('🎉 Database seeding complete!');
  console.log('');
  console.log('📋 Default Login Credentials:');
  console.log('   Admin:        admin@amspecgroup.com    / Admin@123');
  console.log('   Lab Manager:  manager@amspecgroup.com  / User@123');
  console.log('   Chemist:      chemist@amspecgroup.com  / User@123');
  console.log('   Store Keeper: store@amspecgroup.com    / User@123');
  console.log('   Auditor:      auditor@amspecgroup.com  / User@123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
