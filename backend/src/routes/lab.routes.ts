import { Router } from 'express';
import labController from '../controllers/lab.controller';
import labAccessController from '../controllers/labAccess.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { auditAction } from '../middleware/audit';

const router = Router();

router.use(authenticate);

// ─── LAB CRUD ───────────────────────────────────────────────────────────────────
router.get('/', labController.getAll);
router.get('/:id', labController.getById);

router.post('/',
  authorize('ADMIN', 'LAB_MANAGER'),
  auditAction('CREATE', 'Lab'),
  labController.create
);

router.put('/:id',
  authorize('ADMIN', 'LAB_MANAGER'),
  auditAction('UPDATE', 'Lab'),
  labController.update
);

router.delete('/:id',
  authorize('ADMIN'),
  auditAction('DELETE', 'Lab'),
  labController.delete
);

// ─── LAB ACCESS CONTROL (Admin only) ────────────────────────────────────────────
router.get('/:labId/access',
  authorize('ADMIN'),
  labAccessController.getAccessForLab
);

router.get('/:labId/access/unassigned',
  authorize('ADMIN'),
  labAccessController.getUnassignedUsers
);

router.post('/:labId/access',
  authorize('ADMIN'),
  auditAction('GRANT_ACCESS', 'LabAccess'),
  labAccessController.grantAccess
);

router.delete('/:labId/access/:userId',
  authorize('ADMIN'),
  auditAction('REVOKE_ACCESS', 'LabAccess'),
  labAccessController.revokeAccess
);

export default router;
