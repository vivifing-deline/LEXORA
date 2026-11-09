import prisma from '../config/db.js';
import { CaseStatus, HearingStatus, TaskStatus } from '../enums/index.js';

export class DashboardService {
  public async getDashboardMetrics(workspaceId: string, userId: string, isClient: boolean): Promise<any> {
    let clientFilter: any = {};
    if (isClient) {
      const client = await prisma.client.findFirst({
        where: { portalUserId: userId }
      });
      if (client) {
        clientFilter = { clientId: client.id };
      }
    }

    const [
      activeCases,
      pendingCases,
      closedCases,
      upcomingHearings,
      activeClients,
      pendingTasks,
      invoices,
      expenses,
      casesByPracticeAreaRaw,
      casesByStatusRaw,
      casesByStageRaw
    ] = await Promise.all([
      prisma.case.count({
        where: { workspaceId, status: CaseStatus.ACTIVE, ...clientFilter }
      }),
      prisma.case.count({
        where: { workspaceId, status: { in: [CaseStatus.PENDING, CaseStatus.STAYED] }, ...clientFilter }
      }),
      prisma.case.count({
        where: { workspaceId, status: CaseStatus.CLOSED, ...clientFilter }
      }),
      prisma.hearing.count({
        where: {
          case: { workspaceId, ...clientFilter },
          hearingDate: { gte: new Date() },
          status: HearingStatus.SCHEDULED
        }
      }),
      isClient ? 1 : prisma.client.count({ where: { workspaceId, status: 'active' } }),
      prisma.task.count({
        where: { workspaceId, status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] }, ...clientFilter }
      }),
      prisma.invoice.findMany({
        where: { workspaceId, ...clientFilter }
      }),
      prisma.expense.findMany({
        where: { workspaceId, ...clientFilter }
      }),
      prisma.case.groupBy({
        by: ['practiceAreaId'],
        where: { workspaceId, ...clientFilter },
        _count: { id: true }
      }),
      prisma.case.groupBy({
        by: ['status'],
        where: { workspaceId, ...clientFilter },
        _count: { id: true }
      }),
      prisma.case.groupBy({
        by: ['currentStage'],
        where: { workspaceId, ...clientFilter },
        _count: { id: true }
      })
    ]);

    let totalBilled = 0;
    let totalPaid = 0;
    let outstandingBalance = 0;

    for (const inv of invoices) {
      totalBilled += inv.totalAmount;
      totalPaid += inv.amountPaid;
      outstandingBalance += inv.balanceDue;
    }

    const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);

    const practiceAreas = await prisma.practiceArea.findMany();
    const practiceAreaMap = new Map(practiceAreas.map(p => [p.id, p.name]));

    const casesByPracticeArea = casesByPracticeAreaRaw.map(item => ({
      name: practiceAreaMap.get(item.practiceAreaId) || 'Other',
      count: item._count.id
    }));

    const casesByStatus = casesByStatusRaw.map(item => ({
      status: item.status,
      count: item._count.id
    }));

    const casesByStage = casesByStageRaw.map(item => ({
      stage: item.currentStage,
      count: item._count.id
    }));

    const upcomingHearingsList = await prisma.hearing.findMany({
      where: {
        case: { workspaceId, ...clientFilter },
        hearingDate: { gte: new Date(Date.now() - 24 * 3600 * 1000) }
      },
      include: {
        case: { select: { id: true, title: true, internalReference: true, courtCaseNumber: true } },
        court: { select: { id: true, name: true, city: true } },
        assignedAdvocate: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: { hearingDate: 'asc' },
      take: 5
    });

    const priorityTasksList = await prisma.task.findMany({
      where: {
        workspaceId,
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
        ...clientFilter
      },
      include: {
        case: { select: { id: true, title: true, internalReference: true } },
        assignments: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } }
        }
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      take: 5
    });

    const recentActivities = await prisma.auditLog.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, designation: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 6
    });

    const recentPayments = await prisma.payment.findMany({
      where: {
        isReversal: false,
        invoice: { workspaceId, ...clientFilter }
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            client: { select: { id: true, name: true } },
            case: { select: { id: true, title: true, internalReference: true } }
          }
        }
      },
      orderBy: { paymentDate: 'desc' },
      take: 4
    });

    const invoiceStatusCounts = {
      paid: invoices.filter(i => i.status === 'paid').length,
      partiallyPaid: invoices.filter(i => i.status === 'partially_paid').length,
      unpaid: invoices.filter(i => i.status === 'unpaid').length,
      overdue: invoices.filter(i => i.status === 'overdue').length,
      totalCount: invoices.length
    };

    const monthlyRegistrations = [
      { month: 'Oct 2025', count: 4 },
      { month: 'Nov 2025', count: 7 },
      { month: 'Dec 2025', count: 9 },
      { month: 'Jan 2026', count: 12 },
      { month: 'Feb 2026', count: 15 },
      { month: 'Mar 2026', count: activeCases + pendingCases }
    ];

    return {
      kpis: {
        activeCases,
        pendingCases,
        closedCases,
        totalCases: activeCases + pendingCases + closedCases,
        upcomingHearings,
        activeClients,
        pendingTasks,
        totalBilled,
        totalPaid,
        outstandingBalance,
        totalExpenses
      },
      charts: {
        casesByPracticeArea,
        casesByStatus,
        casesByStage,
        monthlyRegistrations,
        financialTrend: {
          revenue: totalPaid,
          outstanding: outstandingBalance,
          expenses: totalExpenses,
          netProfit: totalPaid - totalExpenses,
          collectionRate: totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 1000) / 10 : 100,
          invoiceStatusCounts
        }
      },
      widgets: {
        upcomingHearings: upcomingHearingsList,
        priorityTasks: priorityTasksList,
        recentActivities,
        recentPayments
      }
    };
  }
}

export const dashboardService = new DashboardService();

