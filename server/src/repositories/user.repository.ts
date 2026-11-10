import prisma from '../config/db.js';
import { BaseRepository } from '../shared/base.repository.js';
import { IUserFilter } from '../interfaces/system.interface.js';
import { IPaginatedResult } from '../interfaces/pagination.interface.js';

export class UserRepository extends BaseRepository<any> {
  public constructor() {
    super(prisma.user);
  }

  protected override getModelName(): string {
    return 'user';
  }

  public async getFilteredUsers(filter: IUserFilter): Promise<IPaginatedResult<any>> {
    const {
      workspaceId,
      search,
      roleId,
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filter;

    const where: any = { workspaceId };

    if (isActive !== undefined) where.isActive = isActive;
    if (roleId) {
      where.userRoles = {
        some: { roleId }
      };
    }

    if (search) {
      const q = String(search);
      where.OR = [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { email: { contains: q } },
        { designation: { contains: q } }
      ];
    }

    const include = {
      department: true,
      userRoles: {
        include: { role: true }
      },
      userPermissions: {
        include: { permission: true }
      },
      _count: {
        select: { caseAssignments: true, taskAssignments: true }
      }
    };

    const result = await this.findPaginated(where, { page, limit, sortBy, sortOrder }, include);
    const enriched = (result.data || []).map((u: any) => ({
      ...u,
      fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
      roles: (u.userRoles || []).map((ur: any) => ur.role?.name).filter(Boolean)
    }));
    return { ...result, data: enriched };
  }
}

export const userRepository = new UserRepository();

