import { Request, Response } from 'express';
import { financeService, FinanceService } from '../services/finance.service.js';
import { sendSuccess, sendError, sendPaginated } from '../shared/response.js';
import { HTTP_STATUS } from '../constants/error-codes.constant.js';

export class FinanceController {
  public constructor(private readonly service: FinanceService = financeService) {}

  public getInvoices = async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.user!.workspaceId;
      const { clientId, caseId, status, page = '1', limit = '10' } = req.query;

      const result = await this.service.getInvoices({
        workspaceId,
        clientId: clientId ? String(clientId) : undefined,
        caseId: caseId ? String(caseId) : undefined,
        status: status ? String(status) : undefined,
        page: parseInt(String(page), 10) || 1,
        limit: parseInt(String(limit), 10) || 10
      });

      sendPaginated(res, result.data, result.meta, 'Invoices retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public getInvoiceById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const workspaceId = req.user!.workspaceId;
      const invoice = await this.service.getInvoiceById(id, workspaceId);

      if (!invoice) {
        sendError(res, 'Invoice not found', HTTP_STATUS.NOT_FOUND);
        return;
      }

      sendSuccess(res, invoice);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public createInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.user!.workspaceId;
      const userId = req.user!.id;
      const invoice = await this.service.createInvoice(workspaceId, userId, req.body, req.ip);
      sendSuccess(res, invoice, 'Invoice generated successfully', HTTP_STATUS.CREATED);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public updateInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updated = await this.service.updateInvoice(id, req.body);
      sendSuccess(res, updated, 'Invoice updated successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public deleteInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.deleteInvoice(id);
      sendSuccess(res, null, 'Invoice deleted successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public cancelInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const result = await this.service.cancelInvoice(id, userId, req.ip);
      sendSuccess(res, result, 'Invoice cancelled successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public getPayments = async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.user!.workspaceId;
      const { invoiceId, clientId } = req.query;
      const payments = await this.service.getPayments(workspaceId, {
        invoiceId: invoiceId ? String(invoiceId) : undefined,
        clientId: clientId ? String(clientId) : undefined
      });
      sendSuccess(res, payments, 'Payments retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public recordPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const invoiceId = req.params.invoiceId || req.body.invoiceId;
      const result = await this.service.recordPayment({ ...req.body, invoiceId }, userId, req.ip);
      sendSuccess(res, result.payment, 'Payment recorded successfully', HTTP_STATUS.CREATED);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public reversePayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user!.id;
      const result = await this.service.reversePayment(id, reason || 'Payment reversal requested', userId, req.ip);
      sendSuccess(res, result.updatedPayment, 'Payment reversed and balance adjusted');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public getExpenses = async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.user!.workspaceId;
      const { caseId, category, page = '1', limit = '10' } = req.query;
      const result = await this.service.getExpenses(workspaceId, {
        caseId: caseId ? String(caseId) : undefined,
        category: category ? String(category) : undefined,
        page: parseInt(String(page), 10) || 1,
        limit: parseInt(String(limit), 10) || 10
      });
      sendPaginated(res, result.data, result.meta, 'Expenses retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public createExpense = async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.user!.workspaceId;
      const userId = req.user!.id;
      const expense = await this.service.createExpense(workspaceId, userId, req.body);
      sendSuccess(res, expense, 'Expense recorded successfully', HTTP_STATUS.CREATED);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public updateExpense = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updated = await this.service.updateExpense(id, req.body);
      sendSuccess(res, updated, 'Expense updated successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public deleteExpense = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.deleteExpense(id);
      sendSuccess(res, null, 'Expense deleted successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };
}

export const financeController = new FinanceController();

