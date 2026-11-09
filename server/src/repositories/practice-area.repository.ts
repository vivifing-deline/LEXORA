import prisma from '../config/db.js';
import { BaseRepository } from '../shared/base.repository.js';

export class PracticeAreaRepository extends BaseRepository<any> {
  public constructor() {
    super(prisma.practiceArea);
  }

  protected override getModelName(): string {
    return 'practiceArea';
  }
}

export const practiceAreaRepository = new PracticeAreaRepository();

