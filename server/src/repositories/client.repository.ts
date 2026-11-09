import prisma from '../config/db.js';
import { BaseRepository } from '../shared/base.repository.js';
import { IClientFilter } from '../interfaces/client.interface.js';
import { IPaginatedResult } from '../interfaces/pagination.interface.js';

export class ClientRepository extends BaseRepository<any> {
  public constructor() {
    super(prisma.client);
  }

  protected override getModelName(): string {
    return 'client';
  }

  public async getFilteredClients(filter: IClientFilter): Promise<IPaginatedResult<any>> {
    const {
      workspaceId,
      search,
      type,
      status,
      advocateId,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filter;

    const where: any = { workspaceId };

    if (type) where.type = String(type);
    if (status) where.status = String(status);
    if (advocateId) where.assignedAdvocateId = String(advocateId);

    if (search) {
      const q = String(search);
      where.OR = [
        { name: { contains: q } },
        { clientReference: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { nationalId: { contains: q } }
      ];
    }

    const include = {
      assignedAdvocate: {
        select: { id: true, firstName: true, lastName: true, designation: true }
      },
      contacts: true,
      _count: {
        select: { cases: true, invoices: true, documents: true }
      }
    };

    return this.findPaginated(where, { page, limit, sortBy, sortOrder }, include);
  }
}

export const clientRepository = new ClientRepository();
