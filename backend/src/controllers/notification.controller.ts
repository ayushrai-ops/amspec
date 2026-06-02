import { Response, NextFunction } from 'express';
import notificationService from '../services/notification.service';
import { AuthRequest } from '../types';

export class NotificationController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = req.query as any;
      const result = await notificationService.getUserNotifications(req.user!.id, filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.markAsRead(req.params.id as string, req.user!.id);
      if (!result) {
        res.status(404).json({ success: false, error: 'Notification not found' });
        return;
      }
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.markAllAsRead(req.user!.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const count = await notificationService.getUnreadCount(req.user!.id);
      res.json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
