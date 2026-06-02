import { Response, NextFunction } from 'express';
import labAccessService from '../services/labAccess.service';
import { AuthRequest } from '../types';

export class LabAccessController {
  /**
   * GET /api/labs/:labId/access — List all access records for a lab (admin only)
   */
  async getAccessForLab(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const records = await labAccessService.getAccessForLab(req.params.labId as string);
      res.json({ success: true, data: records });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/labs/:labId/access — Grant or update access
   */
  async grantAccess(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId, accessLevel, isTemporary, expiresAt } = req.body;
      const record = await labAccessService.grantAccess({
        userId,
        labId: req.params.labId as string,
        accessLevel,
        grantedBy: req.user!.id,
        isTemporary,
        expiresAt,
      });
      res.status(201).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/labs/:labId/access/:userId — Revoke access
   */
  async revokeAccess(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await labAccessService.revokeAccess(req.params.userId as string, req.params.labId as string);
      res.json({ success: true, message: 'Access revoked successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/labs/:labId/access/unassigned — Get users not assigned to this lab
   */
  async getUnassignedUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const users = await labAccessService.getUnassignedUsers(req.params.labId as string);
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }
}

export default new LabAccessController();
