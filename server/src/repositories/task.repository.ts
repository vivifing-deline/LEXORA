import prisma from '../config/db.js';
import { BaseRepository } from '../shared/base.repository.js';
import { ITaskFilter } from '../interfaces/task.interface.js';
import { IPaginatedResult } from '../interfaces/pagination.interface.js';

export class TaskRepository extends BaseRepository<any> {
  public constructor() {
    super(prisma.task);
  }

  protected override getModelName(): string {
    return 'task';
  }

  public async getFilteredTasks(filter: ITaskFilter): Promise<IPaginatedResult<any>> {
    const {
      workspaceId,
      caseId,
      assignedTo,
      status,
      priority,
      page = 1,
      limit = 10,
      sortBy = 'dueDate',
      sortOrder = 'asc'
    } = filter;

    const where: any = { workspaceId };

    if (caseId) where.caseId = String(caseId);
    if (status) where.status = String(status);
    if (priority) where.priority = String(priority);

    if (assignedTo) {
      where.assignments = {
        some: { userId: String(assignedTo) }
      };
    }

    const include = {
      case: { select: { id: true, title: true, internalReference: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      assignments: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, designation: true } }
        }
      }
    };

    return this.findPaginated(where, { page, limit, sortBy, sortOrder }, include);
  }
}

export const taskRepository = new TaskRepository();

