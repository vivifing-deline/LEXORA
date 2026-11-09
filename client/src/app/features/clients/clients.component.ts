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
import { MultiSelectComponent, SelectOption } from '../../shared/components/multi-select/multi-select.component';
import { CustomSelectComponent, CustomSelectOption } from '../../shared/components/custom-select/custom-select.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-clients',
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
    CustomSelectComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    PaginationComponent
  ],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.scss']
})
export class ClientsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly isLoading = signal<boolean>(true);
  readonly page = signal<number>(1);
  readonly limit = signal<number>(10);
  readonly total = signal<number>(0);
  readonly totalPages = signal<number>(1);
  readonly clients = signal<any[]>([]);
  readonly searchQuery = signal<string>('');
  readonly typeFilter = signal<string>('');

  readonly typeOptions: CustomSelectOption[] = [
    { label: 'All Client Types', value: '', dotColor: 'var(--text-muted)' },
    { label: 'Individual Clients', value: 'individual', icon: 'user' },
    { label: 'Corporate Clients', value: 'corporate', icon: 'briefcase' }
  ];
  readonly isCreateModalOpen = signal<boolean>(false);
  readonly isEditClient = signal<boolean>(false);
  readonly selectedClientId = signal<string | null>(null);
  readonly advocateOptions = signal<SelectOption[]>([]);

  readonly confirmModal = signal<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    isDanger: boolean;
    action?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    isDanger: false
  });

  readonly clientForm = this.fb.group({
    name: ['', [Validators.required]],
    type: ['corporate', [Validators.required]],
    organization: [''],
    email: ['', [Validators.email]],
    phone: [''],
    address: [''],
    city: ['Karachi'],
    jurisdiction: ['Sindh'],
    nationalId: [''],
    clientType: ['retained'],
    status: ['active'],
    assignedAdvocateId: [''],
    notes: [''],
    contactName: [''],
    contactDesignation: [''],
    contactEmail: [''],
    contactPhone: ['']
  });

  ngOnInit(): void {
    this.loadClients();
    this.loadAdvocates();
  }

  loadClients(): void {
    this.isLoading.set(true);
    const params: Record<string, any> = {
      page: this.page(),
      limit: this.limit()
    };
    if (this.searchQuery()) params['search'] = this.searchQuery();
    if (this.typeFilter()) params['type'] = this.typeFilter();

    this.api.get<any>(API_ENDPOINTS.CLIENTS.BASE, params).subscribe({
      next: (res) => {
        this.clients.set(res.data || []);
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

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadClients();
  }

  onLimitChange(newLimit: number): void {
    this.limit.set(newLimit);
    this.page.set(1);
    this.loadClients();
  }

  loadAdvocates(): void {
    this.api.get<any>(API_ENDPOINTS.AUTH.USERS).subscribe({
      next: (res) => {
        const opts = (res.data || []).map((u: any) => ({
          label: u.fullName,
          value: u.id,
          description: u.designation,
          avatarText: u.firstName.charAt(0)
        }));
        this.advocateOptions.set(opts);
      }
    });
  }

  openCreateModal(): void {
    this.isEditClient.set(false);
    this.selectedClientId.set(null);
    this.clientForm.reset({
      type: 'corporate',
      city: 'Karachi',
      jurisdiction: 'Sindh',
      clientType: 'retained',
      status: 'active'
    });
    this.isCreateModalOpen.set(true);
  }

  openEditModal(client: any): void {
    this.isEditClient.set(true);
    this.selectedClientId.set(client.id);
    this.clientForm.reset({
      name: client.name,
      type: client.type,
      organization: client.organization || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      city: client.city || 'Karachi',
      jurisdiction: client.jurisdiction || 'Sindh',
      nationalId: client.nationalId || '',
      clientType: client.clientType || 'retained',
      status: client.status || 'active',
      assignedAdvocateId: client.assignedAdvocateId || '',
      notes: client.notes || ''
    });
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  submitClient(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    const val = this.clientForm.value;
    const payload: any = {
      name: val.name,
      type: val.type,
      organization: val.organization,
      email: val.email,
      phone: val.phone,
      address: val.address,
      city: val.city,
      jurisdiction: val.jurisdiction,
      nationalId: val.nationalId,
      clientType: val.clientType,
      status: val.status,
      assignedAdvocateId: val.assignedAdvocateId,
      notes: val.notes
    };

    if (this.isEditClient()) {
      this.api.put<any>(API_ENDPOINTS.CLIENTS.BY_ID(this.selectedClientId()!), payload).subscribe({
        next: (res) => {
          this.toastService.success(`Client ${res.data?.name || ''} updated successfully!`);
          this.closeCreateModal();
          this.loadClients();
        }
      });
    } else {
      if (val.contactName) {
        payload.contacts = [{
          name: val.contactName,
          designation: val.contactDesignation,
          email: val.contactEmail,
          phone: val.contactPhone,
          isPrimary: true
        }];
      }

      this.api.post<any>(API_ENDPOINTS.CLIENTS.BASE, payload).subscribe({
        next: (res) => {
          this.toastService.success(`Client ${res.data?.name || ''} (${res.data?.clientReference || ''}) registered!`);
          this.closeCreateModal();
          this.loadClients();
        }
      });
    }
  }

  confirmDeleteClient(client: any): void {
    this.confirmModal.set({
      isOpen: true,
      title: 'Delete / Archive Client?',
      message: `Are you sure you want to delete ${client.name} (${client.clientReference})? If this client has associated legal cases or fee invoices, the record will be safely archived to preserve legal compliance.`,
      confirmText: 'Delete / Archive',
      isDanger: true,
      action: () => {
        this.api.delete<any>(API_ENDPOINTS.CLIENTS.BY_ID(client.id)).subscribe({
          next: (res) => {
            this.toastService.success(res?.message || 'Client removed successfully');
            this.confirmModal.update(s => ({ ...s, isOpen: false }));
            this.loadClients();
          }
        });
      }
    });
  }

  closeConfirmModal(): void {
    this.confirmModal.update(s => ({ ...s, isOpen: false }));
  }
}
