import { Response, NextFunction } from 'express';
import certificateService from '../services/certificate.service';
import { certificateSchema } from '../utils/validation';
import { AuthRequest } from '../types';

export class CertificateController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = req.query as any;
      const result = await certificateService.getAll(filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const certificate = await certificateService.getById(req.params.id as string);
      res.json({ success: true, data: certificate });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'File is required' });
        return;
      }

      const data = certificateSchema.parse({
        ...req.body,
        reminderDays: req.body.reminderDays ? parseInt(req.body.reminderDays) : undefined,
      });

      const certificate = await certificateService.create(data, req.file, req.user!.id);
      res.status(201).json({ success: true, data: certificate });
    } catch (error) {
      next(error);
    }
  }

  async download(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { filePath, originalFilename, mimeType } = await certificateService.getFilePath(req.params.id as string);
      res.setHeader('Content-Disposition', `attachment; filename="${originalFilename}"`);
      res.setHeader('Content-Type', mimeType);
      res.sendFile(filePath);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await certificateService.delete(req.params.id as string);
      res.json({ success: true, data: deleted, message: 'Certificate deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new CertificateController();
