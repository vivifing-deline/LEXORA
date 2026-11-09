import prisma from '../config/db.js';
import { taskRepository, TaskRepository } from '../repositories/task.repository.js';
import { ITaskFilter, ICreateTaskDto, IUpdateTaskDto } from '../interfaces/task.interface.js';
import { IPaginatedResult } from '../interfaces/pagination.interface.js';
import { TaskStatus, Priority } from '../enums/index.js';

export class TaskService {
  public constructor(private readonly repo: TaskRepository = taskRepository) {}

  public async getTasks(filter: ITaskFilter): Promise<IPaginatedResult<any>> {
    return this.repo.getFilteredTasks(filter);
  }

  public async getTaskById(id: string): Promise<any> {
    return prisma.task.findUnique({
      where: { id },
      include: {
        case: true,
        client: true,
        createdBy: true,
        assignments: { include: { user: true } }
      }
    });
  }

  public async createTask(workspaceId: string, userId: string, data: ICreateTaskDto & { clientId?: string; taskType?: string; startDate?: string | Date }): Promise<any> {
    const {
      title,
      description,
      caseId,
      clientId,
      taskType = 'General',
      priority = Priority.MEDIUM,
      startDate,
      dueDate,
      assignedUserIds = []
    } = data;

    const task = await prisma.task.create({
      data: {
        workspaceId,
        caseId: caseId || null,
        clientId: clientId || null,
        title: title.trim(),
        description: description || null,
        taskType,
        priority,
        status: TaskStatus.TODO,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: userId,
        assignments: assignedUserIds.length > 0 ? {
          create: assignedUserIds.map((uId: string) => ({ userId: uId }))
        } : undefined
      },
      include: {
        case: true,
        client: true,
        assignments: { include: { user: true } }
      }
    });

    for (const aId of assignedUserIds) {
      await prisma.notification.create({
        data: {
          userId: aId,
          title: 'New Task Assigned',
          message: `You were assigned task: "${title}"`,
          type: 'task',
          linkUrl: '/tasks'
        }
      });
    }

    return task;
  }

  public async updateTask(id: string, updates: IUpdateTaskDto & { completionNotes?: string; taskType?: string }): Promise<any> {
    const { status, completionNotes, priority, dueDate, title, description, assignedUserIds } = updates;

    const task = await prisma.task.update({
      where: { id },
      data: {
        status: status !== undefined ? status : undefined,
        completionNotes: completionNotes !== undefined ? completionNotes : undefined,
        priority: priority !== undefined ? priority : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        title: title ? title.trim() : undefined,
        description: description !== undefined ? description : undefined,
        completedAt: status === TaskStatus.COMPLETED ? new Date() : (status === TaskStatus.TODO || status === TaskStatus.IN_PROGRESS ? null : undefined)
      },
      include: {
        case: true,
        assignments: { include: { user: true } }
      }
    });

    if (assignedUserIds && Array.isArray(assignedUserIds)) {
      await prisma.taskAssignment.deleteMany({ where: { taskId: id } });
      for (const uId of assignedUserIds) {
        await prisma.taskAssignment.create({
          data: { taskId: id, userId: uId }
        });
      }
    }

    return task;
  }

  public async deleteTask(id: string): Promise<void> {
    await prisma.taskAssignment.deleteMany({ where: { taskId: id } });
    await prisma.task.delete({ where: { id } });
  }
}

export const taskService = new TaskService();

