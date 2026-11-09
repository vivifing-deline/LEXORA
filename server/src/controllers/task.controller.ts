import { Request, Response } from 'express';
import { taskService, TaskService } from '../services/task.service.js';
import { sendSuccess, sendError, sendPaginated } from '../shared/response.js';
import { HTTP_STATUS } from '../constants/error-codes.constant.js';

export class TaskController {
  public constructor(private readonly service: TaskService = taskService) {}

  public getTasks = async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.user!.workspaceId;
      const { caseId, status, priority, assignedTo, page = '1', limit = '50' } = req.query;

      const result = await this.service.getTasks({
        workspaceId,
        caseId: caseId ? String(caseId) : undefined,
        status: status ? String(status) : undefined,
        priority: priority ? String(priority) : undefined,
        assignedTo: assignedTo ? String(assignedTo) : undefined,
        page: parseInt(String(page), 10) || 1,
        limit: parseInt(String(limit), 10) || 50
      });

      sendPaginated(res, result.data, result.meta, 'Tasks retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public getTaskById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const task = await this.service.getTaskById(id);
      if (!task) {
        sendError(res, 'Task not found', HTTP_STATUS.NOT_FOUND);
        return;
      }
      sendSuccess(res, task);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public createTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.user!.workspaceId;
      const userId = req.user!.id;
      const task = await this.service.createTask(workspaceId, userId, req.body);
      sendSuccess(res, task, 'Task created successfully', HTTP_STATUS.CREATED);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public updateTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const task = await this.service.updateTask(id, req.body);
      sendSuccess(res, task, 'Task updated successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public deleteTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.deleteTask(id);
      sendSuccess(res, null, 'Task deleted successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };
}

export const taskController = new TaskController();

