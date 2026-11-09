import { Request, Response } from 'express';
import { dashboardService, DashboardService } from '../services/dashboard.service.js';
import { sendSuccess, sendError } from '../shared/response.js';
import { HTTP_STATUS } from '../constants/error-codes.constant.js';

export class DashboardController {
  public constructor(private readonly service: DashboardService = dashboardService) {}

  public getDashboardMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.user!.workspaceId;
      const userId = req.user!.id;
      const isClient = req.user!.roles.includes('Client');

      const metrics = await this.service.getDashboardMetrics(workspaceId, userId, isClient);
      sendSuccess(res, metrics);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };
}

export const dashboardController = new DashboardController();

