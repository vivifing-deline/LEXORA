import prisma from '../config/db.js';
import { BaseRepository } from '../shared/base.repository.js';

export class DepartmentRepository extends BaseRepository<any> {
  public constructor() {
    super(prisma.department);
  }

  protected override getModelName(): string {
    return 'department';
  }
}

export const departmentRepository = new DepartmentRepository();

