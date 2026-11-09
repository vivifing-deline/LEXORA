import prisma from '../config/db.js';
import { BaseRepository } from '../shared/base.repository.js';

export class CalendarEventRepository extends BaseRepository<any> {
  public constructor() {
    super(prisma.calendarEvent);
  }

  protected override getModelName(): string {
    return 'calendarEvent';
  }
}

export const calendarEventRepository = new CalendarEventRepository();

