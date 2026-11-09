import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { API_ENDPOINTS } from '../../core/constants/api-endpoints.constant';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { CustomSelectComponent, CustomSelectOption } from '../../shared/components/custom-select/custom-select.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-hearings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    IconComponent,
    ModalComponent,
    ConfirmModalComponent,
    CustomSelectComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    PaginationComponent
  ],
  templateUrl: './hearings.component.html',
  styleUrls: ['./hearings.component.scss']
})
export class HearingsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly isLoading = signal<boolean>(true);
  readonly page = signal<number>(1);
  readonly limit = signal<number>(10);
  readonly total = signal<number>(0);
  readonly totalPages = signal<number>(1);
  readonly hearings = signal<any[]>([]);
  readonly conflicts = signal<any[]>([]);
  readonly selectedDate = signal<string>(new Date().toISOString().split('T')[0]);
  readonly statusFilter = signal<string>('');

  readonly hearingStatusOptions: CustomSelectOption[] = [
    { label: 'All Statuses', value: '', dotColor: 'var(--text-muted)' },
    { label: 'Scheduled', value: 'scheduled', dotColor: 'var(--warning)' },
    { label: 'In Progress', value: 'in_progress', dotColor: 'var(--primary)' },
    { label: 'Adjourned', value: 'adjourned', dotColor: 'var(--accent)' },
    { label: 'Concluded', value: 'concluded', dotColor: 'var(--success)' },
    { label: 'Cancelled', value: 'cancelled', dotColor: 'var(--danger)' }
  ];

  // Dropdown data
  readonly cases = signal<any[]>([]);
  readonly courts = signal<any[]>([]);
  readonly advocates = signal<any[]>([]);

  // Schedule Modal
  readonly isScheduleModalOpen = signal<boolean>(false);
  readonly scheduleForm = this.fb.group({
    caseId: ['', [Validators.required]],
    courtId: [''],
    assignedAdvocateId: [''],
    hearingDate: [new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], [Validators.required]],
    hearingTime: ['09:30 AM', [Validators.required]],
    courtroom: ['Courtroom 3'],
    purpose: ['Hearing on Merits', [Validators.required]],
    bench: ['Single Bench']
  });

  // Reschedule Modal
  readonly isRescheduleModalOpen = signal<boolean>(false);
  readonly hearingToReschedule = signal<any>(null);
  readonly rescheduleForm = this.fb.group({
    hearingDate: ['', [Validators.required]],
    hearingTime: ['09:30 AM', [Validators.required]],
    courtroom: [''],
    adjournmentReason: ['Adjourned on request of counsel', [Validators.required]]
  });

  // Proceedings Modal
  readonly isProceedingModalOpen = signal<boolean>(false);
  readonly hearingForProceeding = signal<any>(null);
  readonly proceedingForm = this.fb.group({
    status: ['completed', [Validators.required]],
    proceedingsSummary: ['', [Validators.required]],
    orderPassed: [''],
    adjournmentReason: [''],
    diaryNotes: ['']
  });

  // Delete Hearing Confirm
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly hearingToDelete = signal<any>(null);
  readonly isDeleting = signal<boolean>(false);

  ngOnInit(): void {
    this.loadHearings();
    this.loadDropdownData();
  }

  loadHearings(): void {
    this.isLoading.set(true);
    const params: Record<string, any> = {
      page: this.page(),
      limit: this.limit()
    };
    if (this.statusFilter()) params['status'] = this.statusFilter();

    this.api.get<any>(API_ENDPOINTS.HEARINGS.BASE, params).subscribe({
      next: (res) => {
        this.hearings.set(res.data || []);
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
      error: () => {
        this.isLoading.set(false);
      }
    });

    // Check cause list conflicts
    this.api.get<any>(API_ENDPOINTS.HEARINGS.CAUSE_LIST, { date: this.selectedDate() }).subscribe({
      next: (res) => {
        this.conflicts.set(res.data?.conflicts || []);
      }
    });
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadHearings();
  }

  onLimitChange(newLimit: number): void {
    this.limit.set(newLimit);
    this.page.set(1);
    this.loadHearings();
  }

  loadDropdownData(): void {
    this.api.get<any>(API_ENDPOINTS.CASES.BASE, { limit: 100 }).subscribe({
      next: (res) => this.cases.set(res.data || [])
    });
    this.api.get<any>(API_ENDPOINTS.SYSTEM.SETTINGS).subscribe({
      next: (res) => this.courts.set(res.data?.courts || [])
    });
    this.api.get<any>(API_ENDPOINTS.AUTH.USERS).subscribe({
      next: (res) => this.advocates.set(res.data || [])
    });
  }

  // Schedule
  openScheduleModal(): void {
    this.scheduleForm.reset({
      hearingDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      hearingTime: '09:30 AM',
      courtroom: 'Courtroom 3',
      purpose: 'Hearing on Merits',
      bench: 'Single Bench'
    });
    this.isScheduleModalOpen.set(true);
  }

  closeScheduleModal(): void {
    this.isScheduleModalOpen.set(false);
  }

  submitScheduleHearing(): void {
    if (this.scheduleForm.invalid) {
      this.scheduleForm.markAllAsTouched();
      return;
    }

    this.api.post<any>(API_ENDPOINTS.HEARINGS.BASE, this.scheduleForm.value, {
      successMessage: 'Hearing scheduled successfully'
    }).subscribe({
      next: () => {
        this.closeScheduleModal();
        this.loadHearings();
      }
    });
  }

  // Reschedule
  openRescheduleModal(h: any): void {
    this.hearingToReschedule.set(h);
    this.rescheduleForm.patchValue({
      hearingDate: h.hearingDate ? new Date(h.hearingDate).toISOString().split('T')[0] : '',
      hearingTime: h.hearingTime || '09:30 AM',
      courtroom: h.courtroom || '',
      adjournmentReason: h.adjournmentReason || 'Adjourned on request of counsel'
    });
    this.isRescheduleModalOpen.set(true);
  }

  closeRescheduleModal(): void {
    this.isRescheduleModalOpen.set(false);
    this.hearingToReschedule.set(null);
  }

  submitReschedule(): void {
    if (this.rescheduleForm.invalid) return;

    const h = this.hearingToReschedule();
    if (!h) return;

    this.api.put<any>(API_ENDPOINTS.HEARINGS.RESCHEDULE(h.id), this.rescheduleForm.value, {
      successMessage: 'Hearing rescheduled successfully'
    }).subscribe({
      next: () => {
        this.closeRescheduleModal();
        this.loadHearings();
      }
    });
  }

  // Record Proceedings
  openProceedingModal(h: any): void {
    this.hearingForProceeding.set(h);
    this.proceedingForm.patchValue({
      status: h.status || 'completed',
      proceedingsSummary: h.proceedingsSummary || '',
      orderPassed: h.orderPassed || '',
      adjournmentReason: h.adjournmentReason || '',
      diaryNotes: h.diaryNotes || ''
    });
    this.isProceedingModalOpen.set(true);
  }

  closeProceedingModal(): void {
    this.isProceedingModalOpen.set(false);
    this.hearingForProceeding.set(null);
  }

  submitProceeding(): void {
    if (this.proceedingForm.invalid) return;

    const h = this.hearingForProceeding();
    if (!h) return;

    this.api.put<any>(API_ENDPOINTS.HEARINGS.BY_ID(h.id), this.proceedingForm.value, {
      successMessage: 'Hearing outcome and proceedings saved'
    }).subscribe({
      next: () => {
        this.closeProceedingModal();
        this.loadHearings();
      }
    });
  }

  // Delete Hearing
  openDeleteModal(h: any): void {
    this.hearingToDelete.set(h);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.hearingToDelete.set(null);
  }

  confirmDeleteHearing(): void {
    const h = this.hearingToDelete();
    if (!h) return;

    this.isDeleting.set(true);
    this.api.delete<any>(API_ENDPOINTS.HEARINGS.BY_ID(h.id), {
      successMessage: 'Hearing removed from calendar'
    }).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        this.loadHearings();
      },
      error: () => {
        this.isDeleting.set(false);
      }
    });
  }

  printCauseList(): void {
    window.print();
  }
}
