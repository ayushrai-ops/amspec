import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { loginSchema, registerSchema, resetPasswordRequestSchema, resetPasswordSchema } from '../utils/validation';
import { AuthRequest } from '../types';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ success: false, error: 'Refresh token required' });
        return;
      }
      const result = await authService.refreshToken(refreshToken);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const user = await authService.register(data);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthRequest, res: Response) {
    res.json({ success: true, data: req.user });
  }

  async requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = resetPasswordRequestSchema.parse(req.body);
      const result = await authService.requestPasswordReset(email);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.params.token as string;
      const { password } = resetPasswordSchema.parse(req.body);
      const result = await authService.resetPassword(token, password);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
