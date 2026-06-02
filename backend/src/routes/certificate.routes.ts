import { Router } from 'express';
import certificateController from '../controllers/certificate.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { upload } from '../middleware/upload';
import { auditAction } from '../middleware/audit';

const router = Router();

router.use(authenticate);

router.get('/', certificateController.getAll);
router.get('/:id', certificateController.getById);
router.get('/:id/download', certificateController.download);

router.post('/',
  authorize('ADMIN', 'LAB_MANAGER'),
  upload.single('file'),
  auditAction('CREATE', 'Certificate'),
  certificateController.create
);

router.delete('/:id',
  authorize('ADMIN'),
  auditAction('DELETE', 'Certificate'),
  certificateController.delete
);

export default router;
