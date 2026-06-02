import { Response, NextFunction } from 'express';
import consumableService from '../services/consumable.service';
import { AuthRequest } from '../types';

export class ConsumableController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = { labId: req.query.labId as string };
      const items = await consumableService.getAll(filters);
      res.json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const item = await consumableService.getById(req.params.id as string);
      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const item = await consumableService.create(req.body);
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const item = await consumableService.update(req.params.id as string, req.body);
      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await consumableService.delete(req.params.id as string);
      res.json({ success: true, data: deleted, message: 'Consumable item deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new ConsumableController();
