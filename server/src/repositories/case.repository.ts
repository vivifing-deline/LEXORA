import prisma from '../config/db.js';
import { BaseRepository } from '../shared/base.repository.js';
import { ICaseFilter } from '../interfaces/case.interface.js';
import { IPaginatedResult } from '../interfaces/pagination.interface.js';

export class CaseRepository extends BaseRepository<any> {
  public constructor() {
    super(prisma.case);
  }

  protected override getModelName(): string {
    return 'case';
  }

  public async getFilteredCases(filter: ICaseFilter): Promise<IPaginatedResult<any>> {
    const {
      workspaceId,
      userId,
      isClient,
      search,
      practiceAreaId,
      status,
      stage,
      priority,
      courtId,
      advocateId,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filter;

    const where: any = { workspaceId, isArchived: false };

    if (isClient && userId) {
      const client = await prisma.client.findFirst({ where: { portalUserId: userId } });
      if (client) {
        where.clientId = client.id;
      }
    }

    if (practiceAreaId) where.practiceAreaId = String(practiceAreaId);
    if (status) where.status = String(status);
    if (stage) where.currentStage = { contains: String(stage) };
    if (priority) where.priority = String(priority);
    if (courtId) where.courtId = String(courtId);

    if (advocateId) {
      where.assignments = {
        some: { userId: String(advocateId) }
      };
    }

    if (search) {
      const q = String(search);
      where.OR = [
        { title: { contains: q } },
        { internalReference: { contains: q } },
        { courtCaseNumber: { contains: q } },
        { plaintiffPetitioner: { contains: q } },
        { defendantRespondent: { contains: q } },
        { client: { name: { contains: q } } }
      ];
    }

    const include = {
      client: { select: { id: true, name: true, clientReference: true, type: true } },
      practiceArea: true,
      court: true,
      assignments: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, designation: true } }
        }
      },
      hearings: {
        where: { hearingDate: { gte: new Date() } },
        orderBy: { hearingDate: 'asc' },
        take: 1
      },
      _count: {
        select: { documents: true, tasks: true, hearings: true, invoices: true }
      }
    };

    return this.findPaginated(where, { page, limit, sortBy, sortOrder }, include);
  }
}

export const caseRepository = new CaseRepository();
