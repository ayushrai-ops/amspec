import { Router } from 'express';
import reportController from '../controllers/report.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'LAB_MANAGER', 'AUDITOR'));

router.get('/expiry/pdf', reportController.expiryReportPDF);
router.get('/inventory/excel', reportController.inventoryExcel);
router.get('/audit/excel', reportController.auditExcel);

export default router;
