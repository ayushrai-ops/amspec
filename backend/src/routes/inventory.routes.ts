import { Router } from 'express';
import inventoryController from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { auditAction } from '../middleware/audit';

const router = Router();

router.use(authenticate);

router.get('/transactions', inventoryController.getTransactions);

router.post('/consume',
  authorize('ADMIN', 'LAB_MANAGER', 'CHEMIST', 'STORE_KEEPER'),
  auditAction('CONSUME', 'Inventory'),
  inventoryController.consume
);

router.post('/dispose',
  authorize('ADMIN', 'LAB_MANAGER'),
  auditAction('DISPOSE', 'Inventory'),
  inventoryController.dispose
);

export default router;
