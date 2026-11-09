import { FeeType, InvoiceStatus } from '../enums/index.js';
import { IPaginationOptions } from './pagination.interface.js';

export interface IInvoiceFilter extends IPaginationOptions {
  workspaceId: string;
  clientId?: string;
  caseId?: string;
  status?: InvoiceStatus | string;
}

export interface ICreateInvoiceItemDto {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface ICreateInvoiceDto {
  clientId: string;
  caseId?: string;
  dueDate: string | Date;
  feeType?: FeeType | string;
  items: ICreateInvoiceItemDto[];
  taxRate?: number;
  discount?: number;
  notes?: string;
  paymentTerms?: string;
}

export interface ICreatePaymentDto {
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  referenceNo?: string;
  notes?: string;
}

export interface ICreateExpenseDto {
  title: string;
  category: string;
  caseId?: string;
  amount: number;
  expenseDate?: string | Date;
  paymentMethod?: string;
  receiptNumber?: string;
  isBillable?: boolean;
  notes?: string;
}

