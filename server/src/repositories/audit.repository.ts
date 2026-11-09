import prisma from '../config/db.js';
import { BaseRepository } from '../shared/base.repository.js';
import { IPaginatedResult, IPaginationOptions } from '../interfaces/pagination.interface.js';

export class AuditRepository extends BaseRepository<any> {
  public constructor() {
    super(prisma.auditLog);
  }

  protected override getModelName(): string {
    return 'auditLog';
  }

  public async getFilteredLogs(
    workspaceId: string,
    filter: { module?: string; action?: string; userId?: string } & IPaginationOptions
  ): Promise<IPaginatedResult<any>> {
    const { module, action, userId, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filter;
    const where: any = { workspaceId };
    if (module) where.module = module;
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const include = {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, designation: true }
      }
    };

    return this.findPaginated(where, { page, limit, sortBy, sortOrder }, include);
  }
}

export const auditRepository = new AuditRepository();

