import { Request, Response } from 'express';
import { authService, AuthService } from '../services/auth.service.js';
import { sendSuccess, sendError } from '../shared/response.js';
import { HTTP_STATUS } from '../constants/error-codes.constant.js';

export class AuthController {
  public constructor(private readonly service: AuthService = authService) {}

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        sendError(res, 'Email and password are required', HTTP_STATUS.BAD_REQUEST);
        return;
      }

      const result = await this.service.login({ email, password }, req.ip);
      sendSuccess(res, result, 'Login successful');
    } catch (error: any) {
      sendError(res, error.message || 'Login failed', HTTP_STATUS.UNAUTHORIZED);
    }
  };

  public getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const user = await this.service.getProfile(userId);
      if (!user) {
        sendError(res, 'User not found', HTTP_STATUS.NOT_FOUND);
        return;
      }

      sendSuccess(res, {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        designation: user.designation,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        themePreference: user.themePreference,
        department: user.department?.name,
        workspace: user.workspace,
        roles: req.user!.roles,
        permissions: req.user!.permissions
      });
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const updated = await this.service.updateProfile(userId, req.body);
      sendSuccess(res, updated, 'Profile updated successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        sendError(res, 'Both current and new passwords are required', HTTP_STATUS.BAD_REQUEST);
        return;
      }

      await this.service.changePassword(userId, currentPassword, newPassword);
      sendSuccess(res, null, 'Password changed successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.BAD_REQUEST);
    }
  };
}

export const authController = new AuthController();

