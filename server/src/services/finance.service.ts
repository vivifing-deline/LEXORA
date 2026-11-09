import prisma from '../config/db.js';
import { invoiceRepository, InvoiceRepository } from '../repositories/invoice.repository.js';
import { paymentRepository } from '../repositories/payment.repository.js';
import { expenseRepository } from '../repositories/expense.repository.js';
import { IInvoiceFilter, ICreateInvoiceDto, ICreatePaymentDto, ICreateExpenseDto } from '../interfaces/finance.interface.js';
import { IPaginatedResult } from '../interfaces/pagination.interface.js';
import { InvoiceStatus, AuditAction } from '../enums/index.js';

export class FinanceService {
  public constructor(
    private readonly repo: InvoiceRepository = invoiceRepository
  ) {}

  public async getInvoices(filter: IInvoiceFilter): Promise<IPaginatedResult<any>> {
    return this.repo.getFilteredInvoices(filter);
  }

  public async getInvoiceById(id: string, workspaceId: string): Promise<any> {
    return prisma.invoice.findFirst({
      where: { id, workspaceId },
      include: {
        client: true,
        case: true,
        items: true,
        payments: {
          include: { recordedBy: { select: { firstName: true, lastName: true } } },
          orderBy: { paymentDate: 'desc' }
        }
      }
    });
  }

  public async createInvoice(workspaceId: string, userId: string, data: ICreateInvoiceDto, userIp?: string): Promise<any> {
    const {
      clientId,
      caseId,
      feeType = 'Fixed',
      dueDate,
      taxRate = 0,
      discount = 0,
      notes,
      paymentTerms,
      items
    } = data;

    const count = await this.repo.count({ workspaceId });
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;

    let subtotal = 0;
    const lineItemsData = items.map((it) => {
      const qty = Number(it.quantity) || 1;
      const unit = Number(it.unitPrice) || 0;
      const amount = qty * unit;
      subtotal += amount;
      return {
        description: it.description || 'Professional Legal Services',
        quantity: qty,
        unitPrice: unit,
        amount
      };
    });

    const taxAmount = (subtotal * (Number(taxRate) || 0)) / 100;
    const totalAmount = Math.max(0, subtotal + taxAmount - (Number(discount) || 0));

    const invoice = await prisma.invoice.create({
      data: {
        workspaceId,
        clientId,
        caseId: caseId || null,
        invoiceNumber,
        issueDate: new Date(),
        dueDate: new Date(dueDate),
        feeType,
        subtotal,
        taxRate: Number(taxRate) || 0,
        taxAmount,
        discount: Number(discount) || 0,
        totalAmount,
        amountPaid: 0,
        balanceDue: totalAmount,
        status: InvoiceStatus.SENT,
        notes: notes || null,
        paymentTerms: paymentTerms || null,
        createdById: userId,
        items: {
          create: lineItemsData
        }
      },
      include: {
        client: true,
        case: true,
        items: true
      }
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId,
        action: AuditAction.CREATE,
        module: 'Finance',
        entityId: invoice.id,
        entityName: invoice.invoiceNumber,
        newValues: JSON.stringify({ amount: totalAmount }),
        ipAddress: userIp
      }
    });

    return invoice;
  }

  public async updateInvoice(id: string, updates: any): Promise<any> {
    return prisma.invoice.update({
      where: { id },
      data: {
        dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
        notes: updates.notes !== undefined ? updates.notes : undefined,
        paymentTerms: updates.paymentTerms !== undefined ? updates.paymentTerms : undefined,
        status: updates.status || undefined
      }
    });
  }

  public async deleteInvoice(id: string): Promise<void> {
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
    await prisma.invoice.delete({ where: { id } });
  }

  public async cancelInvoice(id: string, userId: string, userIp?: string): Promise<any> {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.amountPaid > 0) throw new Error('Cannot cancel an invoice with recorded payments. Reverse payments first.');

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: 'cancelled' }
    });

    await prisma.auditLog.create({
      data: {
        workspaceId: invoice.workspaceId,
        userId,
        action: AuditAction.UPDATE,
        module: 'Finance',
        entityId: invoice.id,
        entityName: `Cancelled Invoice: ${invoice.invoiceNumber}`,
        ipAddress: userIp
      }
    });

    return updated;
  }

  // Payments
  public async getPayments(workspaceId: string, filter?: { invoiceId?: string; clientId?: string }): Promise<any[]> {
    const where: any = {
      invoice: {
        workspaceId,
        ...(filter?.clientId ? { clientId: filter.clientId } : {})
      },
      ...(filter?.invoiceId ? { invoiceId: filter.invoiceId } : {})
    };

    return prisma.payment.findMany({
      where,
      include: {
        invoice: {
          include: {
            client: { select: { id: true, name: true, clientReference: true } },
            case: { select: { id: true, title: true, internalReference: true } }
          }
        },
        recordedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { paymentDate: 'desc' }
    });
  }

  public async recordPayment(data: ICreatePaymentDto, userId: string, userIp?: string): Promise<any> {
    const { invoiceId, amount, paymentMethod, referenceNo, notes } = data;
    const numAmount = Number(amount);

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true }
    });

    if (!invoice) throw new Error('Invoice not found');

    const count = await paymentRepository.count({});
    const year = new Date().getFullYear();
    const paymentNumber = `REC-${year}-${String(count + 1).padStart(4, '0')}`;

    const newAmountPaid = invoice.amountPaid + numAmount;
    const newBalanceDue = Math.max(0, invoice.totalAmount - newAmountPaid);
    const newStatus = newBalanceDue <= 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL;

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          paymentNumber,
          paymentDate: new Date(),
          amount: numAmount,
          paymentMethod,
          referenceNo: referenceNo || null,
          notes: notes || null,
          recordedById: userId
        }
      });

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: newAmountPaid,
          balanceDue: newBalanceDue,
          status: newStatus
        }
      });

      return { payment, updatedInvoice };
    });

    await prisma.auditLog.create({
      data: {
        workspaceId: invoice.workspaceId,
        userId,
        action: AuditAction.CREATE,
        module: 'Finance',
        entityId: result.payment.id,
        entityName: `Payment: ${paymentNumber}`,
        newValues: JSON.stringify({ amount: numAmount, invoiceId }),
        ipAddress: userIp
      }
    });

    return result;
  }

  public async reversePayment(paymentId: string, reasonText: string, userId: string, userIp?: string): Promise<any> {
    const originalPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: true }
    });

    if (!originalPayment) throw new Error('Payment receipt not found');
    if (originalPayment.isReversal) throw new Error('Cannot reverse a transaction that is already a reversal');

    const result = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          isReversal: true,
          reversalReason: reasonText
        }
      });

      const invoice = originalPayment.invoice;
      const newAmountPaid = Math.max(0, invoice.amountPaid - originalPayment.amount);
      const newBalanceDue = invoice.totalAmount - newAmountPaid;
      const newStatus = newAmountPaid === 0 ? InvoiceStatus.SENT : InvoiceStatus.PARTIAL;

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          balanceDue: newBalanceDue,
          status: newStatus
        }
      });

      return { updatedPayment, updatedInvoice };
    });

    await prisma.auditLog.create({
      data: {
        workspaceId: originalPayment.invoice.workspaceId,
        userId,
        action: AuditAction.UPDATE,
        module: 'Finance',
        entityId: originalPayment.id,
        entityName: `Payment Reversal: ${originalPayment.paymentNumber}`,
        newValues: JSON.stringify({ reason: reasonText, amount: originalPayment.amount }),
        ipAddress: userIp
      }
    });

    return result;
  }

  // Expenses
  public async getExpenses(workspaceId: string, filter: any): Promise<any> {
    return expenseRepository.getFilteredExpenses(workspaceId, filter);
  }

  public async createExpense(workspaceId: string, userId: string, data: ICreateExpenseDto): Promise<any> {
    return expenseRepository.create({
      workspaceId,
      caseId: data.caseId || null,
      category: data.category || 'Court Fee',
      title: data.title.trim(),
      amount: Number(data.amount),
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
      paymentMethod: data.paymentMethod || 'Cash',
      receiptNumber: data.receiptNumber || null,
      isBillable: data.isBillable !== undefined ? Boolean(data.isBillable) : true,
      notes: data.notes || null,
      recordedById: userId
    });
  }

  public async updateExpense(id: string, updates: any): Promise<any> {
    return expenseRepository.update({ id }, updates);
  }

  public async deleteExpense(id: string): Promise<void> {
    await expenseRepository.delete({ id });
  }
}

export const financeService = new FinanceService();

