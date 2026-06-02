import { Response, NextFunction } from 'express';
import glasswareService from '../services/glassware.service';
import { AuthRequest } from '../types';

export class GlasswareController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = { labId: req.query.labId as string };
      const items = await glasswareService.getAll(filters);
      res.json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const item = await glasswareService.getById(req.params.id as string);
      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const item = await glasswareService.create(req.body);
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const item = await glasswareService.update(req.params.id as string, req.body);
      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await glasswareService.delete(req.params.id as string);
      res.json({ success: true, data: deleted, message: 'Glassware item deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new GlasswareController();
