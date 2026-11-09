import prisma from '../config/db.js';
import { BaseRepository } from '../shared/base.repository.js';
import { IInvoiceFilter } from '../interfaces/finance.interface.js';
import { IPaginatedResult } from '../interfaces/pagination.interface.js';

export class InvoiceRepository extends BaseRepository<any> {
  public constructor() {
    super(prisma.invoice);
  }

  protected override getModelName(): string {
    return 'invoice';
  }

  public async getFilteredInvoices(filter: IInvoiceFilter): Promise<IPaginatedResult<any>> {
    const {
      workspaceId,
      clientId,
      caseId,
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filter;

    const where: any = { workspaceId };

    if (clientId) where.clientId = String(clientId);
    if (caseId) where.caseId = String(caseId);
    if (status) where.status = String(status);

    const include = {
      client: { select: { id: true, name: true, clientReference: true } },
      case: { select: { id: true, title: true, internalReference: true } },
      items: true,
      payments: true,
      createdBy: { select: { id: true, firstName: true, lastName: true } }
    };

    return this.findPaginated(where, { page, limit, sortBy, sortOrder }, include);
  }
}

export const invoiceRepository = new InvoiceRepository();

