import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

export const dashboardRouter: Router = Router();

dashboardRouter.get('/', authenticateJWT, dashboardController.getDashboardMetrics);

export default dashboardRouter;

