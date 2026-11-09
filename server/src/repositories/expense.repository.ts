import prisma from '../config/db.js';
import { BaseRepository } from '../shared/base.repository.js';
import { IPaginatedResult, IPaginationOptions } from '../interfaces/pagination.interface.js';

export class ExpenseRepository extends BaseRepository<any> {
  public constructor() {
    super(prisma.expense);
  }

  protected override getModelName(): string {
    return 'expense';
  }

  public async getFilteredExpenses(
    workspaceId: string,
    filter: { caseId?: string; category?: string } & IPaginationOptions
  ): Promise<IPaginatedResult<any>> {
    const { caseId, category, page = 1, limit = 10, sortBy = 'expenseDate', sortOrder = 'desc' } = filter;
    const where: any = { workspaceId };
    if (caseId) where.caseId = String(caseId);
    if (category) where.category = String(category);

    const include = {
      case: { select: { id: true, title: true, internalReference: true } },
      recordedBy: { select: { id: true, firstName: true, lastName: true } }
    };

    return this.findPaginated(where, { page, limit, sortBy, sortOrder }, include);
  }
}

export const expenseRepository = new ExpenseRepository();

