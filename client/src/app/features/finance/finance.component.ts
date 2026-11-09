import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { API_ENDPOINTS } from '../../core/constants/api-endpoints.constant';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { MultiSelectComponent, SelectOption } from '../../shared/components/multi-select/multi-select.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    IconComponent,
    ModalComponent,
    ConfirmModalComponent,
    MultiSelectComponent,
    LoadingSkeletonComponent,
    PaginationComponent
  ],
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.scss']
})
export class FinanceComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly isLoading = signal<boolean>(true);
  readonly page = signal<number>(1);
  readonly limit = signal<number>(10);
  readonly total = signal<number>(0);
  readonly totalPages = signal<number>(1);
  readonly activeTab = signal<'invoices' | 'payments' | 'expenses'>('invoices');
  readonly invoices = signal<any[]>([]);
  readonly payments = signal<any[]>([]);
  readonly expenses = signal<any[]>([]);

  // Modals
  readonly isInvoiceModalOpen = signal<boolean>(false);
  readonly isPaymentModalOpen = signal<boolean>(false);
  readonly isExpenseModalOpen = signal<boolean>(false);
  readonly selectedInvoice = signal<any>(null);

  // Cancel Invoice Confirm
  readonly isCancelModalOpen = signal<boolean>(false);
  readonly invoiceToCancel = signal<any>(null);

  // Reverse Payment Modal
  readonly isReverseModalOpen = signal<boolean>(false);
  readonly paymentToReverse = signal<any>(null);
  readonly reverseForm = this.fb.group({
    reason: ['Payment check bounced / administrative reversal', [Validators.required]]
  });

  // Delete Expense Confirm
  readonly isDeleteExpenseModalOpen = signal<boolean>(false);
  readonly expenseToDelete = signal<any>(null);
  readonly isDeletingExpense = signal<boolean>(false);

  readonly clientOptions = signal<SelectOption[]>([]);
  readonly caseOptions = signal<SelectOption[]>([]);

  readonly invoiceForm = this.fb.group({
    clientId: ['', [Validators.required]],
    caseId: [''],
    feeType: ['Fixed'],
    dueDate: [new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0], [Validators.required]],
    taxRate: [13],
    discount: [0],
    notes: ['Payment terms: Net 30 days.'],
    items: this.fb.array([
      this.fb.group({
        description: ['Professional Legal Fee for Drafting and Filing', [Validators.required]],
        quantity: [1, [Validators.required]],
        unitPrice: [350000, [Validators.required]]
      })
    ])
  });

  readonly paymentForm = this.fb.group({
    amount: [0, [Validators.required, Validators.min(1)]],
    paymentMethod: ['Bank Transfer', [Validators.required]],
    referenceNo: [''],
    notes: ['']
  });

  readonly expenseForm = this.fb.group({
    title: ['', [Validators.required]],
    category: ['Court Fee', [Validators.required]],
    caseId: [''],
    amount: [5000, [Validators.required, Validators.min(1)]],
    paymentMethod: ['Cash'],
    receiptNumber: [''],
    isBillable: [true],
    notes: ['']
  });

  get items(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  ngOnInit(): void {
    this.loadFinanceData();
    this.loadDropdowns();
  }

  loadFinanceData(): void {
    this.isLoading.set(true);
    this.api.get<any>(API_ENDPOINTS.FINANCE.INVOICES, { page: this.page(), limit: this.limit() }).subscribe({
      next: (res) => {
        this.invoices.set(res.data || []);
        if (res.meta) {
          this.page.set(res.meta.page);
          this.limit.set(res.meta.limit);
          this.total.set(res.meta.total);
          this.totalPages.set(res.meta.totalPages);
        } else {
          this.total.set((res.data || []).length);
          this.totalPages.set(1);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });

    this.api.get<any>(API_ENDPOINTS.FINANCE.PAYMENTS).subscribe({
      next: (res) => {
        this.payments.set(res.data || []);
      }
    });

    this.api.get<any>(API_ENDPOINTS.FINANCE.EXPENSES).subscribe({
      next: (res) => {
        this.expenses.set(res.data || []);
      }
    });
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadFinanceData();
  }

  onLimitChange(newLimit: number): void {
    this.limit.set(newLimit);
    this.page.set(1);
    this.loadFinanceData();
  }

  loadDropdowns(): void {
    this.api.get<any>(API_ENDPOINTS.CLIENTS.BASE, { limit: 100 }).subscribe({
      next: (res) => {
        this.clientOptions.set((res.data || []).map((c: any) => ({
          label: c.name,
          value: c.id
        })));
      }
    });

    this.api.get<any>(API_ENDPOINTS.CASES.BASE, { limit: 100 }).subscribe({
      next: (res) => {
        this.caseOptions.set((res.data || []).map((c: any) => ({
          label: `${c.internalReference}: ${c.title}`,
          value: c.id
        })));
      }
    });
  }

  addItem(): void {
    this.items.push(
      this.fb.group({
        description: ['', [Validators.required]],
        quantity: [1, [Validators.required]],
        unitPrice: [0, [Validators.required]]
      })
    );
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  openInvoiceModal(): void {
    this.isInvoiceModalOpen.set(true);
  }

  closeInvoiceModal(): void {
    this.isInvoiceModalOpen.set(false);
  }

  submitInvoice(): void {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      return;
    }

    this.api.post<any>(API_ENDPOINTS.FINANCE.INVOICES, this.invoiceForm.value).subscribe({
      next: (res) => {
        this.toastService.success(`Invoice ${res.data?.invoiceNumber || ''} generated!`);
        this.closeInvoiceModal();
        this.loadFinanceData();
      }
    });
  }

  // Cancel Invoice
  openCancelModal(inv: any): void {
    this.invoiceToCancel.set(inv);
    this.isCancelModalOpen.set(true);
  }

  closeCancelModal(): void {
    this.isCancelModalOpen.set(false);
    this.invoiceToCancel.set(null);
  }

  confirmCancelInvoice(): void {
    const inv = this.invoiceToCancel();
    if (!inv) return;

    this.api.put<any>(API_ENDPOINTS.FINANCE.INVOICE_CANCEL(inv.id), {}, {
      successMessage: `Invoice ${inv.invoiceNumber} cancelled`
    }).subscribe({
      next: () => {
        this.closeCancelModal();
        this.loadFinanceData();
      }
    });
  }

  // Payment
  openPaymentModal(inv: any): void {
    this.selectedInvoice.set(inv);
    this.paymentForm.patchValue({
      amount: inv.balanceDue,
      paymentMethod: 'Bank Transfer'
    });
    this.isPaymentModalOpen.set(true);
  }

  closePaymentModal(): void {
    this.isPaymentModalOpen.set(false);
    this.selectedInvoice.set(null);
  }

  submitPayment(): void {
    if (this.paymentForm.invalid) return;

    const invId = this.selectedInvoice()?.id;
    if (!invId) return;

    this.api.post<any>(API_ENDPOINTS.FINANCE.INVOICE_PAYMENTS(invId), this.paymentForm.value, {
      successMessage: 'Payment recorded and balance reconciled successfully!'
    }).subscribe({
      next: () => {
        this.closePaymentModal();
        this.loadFinanceData();
      }
    });
  }

  // Reverse Payment
  openReverseModal(pmt: any): void {
    this.paymentToReverse.set(pmt);
    this.reverseForm.reset({
      reason: 'Payment check bounced / administrative reversal'
    });
    this.isReverseModalOpen.set(true);
  }

  closeReverseModal(): void {
    this.isReverseModalOpen.set(false);
    this.paymentToReverse.set(null);
  }

  submitReversePayment(): void {
    if (this.reverseForm.invalid) return;

    const pmt = this.paymentToReverse();
    if (!pmt) return;

    this.api.post<any>(API_ENDPOINTS.FINANCE.PAYMENT_REVERSE(pmt.id), this.reverseForm.value, {
      successMessage: 'Payment reversed and invoice balance restored!'
    }).subscribe({
      next: () => {
        this.closeReverseModal();
        this.loadFinanceData();
      }
    });
  }

  // Expenses
  openExpenseModal(): void {
    this.isExpenseModalOpen.set(true);
  }

  closeExpenseModal(): void {
    this.isExpenseModalOpen.set(false);
  }

  submitExpense(): void {
    if (this.expenseForm.invalid) return;

    this.api.post<any>(API_ENDPOINTS.FINANCE.EXPENSES, this.expenseForm.value, {
      successMessage: 'Litigation expense recorded!'
    }).subscribe({
      next: () => {
        this.closeExpenseModal();
        this.loadFinanceData();
      }
    });
  }

  openDeleteExpenseModal(exp: any): void {
    this.expenseToDelete.set(exp);
    this.isDeleteExpenseModalOpen.set(true);
  }

  closeDeleteExpenseModal(): void {
    this.isDeleteExpenseModalOpen.set(false);
    this.expenseToDelete.set(null);
  }

  confirmDeleteExpense(): void {
    const exp = this.expenseToDelete();
    if (!exp) return;

    this.isDeletingExpense.set(true);
    this.api.delete<any>(API_ENDPOINTS.FINANCE.EXPENSE_BY_ID(exp.id), {
      successMessage: 'Expense record removed'
    }).subscribe({
      next: () => {
        this.isDeletingExpense.set(false);
        this.closeDeleteExpenseModal();
        this.loadFinanceData();
      },
      error: () => {
        this.isDeletingExpense.set(false);
      }
    });
  }

  formatCurrency(val: number): string {
    return 'Rs. ' + (val || 0).toLocaleString();
  }
}
