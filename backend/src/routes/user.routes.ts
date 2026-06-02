import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { auditAction } from '../middleware/audit';
import auditService from '../services/audit.service';

const router = Router();

router.use(authenticate);

// User management (Admin only)
router.get('/', authorize('ADMIN'), userController.getAll);

router.post('/',
  authorize('ADMIN'),
  auditAction('CREATE', 'User'),
  userController.create
);

router.put('/:id',
  authorize('ADMIN'),
  auditAction('UPDATE', 'User'),
  userController.update
);

router.delete('/:id',
  authorize('ADMIN'),
  auditAction('DEACTIVATE', 'User'),
  userController.delete
);

// Audit logs
router.get('/audit-logs', authorize('ADMIN', 'AUDITOR'), async (req, res, next) => {
  try {
    const result = await auditService.getLogs(req.query as any);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

export default router;
