import { Router } from 'express';
import { taskController } from '../controllers/task.controller.js';
import { authenticateJWT, requirePermission } from '../middleware/auth.middleware.js';
import { PERMISSIONS } from '../constants/permissions.constant.js';

export const taskRouter: Router = Router();

taskRouter.use(authenticateJWT);

taskRouter.get('/', requirePermission(PERMISSIONS.TASK_VIEW), taskController.getTasks);
taskRouter.get('/:id', requirePermission(PERMISSIONS.TASK_VIEW), taskController.getTaskById);
taskRouter.post('/', requirePermission(PERMISSIONS.TASK_CREATE), taskController.createTask);
taskRouter.put('/:id', requirePermission(PERMISSIONS.TASK_EDIT), taskController.updateTask);
taskRouter.delete('/:id', requirePermission(PERMISSIONS.TASK_DELETE), taskController.deleteTask);

export default taskRouter;

