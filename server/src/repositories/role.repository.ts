import prisma from '../config/db.js';
import { BaseRepository } from '../shared/base.repository.js';

export class RoleRepository extends BaseRepository<any> {
  public constructor() {
    super(prisma.role);
  }

  protected override getModelName(): string {
    return 'role';
  }
}

export const roleRepository = new RoleRepository();

