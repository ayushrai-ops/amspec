import { Router } from 'express';
import glasswareController from '../controllers/glassware.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { auditAction } from '../middleware/audit';

const router = Router();

router.use(authenticate);

router.get('/', glasswareController.getAll);
router.get('/:id', glasswareController.getById);

router.post('/',
  authorize('ADMIN', 'LAB_MANAGER', 'STORE_KEEPER'),
  auditAction('CREATE', 'Glassware'),
  glasswareController.create
);

router.put('/:id',
  authorize('ADMIN', 'LAB_MANAGER', 'STORE_KEEPER'),
  auditAction('UPDATE', 'Glassware'),
  glasswareController.update
);

router.delete('/:id',
  authorize('ADMIN', 'LAB_MANAGER'),
  auditAction('DELETE', 'Glassware'),
  glasswareController.delete
);

export default router;
