import { Router } from 'express';
import { financeController } from '../controllers/finance.controller.js';
import { authenticateJWT, requirePermission } from '../middleware/auth.middleware.js';
import { PERMISSIONS } from '../constants/permissions.constant.js';

export const financeRouter: Router = Router();

financeRouter.use(authenticateJWT);

// Invoices
financeRouter.get('/invoices', requirePermission(PERMISSIONS.BILLING_VIEW), financeController.getInvoices);
financeRouter.get('/invoices/:id', requirePermission(PERMISSIONS.BILLING_VIEW), financeController.getInvoiceById);
financeRouter.post('/invoices', requirePermission(PERMISSIONS.BILLING_CREATE), financeController.createInvoice);
financeRouter.put('/invoices/:id', requirePermission(PERMISSIONS.BILLING_CREATE), financeController.updateInvoice);
financeRouter.put('/invoices/:id/cancel', requirePermission(PERMISSIONS.BILLING_CREATE), financeController.cancelInvoice);
financeRouter.delete('/invoices/:id', requirePermission(PERMISSIONS.BILLING_CREATE), financeController.deleteInvoice);

// Payments
financeRouter.get('/payments', requirePermission(PERMISSIONS.BILLING_VIEW), financeController.getPayments);
financeRouter.post('/payments', requirePermission(PERMISSIONS.BILLING_MANAGE_PAYMENTS), financeController.recordPayment);
financeRouter.post('/invoices/:invoiceId/payments', requirePermission(PERMISSIONS.BILLING_MANAGE_PAYMENTS), financeController.recordPayment);
financeRouter.post('/payments/:id/reverse', requirePermission(PERMISSIONS.BILLING_MANAGE_PAYMENTS), financeController.reversePayment);

// Expenses
financeRouter.get('/expenses', requirePermission(PERMISSIONS.BILLING_VIEW), financeController.getExpenses);
financeRouter.post('/expenses', requirePermission(PERMISSIONS.BILLING_CREATE), financeController.createExpense);
financeRouter.put('/expenses/:id', requirePermission(PERMISSIONS.BILLING_CREATE), financeController.updateExpense);
financeRouter.delete('/expenses/:id', requirePermission(PERMISSIONS.BILLING_CREATE), financeController.deleteExpense);

export default financeRouter;

