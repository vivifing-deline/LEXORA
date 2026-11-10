import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { API_ENDPOINTS } from '../../core/constants/api-endpoints.constant';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { MultiSelectComponent, SelectOption } from '../../shared/components/multi-select/multi-select.component';
import { CustomSelectComponent, CustomSelectOption } from '../../shared/components/custom-select/custom-select.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { SubscriptionManagerService } from '../../core/services/subscription-manager.service';

@Component({
  selector: 'app-cases',
  standalone: true,
  providers: [SubscriptionManagerService],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    IconComponent,
    ModalComponent,
    ConfirmModalComponent,
    MultiSelectComponent,
    CustomSelectComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    PaginationComponent
  ],
  templateUrl: './cases.component.html',
  styleUrls: ['./cases.component.scss']
})
export class CasesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly subManager = inject(SubscriptionManagerService);

  readonly isLoading = signal<boolean>(true);
  readonly page = signal<number>(1);
  readonly limit = signal<number>(10);
  readonly total = signal<number>(0);
  readonly totalPages = signal<number>(1);
  readonly cases = signal<any[]>([]);
  readonly isCreateModalOpen = signal<boolean>(false);
  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<string>('');
  readonly priorityFilter = signal<string>('');
  readonly stageFilter = signal<string>('');

  readonly statusOptions: CustomSelectOption[] = [
    { label: 'All Statuses', value: '', dotColor: 'var(--text-muted)' },
    { label: 'Active', value: 'active', dotColor: 'var(--success)' },
    { label: 'Pending', value: 'pending', dotColor: 'var(--warning)' },
    { label: 'Stayed', value: 'stayed', dotColor: 'var(--accent)' },
    { label: 'Appealed', value: 'appealed', dotColor: 'var(--info)' },
    { label: 'Closed', value: 'closed', dotColor: 'var(--text-muted)' },
    { label: 'Archived', value: 'archived', dotColor: 'var(--danger)' }
  ];

  readonly priorityOptions: CustomSelectOption[] = [
    { label: 'All Priorities', value: '', dotColor: 'var(--text-muted)' },
    { label: 'Urgent', value: 'urgent', dotColor: 'var(--danger)' },
    { label: 'High', value: 'high', dotColor: '#F97316' },
    { label: 'Medium', value: 'medium', dotColor: 'var(--warning)' },
    { label: 'Low', value: 'low', dotColor: 'var(--info)' }
  ];

  readonly stageOptions: CustomSelectOption[] = [
    { label: 'All Stages', value: '', dotColor: 'var(--text-muted)' },
    { label: 'Filing', value: 'Filing', dotColor: '#6366F1' },
    { label: 'Preliminary', value: 'Preliminary', dotColor: '#3B82F6' },
    { label: 'Evidence', value: 'Evidence', dotColor: '#8B5CF6' },
    { label: 'Arguments', value: 'Arguments', dotColor: '#EC4899' },
    { label: 'Judgment', value: 'Judgment', dotColor: '#10B981' },
    { label: 'Execution', value: 'Execution', dotColor: '#F59E0B' },
    { label: 'Notice / Summons', value: 'Notice', dotColor: '#3B82F6' },
    { label: 'Written Statement', value: 'Statement', dotColor: '#8B5CF6' },
    { label: 'Consultation', value: 'Consultation', dotColor: '#64748B' },
    { label: 'Closed', value: 'Closed', dotColor: '#64748B' }
  ];

  // Edit Case Modal
  readonly isEditModalOpen = signal<boolean>(false);
  readonly caseToEdit = signal<any>(null);
  readonly editCaseForm = this.fb.group({
    title: ['', [Validators.required]],
    caseType: ['', [Validators.required]],
    courtCaseNumber: [''],
    jurisdiction: [''],
    judgeName: [''],
    plaintiffPetitioner: ['', [Validators.required]],
    defendantRespondent: ['', [Validators.required]],
    opposingCounsel: [''],
    opposingParties: [''],
    currentStage: ['Consultation'],
    priority: ['medium'],
    financialAgreement: ['Fixed Fee'],
    agreedFee: [0],
    importantNotes: [''],
    description: ['']
  });

  // Delete Case Confirm
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly caseToDelete = signal<any>(null);
  readonly isDeleting = signal<boolean>(false);

  // Dropdown option lists
  readonly clientOptions = signal<SelectOption[]>([]);
  readonly practiceAreaOptions = signal<SelectOption[]>([]);
  readonly courtOptions = signal<SelectOption[]>([]);
  readonly advocateOptions = signal<SelectOption[]>([]);

  readonly caseForm = this.fb.group({
    title: ['', [Validators.required]],
    clientId: ['', [Validators.required]],
    practiceAreaId: ['', [Validators.required]],
    courtId: [''],
    caseType: ['Commercial Suit', [Validators.required]],
    courtCaseNumber: [''],
    jurisdiction: ['High Court of Sindh'],
    judgeName: [''],
    plaintiffPetitioner: ['', [Validators.required]],
    defendantRespondent: ['', [Validators.required]],
    opposingCounsel: [''],
    opposingParties: [''],
    currentStage: ['Consultation'],
    priority: ['medium'],
    financialAgreement: ['Fixed Fee'],
    agreedFee: [500000],
    importantNotes: [''],
    description: [''],
    assignedUserIds: [[] as string[]]
  });

  readonly stagesList = [
    'Consultation', 'Client Onboarding', 'Preparation', 'Filing',
    'Notice / Summons', 'Written Statement / Response', 'Issues',
    'Evidence', 'Arguments', 'Judgment', 'Appeal', 'Execution', 'Closed'
  ];

  ngOnInit(): void {
    this.subManager.add(
      this.route.queryParams.subscribe(params => {
        if (params['q']) this.searchQuery.set(params['q']);
        if (params['status']) this.statusFilter.set(params['status']);
        if (params['stage']) this.stageFilter.set(params['stage']);
        if (params['priority']) this.priorityFilter.set(params['priority']);
        if (params['openCreate']) this.openCreateModal();
        this.loadCases();
      })
    );

    this.loadDropdownData();
  }

  loadCases(): void {
    this.isLoading.set(true);
    const params: Record<string, any> = {
      page: this.page(),
      limit: this.limit()
    };
    if (this.searchQuery()) params['search'] = this.searchQuery();
    if (this.statusFilter()) params['status'] = this.statusFilter();
    if (this.priorityFilter()) params['priority'] = this.priorityFilter();
    if (this.stageFilter()) params['stage'] = this.stageFilter();

    this.api.get<any>(API_ENDPOINTS.CASES.BASE, params).pipe(this.subManager.untilDestroyed()).subscribe({
      next: (res) => {
        this.cases.set(res.data || []);
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
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('');
    this.priorityFilter.set('');
    this.stageFilter.set('');
    this.page.set(1);
    this.loadCases();
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadCases();
  }

  onLimitChange(newLimit: number): void {
    this.limit.set(newLimit);
    this.page.set(1);
    this.loadCases();
  }

  loadDropdownData(): void {
    // Clients
    this.api.get<any>(API_ENDPOINTS.CLIENTS.BASE, { limit: 100 }).pipe(this.subManager.untilDestroyed()).subscribe({
      next: (res) => {
        const opts: SelectOption[] = (res.data || []).map((c: any) => ({
          label: `${c.name} (${c.clientReference || ''})`,
          value: c.id,
          description: c.organization || c.type,
          avatarText: (c.name || 'C').charAt(0).toUpperCase()
        }));
        this.clientOptions.set(opts);
      }
    });

    // Courts & Settings
    this.api.get<any>(API_ENDPOINTS.SYSTEM.SETTINGS).pipe(this.subManager.untilDestroyed()).subscribe({
      next: (res) => {
        if (res.data?.practiceAreas) {
          this.practiceAreaOptions.set(
            res.data.practiceAreas.map((p: any) => ({
              label: p.name,
              value: p.id,
              description: p.description
            }))
          );
        }
        if (res.data?.courts) {
          this.courtOptions.set(
            res.data.courts.map((c: any) => ({
              label: `${c.name} (${c.city || ''})`,
              value: c.id,
              description: c.type
            }))
          );
        }
      }
    });

    // Advocates
    this.api.get<any>(API_ENDPOINTS.AUTH.USERS).pipe(this.subManager.untilDestroyed()).subscribe({
      next: (res) => {
        const advocates = (res.data || []).map((u: any) => {
          const roles = u.roles || (u.userRoles || []).map((ur: any) => ur.role?.name || ur.role || ur).filter(Boolean);
          const fullName = (u.fullName || `${u.firstName || ''} ${u.lastName || ''}`).trim() || u.email || 'Advocate';
          return {
            label: fullName,
            value: u.id,
            description: u.designation || (roles.length > 0 ? roles.join(', ') : 'Advocate'),
            avatarText: (u.firstName || fullName || 'A').charAt(0).toUpperCase(),
            badge: roles[0] || u.designation || 'Advocate'
          };
        });
        this.advocateOptions.set(advocates);
      }
    });
  }

  openCreateModal(): void {
    this.caseForm.reset({
      caseType: 'Commercial Suit',
      jurisdiction: 'High Court of Sindh',
      currentStage: 'Consultation',
      priority: 'medium',
      financialAgreement: 'Fixed Fee',
      agreedFee: 500000,
      assignedUserIds: []
    });
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  submitCase(): void {
    if (this.caseForm.invalid) {
      this.caseForm.markAllAsTouched();
      this.toastService.warning('Please fill in all mandatory case fields');
      return;
    }

    const payload = this.caseForm.value;
    this.api.post<any>(API_ENDPOINTS.CASES.BASE, payload).subscribe({
      next: (res) => {
        this.toastService.success(`Case ${res.data?.internalReference || ''} registered successfully!`);
        this.closeCreateModal();
        this.loadCases();
      }
    });
  }

  // Edit Case
  openEditModal(c: any, event: Event): void {
    event.stopPropagation();
    this.caseToEdit.set(c);
    this.editCaseForm.patchValue({
      title: c.title,
      caseType: c.caseType,
      courtCaseNumber: c.courtCaseNumber || '',
      jurisdiction: c.jurisdiction || '',
      judgeName: c.judgeName || '',
      plaintiffPetitioner: c.plaintiffPetitioner || '',
      defendantRespondent: c.defendantRespondent || '',
      opposingCounsel: c.opposingCounsel || '',
      opposingParties: c.opposingParties || '',
      currentStage: c.currentStage || 'Consultation',
      priority: c.priority || 'medium',
      financialAgreement: c.financialAgreement || 'Fixed Fee',
      agreedFee: c.agreedFee || 0,
      importantNotes: c.importantNotes || '',
      description: c.description || ''
    });
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.caseToEdit.set(null);
  }

  submitEditCase(): void {
    if (this.editCaseForm.invalid) {
      this.editCaseForm.markAllAsTouched();
      return;
    }

    const c = this.caseToEdit();
    if (!c) return;

    this.api.put<any>(API_ENDPOINTS.CASES.BY_ID(c.id), this.editCaseForm.value, {
      successMessage: `Case ${c.internalReference} updated successfully`
    }).subscribe({
      next: () => {
        this.closeEditModal();
        this.loadCases();
      }
    });
  }

  // Delete Case
  openDeleteModal(c: any, event: Event): void {
    event.stopPropagation();
    this.caseToDelete.set(c);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.caseToDelete.set(null);
  }

  confirmDeleteCase(): void {
    const c = this.caseToDelete();
    if (!c) return;

    this.isDeleting.set(true);
    this.api.delete<any>(API_ENDPOINTS.CASES.BY_ID(c.id), {
      successMessage: `Case ${c.internalReference} archived/deleted`
    }).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        this.loadCases();
      },
      error: () => {
        this.isDeleting.set(false);
      }
    });
  }
}
