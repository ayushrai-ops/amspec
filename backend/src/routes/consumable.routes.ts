import { Router } from 'express';
import consumableController from '../controllers/consumable.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { auditAction } from '../middleware/audit';

const router = Router();

router.use(authenticate);

router.get('/', consumableController.getAll);
router.get('/:id', consumableController.getById);

router.post('/',
  authorize('ADMIN', 'LAB_MANAGER', 'STORE_KEEPER'),
  auditAction('CREATE', 'Consumable'),
  consumableController.create
);

router.put('/:id',
  authorize('ADMIN', 'LAB_MANAGER', 'STORE_KEEPER'),
  auditAction('UPDATE', 'Consumable'),
  consumableController.update
);

router.delete('/:id',
  authorize('ADMIN', 'LAB_MANAGER'),
  auditAction('DELETE', 'Consumable'),
  consumableController.delete
);

export default router;
