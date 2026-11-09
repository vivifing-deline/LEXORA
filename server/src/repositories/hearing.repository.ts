import prisma from '../config/db.js';
import { BaseRepository } from '../shared/base.repository.js';
import { IHearingFilter } from '../interfaces/hearing.interface.js';
import { IPaginatedResult } from '../interfaces/pagination.interface.js';

export class HearingRepository extends BaseRepository<any> {
  public constructor() {
    super(prisma.hearing);
  }

  protected override getModelName(): string {
    return 'hearing';
  }

  public async getFilteredHearings(filter: IHearingFilter): Promise<IPaginatedResult<any>> {
    const {
      workspaceId,
      userId,
      isClient,
      caseId,
      courtId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'hearingDate',
      sortOrder = 'asc'
    } = filter;

    const where: any = {
      case: { workspaceId }
    };

    if (caseId) where.caseId = String(caseId);
    if (courtId) where.courtId = String(courtId);
    if (status) where.status = String(status);

    if (startDate || endDate) {
      where.hearingDate = {};
      if (startDate) where.hearingDate.gte = new Date(startDate);
      if (endDate) where.hearingDate.lte = new Date(endDate);
    }

    if (isClient && userId) {
      const client = await prisma.client.findFirst({ where: { portalUserId: userId } });
      if (client) {
        where.case.clientId = client.id;
      }
    }

    const include = {
      case: {
        select: {
          id: true,
          title: true,
          courtCaseNumber: true,
          internalReference: true,
          client: { select: { id: true, name: true } }
        }
      },
      court: true,
      judge: true,
      assignedAdvocate: {
        select: { id: true, firstName: true, lastName: true, designation: true }
      }
    };

    return this.findPaginated(where, { page, limit, sortBy, sortOrder }, include);
  }
}

export const hearingRepository = new HearingRepository();

