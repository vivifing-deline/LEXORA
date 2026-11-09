import prisma from '../config/db.js';
import { hearingRepository, HearingRepository } from '../repositories/hearing.repository.js';
import { courtRepository } from '../repositories/court.repository.js';
import { judgeRepository } from '../repositories/judge.repository.js';
import { IHearingFilter, ICreateHearingDto, IUpdateHearingDto } from '../interfaces/hearing.interface.js';
import { IPaginatedResult } from '../interfaces/pagination.interface.js';
import { HearingStatus } from '../enums/index.js';

export class HearingService {
  public constructor(
    private readonly repo: HearingRepository = hearingRepository
  ) {}

  public async getHearings(filter: IHearingFilter): Promise<IPaginatedResult<any>> {
    return this.repo.getFilteredHearings(filter);
  }

  public async getHearingById(id: string): Promise<any> {
    return prisma.hearing.findUnique({
      where: { id },
      include: {
        case: true,
        court: true,
        judge: true,
        assignedAdvocate: true,
        proceedings: true
      }
    });
  }

  public async createHearing(data: ICreateHearingDto & { hearingTime?: string; courtroom?: string; userEmail?: string }): Promise<any> {
    const {
      caseId,
      courtId,
      judgeId,
      hearingDate,
      hearingTime,
      courtRoom,
      courtroom,
      assignedAdvocateId,
      purpose,
      bench
    } = data;

    const hearing = await prisma.hearing.create({
      data: {
        caseId,
        courtId: courtId || null,
        judgeId: judgeId || null,
        hearingDate: new Date(hearingDate),
        hearingTime: hearingTime || null,
        courtroom: courtRoom || courtroom || null,
        assignedAdvocateId: assignedAdvocateId || null,
        purpose: purpose.trim(),
        bench: bench || null,
        status: HearingStatus.SCHEDULED
      },
      include: {
        case: true,
        court: true,
        assignedAdvocate: true
      }
    });

    // Calendar Event
    const calStart = new Date(hearingDate);
    const calEnd = new Date(calStart.getTime() + 60 * 60 * 1000);
    await prisma.calendarEvent.create({
      data: {
        caseId,
        title: `Court Hearing: ${hearing.case.internalReference} (${purpose})`,
        eventType: 'hearing',
        startTime: calStart,
        endTime: calEnd,
        location: courtRoom || courtroom || hearing.court?.name,
        colorCode: '#4F46E5'
      }
    });

    // Notification
    if (assignedAdvocateId) {
      await prisma.notification.create({
        data: {
          userId: assignedAdvocateId,
          title: 'Court Hearing Scheduled',
          message: `Hearing listed for case ${hearing.case.internalReference} on ${new Date(hearingDate).toLocaleDateString()} at ${hearingTime || '09:00 AM'}`,
          type: 'hearing',
          linkUrl: '/hearings'
        }
      });
    }

    return hearing;
  }

  public async updateHearing(id: string, updates: IUpdateHearingDto & { hearingTime?: string; courtroom?: string; orderPassed?: string; adjournmentReason?: string }): Promise<any> {
    const updated = await prisma.hearing.update({
      where: { id },
      data: {
        courtId: updates.courtId !== undefined ? updates.courtId : undefined,
        judgeId: updates.judgeId !== undefined ? updates.judgeId : undefined,
        hearingDate: updates.hearingDate ? new Date(updates.hearingDate) : undefined,
        hearingTime: updates.hearingTime !== undefined ? updates.hearingTime : undefined,
        courtroom: (updates.courtRoom || updates.courtroom) !== undefined ? (updates.courtRoom || updates.courtroom) : undefined,
        assignedAdvocateId: updates.assignedAdvocateId !== undefined ? updates.assignedAdvocateId : undefined,
        purpose: updates.purpose !== undefined ? updates.purpose.trim() : undefined,
        bench: updates.bench !== undefined ? updates.bench : undefined,
        status: updates.status !== undefined ? updates.status : undefined,
        proceedingsSummary: updates.proceedingsSummary !== undefined ? updates.proceedingsSummary : undefined,
        orderPassed: updates.orderPassed !== undefined ? updates.orderPassed : undefined,
        adjournmentReason: updates.adjournmentReason !== undefined ? updates.adjournmentReason : undefined,
        nextHearingDate: updates.nextHearingDate ? new Date(updates.nextHearingDate) : undefined,
        nextHearingPurpose: updates.nextHearingPurpose !== undefined ? updates.nextHearingPurpose : undefined
      },
      include: {
        case: true,
        court: true,
        judge: true,
        assignedAdvocate: true
      }
    });

    if (updates.nextHearingDate && updates.status === HearingStatus.ADJOURNED) {
      await prisma.hearing.create({
        data: {
          caseId: updated.caseId,
          courtId: updated.courtId,
          judgeId: updated.judgeId,
          assignedAdvocateId: updated.assignedAdvocateId,
          hearingDate: new Date(updates.nextHearingDate),
          purpose: updates.nextHearingPurpose || 'Adjourned Hearing Proceedings',
          status: HearingStatus.SCHEDULED
        }
      });
    }

    return updated;
  }

  public async deleteHearing(id: string): Promise<any> {
    return prisma.hearing.delete({ where: { id } });
  }

  public async getCauseList(workspaceId: string, dateStr?: string): Promise<any> {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    const hearings = await prisma.hearing.findMany({
      where: {
        hearingDate: { gte: startOfDay, lte: endOfDay },
        case: { workspaceId }
      },
      include: {
        case: true,
        court: true,
        judge: true,
        assignedAdvocate: true
      },
      orderBy: [{ hearingDate: 'asc' }]
    });

    const conflicts: any[] = [];
    const advocateMap = new Map<string, any[]>();
    for (const h of hearings) {
      if (h.assignedAdvocateId) {
        const list = advocateMap.get(h.assignedAdvocateId) || [];
        list.push(h);
        advocateMap.set(h.assignedAdvocateId, list);
      }
    }

    for (const [advId, list] of advocateMap.entries()) {
      if (list.length > 1) {
        const distinctCourts = new Set(list.map(h => h.courtId).filter(Boolean));
        if (distinctCourts.size > 1) {
          conflicts.push({
            advocateId: advId,
            advocateName: list[0].assignedAdvocate ? `${list[0].assignedAdvocate.firstName} ${list[0].assignedAdvocate.lastName}` : 'Chamber Counsel',
            hearingsCount: list.length,
            message: `Counsel has ${list.length} simultaneous listings across ${distinctCourts.size} different courts on ${targetDate.toLocaleDateString()}`
          });
        }
      }
    }

    return { date: targetDate, hearings, conflicts };
  }

  public async rescheduleHearing(id: string, updates: { newDate: string; reason?: string; courtroom?: string; bench?: string; hearingTime?: string }): Promise<any> {
    const hearing = await prisma.hearing.findUnique({ where: { id } });
    if (!hearing) throw new Error('Hearing record not found');

    const updated = await prisma.hearing.update({
      where: { id },
      data: {
        hearingDate: new Date(updates.newDate),
        adjournmentReason: updates.reason || 'Rescheduled by chamber clerk',
        status: HearingStatus.SCHEDULED,
        ...(updates.courtroom ? { courtroom: updates.courtroom } : {}),
        ...(updates.hearingTime ? { hearingTime: updates.hearingTime } : {})
      },
      include: {
        case: true,
        court: true,
        judge: true,
        assignedAdvocate: true
      }
    });

    return updated;
  }

  // Courts
  public async getCourts(workspaceId?: string): Promise<any[]> {
    return courtRepository.findMany(
      workspaceId ? { workspaceId } : {},
      { orderBy: { name: 'asc' } },
      { judges: true, _count: { select: { cases: true, hearings: true } } }
    );
  }

  public async createCourt(data: any): Promise<any> {
    return courtRepository.create(data);
  }

  public async updateCourt(id: string, data: any): Promise<any> {
    return courtRepository.update({ id }, data);
  }

  public async deleteCourt(id: string): Promise<void> {
    const casesCount = await prisma.case.count({ where: { courtId: id } });
    if (casesCount > 0) {
      await courtRepository.update({ id }, { isActive: false });
      return;
    }
    await prisma.judge.deleteMany({ where: { courtId: id } });
    await courtRepository.delete({ id });
  }

  // Judges
  public async getJudges(courtId?: string): Promise<any[]> {
    const where: any = courtId ? { courtId } : {};
    return judgeRepository.findMany(where, { orderBy: { name: 'asc' } }, { court: true });
  }

  public async createJudge(data: any): Promise<any> {
    return judgeRepository.create(data);
  }

  public async updateJudge(id: string, data: any): Promise<any> {
    return judgeRepository.update({ id }, data);
  }

  public async deleteJudge(id: string): Promise<void> {
    await judgeRepository.delete({ id });
  }

  // Proceedings
  public async createProceeding(data: any): Promise<any> {
    return prisma.caseProceeding.create({ data });
  }

  public async deleteProceeding(id: string): Promise<void> {
    await prisma.caseProceeding.delete({ where: { id } });
  }
}

export const hearingService = new HearingService();

