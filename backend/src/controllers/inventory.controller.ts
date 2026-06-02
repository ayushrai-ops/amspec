import { Response, NextFunction } from 'express';
import inventoryService from '../services/inventory.service';
import { consumeSchema, disposeSchema } from '../utils/validation';
import { AuthRequest } from '../types';

export class InventoryController {
  async getTransactions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = req.query as any;
      const result = await inventoryService.getTransactions(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async consume(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { chemicalId, quantity, reason } = consumeSchema.parse(req.body);
      const transaction = await inventoryService.consume(chemicalId, quantity, reason, req.user!.id);
      res.status(201).json({ success: true, data: transaction });
    } catch (error) {
      next(error);
    }
  }

  async dispose(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { chemicalId, quantity, reason } = disposeSchema.parse(req.body);
      const transaction = await inventoryService.dispose(chemicalId, quantity, reason, req.user!.id);
      res.status(201).json({ success: true, data: transaction });
    } catch (error) {
      next(error);
    }
  }
}

export default new InventoryController();
