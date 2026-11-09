import prisma from '../config/db.js';
import { BaseRepository } from '../shared/base.repository.js';
import { IDocumentFilter } from '../interfaces/document.interface.js';
import { IPaginatedResult } from '../interfaces/pagination.interface.js';

export class DocumentRepository extends BaseRepository<any> {
  public constructor() {
    super(prisma.document);
  }

  protected override getModelName(): string {
    return 'document';
  }

  public async getFilteredDocuments(filter: IDocumentFilter): Promise<IPaginatedResult<any>> {
    const {
      workspaceId,
      caseId,
      category,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filter;

    const where: any = { workspaceId, isArchived: false };

    if (caseId) where.caseId = String(caseId);
    if (category) where.category = String(category);

    if (search) {
      const q = String(search);
      where.OR = [
        { title: { contains: q } },
        { fileName: { contains: q } },
        { description: { contains: q } }
      ];
    }

    const include = {
      case: { select: { id: true, title: true, internalReference: true } },
      uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      versions: { orderBy: { versionNumber: 'desc' }, take: 1 }
    };

    return this.findPaginated(where, { page, limit, sortBy, sortOrder }, include);
  }
}

export const documentRepository = new DocumentRepository();

