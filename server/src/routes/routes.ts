import { Router } from 'express';
import { getSafeClientConfig } from '../config/env.js';
import { caseRouter } from './case.routes.js';
import { clientRouter } from './client.routes.js';
import { hearingRouter } from './hearing.routes.js';
import { taskRouter } from './task.routes.js';
import { documentRouter } from './document.routes.js';
import { financeRouter } from './finance.routes.js';
import { systemRouter } from './system.routes.js';
import { dashboardRouter } from './dashboard.routes.js';
import { authRouter } from './auth.routes.js';
import { healthRouter } from './health.routes.js';

export const routes: Router = Router();

// Public configuration endpoint
routes.get('/config', (_req, res) => {
  res.json({
    success: true,
    data: getSafeClientConfig()
  });
});

routes.use('/health', healthRouter);
routes.use('/auth', authRouter);
routes.use('/dashboard', dashboardRouter);
routes.use('/clients', clientRouter);
routes.use('/cases', caseRouter);
routes.use('/hearings', hearingRouter);
routes.use('/documents', documentRouter);
routes.use('/tasks', taskRouter);
routes.use('/finance', financeRouter);
routes.use('/system', systemRouter);

export default routes;

