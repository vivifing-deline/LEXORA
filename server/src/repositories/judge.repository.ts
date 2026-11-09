import prisma from '../config/db.js';
import { BaseRepository } from '../shared/base.repository.js';

export class JudgeRepository extends BaseRepository<any> {
  public constructor() {
    super(prisma.judge);
  }

  protected override getModelName(): string {
    return 'judge';
  }
}

export const judgeRepository = new JudgeRepository();

