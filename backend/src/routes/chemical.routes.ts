import { Router } from 'express';
import chemicalController from '../controllers/chemical.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { auditAction } from '../middleware/audit';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', chemicalController.getAll);
router.get('/:id', chemicalController.getById);
router.get('/:id/qrcode', chemicalController.getQRCode);

router.post('/',
  authorize('ADMIN', 'LAB_MANAGER', 'STORE_KEEPER'),
  auditAction('CREATE', 'Chemical'),
  chemicalController.create
);

router.put('/:id',
  authorize('ADMIN', 'LAB_MANAGER', 'STORE_KEEPER'),
  auditAction('UPDATE', 'Chemical'),
  chemicalController.update
);

router.delete('/:id',
  authorize('ADMIN'),
  auditAction('DELETE', 'Chemical'),
  chemicalController.delete
);

export default router;
