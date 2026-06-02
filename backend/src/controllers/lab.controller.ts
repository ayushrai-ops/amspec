import { Response, NextFunction } from 'express';
import labService from '../services/lab.service';
import { AuthRequest } from '../types';

export class LabController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const labs = await labService.getAll(req.user!);
      res.json({ success: true, data: labs });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const lab = await labService.getById(req.params.id as string, req.user!);
      res.json({ success: true, data: lab });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const lab = await labService.create(req.body);
      res.status(201).json({ success: true, data: lab });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const lab = await labService.update(req.params.id as string, req.body);
      res.json({ success: true, data: lab });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await labService.delete(req.params.id as string);
      res.json({ success: true, data: deleted, message: 'Lab deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new LabController();
