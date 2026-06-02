import { Response, NextFunction } from 'express';
import reportService from '../services/report.service';
import { AuthRequest } from '../types';

export class ReportController {
  async expiryReportPDF(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const buffer = await reportService.generateExpiryReportPDF();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="expiry-report.pdf"');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  async inventoryExcel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const buffer = await reportService.generateInventoryExcel();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="inventory-report.xlsx"');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  async auditExcel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const buffer = await reportService.generateAuditExcel(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-report.xlsx"');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

export default new ReportController();
