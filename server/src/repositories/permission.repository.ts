import prisma from '../config/db.js';
import { BaseRepository } from '../shared/base.repository.js';

export class PermissionRepository extends BaseRepository<any> {
  public constructor() {
    super(prisma.permission);
  }

  protected override getModelName(): string {
    return 'permission';
  }
}

export const permissionRepository = new PermissionRepository();

