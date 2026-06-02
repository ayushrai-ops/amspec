import { Response, NextFunction } from 'express';
import chemicalService from '../services/chemical.service';
import barcodeService from '../services/barcode.service';
import { chemicalSchema, chemicalUpdateSchema } from '../utils/validation';
import { AuthRequest, ChemicalFilters } from '../types';

export class ChemicalController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = req.query as unknown as ChemicalFilters;
      const result = await chemicalService.getAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const chemical = await chemicalService.getById(req.params.id as string);
      res.json({ success: true, data: chemical });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = chemicalSchema.parse(req.body);
      const chemical = await chemicalService.create(data, req.user!.id);
      res.status(201).json({ success: true, data: chemical });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = chemicalUpdateSchema.parse(req.body);
      const result = await chemicalService.update(req.params.id as string, data);
      res.json({ success: true, data: result.chemical, previousData: result.previousData });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await chemicalService.delete(req.params.id as string);
      res.json({ success: true, data: deleted, message: 'Chemical deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getQRCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const chemical = await chemicalService.getById(req.params.id as string);
      const qrCode = await barcodeService.generateQRCode(chemical);
      res.json({ success: true, data: { qrCode } });
    } catch (error) {
      next(error);
    }
  }
}

export default new ChemicalController();
