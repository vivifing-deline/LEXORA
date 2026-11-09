import prisma from '../config/db.js';
import { BaseRepository } from '../shared/base.repository.js';

export class NotificationRepository extends BaseRepository<any> {
  public constructor() {
    super(prisma.notification);
  }

  protected override getModelName(): string {
    return 'notification';
  }
}

export const notificationRepository = new NotificationRepository();

