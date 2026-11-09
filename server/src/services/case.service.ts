import prisma from '../config/db.js';
import { caseRepository, CaseRepository } from '../repositories/case.repository.js';
import { ICaseFilter, ICreateCaseDto, IUpdateCaseDto } from '../interfaces/case.interface.js';
import { IPaginatedResult } from '../interfaces/pagination.interface.js';
import { CaseStatus, CaseStage, Priority, AuditAction } from '../enums/index.js';

export class CaseService {
  public constructor(private readonly repo: CaseRepository = caseRepository) {}

  public async getCases(filter: ICaseFilter): Promise<IPaginatedResult<any>> {
    return this.repo.getFilteredCases(filter);
  }

  public async getCaseById(id: string, workspaceId: string): Promise<any> {
    return prisma.case.findFirst({
      where: { id, workspaceId },
      include: {
        client: true,
        practiceArea: true,
        court: { include: { judges: true } },
        parties: true,
        assignments: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, designation: true, phone: true }
            }
          }
        },
        stages: { orderBy: { orderIndex: 'asc' } },
        hearings: {
          include: { judge: true, court: true },
          orderBy: { hearingDate: 'desc' }
        },
        proceedings: { orderBy: { date: 'desc' } },
        diaries: {
          include: { advocate: { select: { firstName: true, lastName: true } } },
          orderBy: { entryDate: 'desc' }
        },
        documents: {
          include: { uploadedBy: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' }
        },
        tasks: {
          include: { assignments: { include: { user: true } } },
          orderBy: { dueDate: 'asc' }
        },
        invoices: {
          include: { items: true, payments: true },
          orderBy: { issueDate: 'desc' }
        },
        expenses: {
          orderBy: { expenseDate: 'desc' }
        },
        legalReferences: {
          include: { legalReference: true }
        },
        history: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  public async createCase(workspaceId: string, data: ICreateCaseDto, userEmail: string, userIp?: string): Promise<any> {
    const {
      title,
      clientId,
      practiceAreaId,
      courtId,
      judgeId,
      courtCaseNumber,
      internalReference,
      plaintiffPetitioner,
      defendantRespondent,
      opposingCounsel,
      currentStage = CaseStage.FILING,
      status = CaseStatus.ACTIVE,
      priority = Priority.MEDIUM,
      filingDate,
      registrationDate,
      description,
      financialAgreement,
      importantNotes,
      assignedLawyerIds = [],
      assignedClerkId
    } = data;

    let finalRef = internalReference;
    if (!finalRef) {
      const year = new Date().getFullYear();
      const count = await this.repo.count({ workspaceId });
      finalRef = `LEX-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    const newCase = await prisma.case.create({
      data: {
        workspaceId,
        title,
        clientId,
        practiceAreaId,
        courtId: courtId || null,
        caseType: 'Civil Suit',
        courtCaseNumber: courtCaseNumber || null,
        internalReference: finalRef,
        plaintiffPetitioner,
        defendantRespondent,
        opposingCounsel: opposingCounsel || null,
        currentStage,
        status,
        priority,
        filingDate: filingDate ? new Date(filingDate) : new Date(),
        registrationDate: registrationDate ? new Date(registrationDate) : new Date(),
        description: description || null,
        financialAgreement: financialAgreement || null,
        importantNotes: importantNotes || null,
        assignments: {
          create: [
            ...assignedLawyerIds.map((userId: string, idx: number) => ({
              userId,
              roleInCase: idx === 0 ? 'Lead Counsel' : 'Co-Counsel',
              isLead: idx === 0
            })),
            ...(assignedClerkId ? [{ userId: assignedClerkId, roleInCase: 'Clerk', isLead: false }] : [])
          ]
        },
        stages: {
          create: [
            { stageName: 'Filing', orderIndex: 1, status: 'completed', completedAt: new Date() },
            { stageName: 'Preliminary', orderIndex: 2, status: 'pending' },
            { stageName: 'Evidence', orderIndex: 3, status: 'pending' },
            { stageName: 'Arguments', orderIndex: 4, status: 'pending' },
            { stageName: 'Order / Judgment', orderIndex: 5, status: 'pending' },
            { stageName: 'Execution / Appeal', orderIndex: 6, status: 'pending' }
          ]
        },
        history: {
          create: {
            action: 'Case Created',
            description: `Case registered with reference ${finalRef}`,
            performedBy: userEmail
          }
        }
      },
      include: {
        client: true,
        practiceArea: true,
        court: true,
        assignments: { include: { user: true } }
      }
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        action: AuditAction.CREATE,
        module: 'Cases',
        entityId: newCase.id,
        entityName: newCase.title,
        newValues: JSON.stringify({ reference: finalRef, title }),
        ipAddress: userIp
      }
    });

    return newCase;
  }

  public async updateCase(id: string, workspaceId: string, data: IUpdateCaseDto, userEmail: string): Promise<any> {
    const {
      title,
      clientId,
      practiceAreaId,
      courtId,
      judgeId,
      courtCaseNumber,
      plaintiffPetitioner,
      defendantRespondent,
      opposingCounsel,
      priority,
      status,
      currentStage,
      description,
      financialAgreement,
      importantNotes,
      filingDate
    } = data;

    const updated = await prisma.case.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(clientId && { clientId }),
        ...(practiceAreaId && { practiceAreaId }),
        ...(courtId !== undefined && { courtId: courtId || null }),
        ...(judgeId !== undefined && { judgeId: judgeId || null }),
        ...(courtCaseNumber !== undefined && { courtCaseNumber: courtCaseNumber || null }),
        ...(plaintiffPetitioner && { plaintiffPetitioner }),
        ...(defendantRespondent && { defendantRespondent }),
        ...(opposingCounsel !== undefined && { opposingCounsel: opposingCounsel || null }),
        ...(priority && { priority }),
        ...(status && { status }),
        ...(currentStage && { currentStage }),
        ...(description !== undefined && { description }),
        ...(financialAgreement !== undefined && { financialAgreement }),
        ...(importantNotes !== undefined && { importantNotes }),
        ...(filingDate && { filingDate: new Date(filingDate) })
      }
    });

    await prisma.caseHistory.create({
      data: {
        caseId: id,
        action: 'Case Updated',
        description: `Case details updated by ${userEmail}`,
        performedBy: userEmail
      }
    });

    return updated;
  }

  public async changeStage(id: string, stage: CaseStage | string, remarks: string | undefined, userEmail: string): Promise<any> {
    const updated = await prisma.case.update({
      where: { id },
      data: { currentStage: stage }
    });

    await prisma.caseHistory.create({
      data: {
        caseId: id,
        action: 'Stage Changed',
        description: `Case transitioned to stage: ${stage}${remarks ? ` (${remarks})` : ''}`,
        performedBy: userEmail
      }
    });

    return updated;
  }

  public async closeCase(id: string, closureReason: string | undefined, userEmail: string): Promise<any> {
    const updated = await prisma.case.update({
      where: { id },
      data: {
        status: CaseStatus.CLOSED,
        currentStage: CaseStage.CLOSED,
        closedAt: new Date(),
        closureReason: closureReason || 'Case concluded'
      }
    });

    await prisma.caseHistory.create({
      data: {
        caseId: id,
        action: 'Case Closed',
        description: `Case closed. Reason: ${closureReason || 'Case concluded'}`,
        performedBy: userEmail
      }
    });

    return updated;
  }

  public async reopenCase(id: string, userEmail: string): Promise<any> {
    const updated = await prisma.case.update({
      where: { id },
      data: {
        status: CaseStatus.ACTIVE,
        currentStage: CaseStage.EXECUTION,
        closedAt: null,
        closureReason: null
      }
    });

    await prisma.caseHistory.create({
      data: {
        caseId: id,
        action: 'Case Reopened',
        description: 'Case reopened by advocate/administrator',
        performedBy: userEmail
      }
    });

    return updated;
  }

  public async assignAdvocate(id: string, userId: string, roleInCase: string = 'Assigned Advocate', userEmail: string): Promise<any> {
    const existing = await prisma.caseAssignment.findUnique({
      where: { caseId_userId: { caseId: id, userId } }
    });

    if (existing) {
      await prisma.caseAssignment.update({
        where: { id: existing.id },
        data: { roleInCase }
      });
    } else {
      await prisma.caseAssignment.create({
        data: { caseId: id, userId, roleInCase }
      });
    }

    const assignedUser = await prisma.user.findUnique({ where: { id: userId } });

    await prisma.caseHistory.create({
      data: {
        caseId: id,
        action: 'Advocate Assigned',
        description: `${assignedUser?.firstName} ${assignedUser?.lastName} assigned as ${roleInCase}`,
        performedBy: userEmail
      }
    });

    return true;
  }

  public async addParty(caseId: string, partyData: { partyType: string; name: string; advocate?: string; contactInfo?: string; notes?: string }): Promise<any> {
    return prisma.caseParty.create({
      data: {
        caseId,
        partyType: partyData.partyType,
        name: partyData.name.trim(),
        advocate: partyData.advocate || null,
        contactInfo: partyData.contactInfo || null,
        notes: partyData.notes || null
      }
    });
  }

  public async deleteParty(partyId: string): Promise<any> {
    return prisma.caseParty.delete({ where: { id: partyId } });
  }

  public async linkLegalReference(caseId: string, legalReferenceId: string, notes?: string): Promise<any> {
    return prisma.caseLegalReference.upsert({
      where: {
        caseId_legalReferenceId: { caseId, legalReferenceId }
      },
      update: { notes },
      create: { caseId, legalReferenceId, notes }
    });
  }

  public async unlinkLegalReference(caseId: string, legalReferenceId: string): Promise<any> {
    return prisma.caseLegalReference.delete({
      where: { caseId_legalReferenceId: { caseId, legalReferenceId } }
    });
  }

  public async deleteCase(id: string, workspaceId: string, userIp?: string): Promise<void> {
    const caseRecord = await this.repo.findById(id);
    if (!caseRecord) return;

    await this.repo.delete({ id });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        action: AuditAction.DELETE,
        module: 'Cases',
        entityId: id,
        entityName: caseRecord.internalReference,
        ipAddress: userIp
      }
    });
  }
}

export const caseService = new CaseService();
