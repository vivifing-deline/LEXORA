import prisma from '../config/db.js';
import { BaseRepository } from '../shared/base.repository.js';

export class CourtRepository extends BaseRepository<any> {
  public constructor() {
    super(prisma.court);
  }

  protected override getModelName(): string {
    return 'court';
  }
}

export const courtRepository = new CourtRepository();

