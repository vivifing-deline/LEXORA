import { Request, Response } from 'express';
import { sendSuccess } from '../shared/response.js';
import { config } from '../config/env.js';

export class HealthController {
  public getHealth = (_req: Request, res: Response): void => {
    sendSuccess(res, {
      status: 'healthy',
      appMode: config.appMode,
      demoMode: config.demoMode,
      timestamp: new Date().toISOString(),
      version: config.version
    });
  };
}

export const healthController = new HealthController();

