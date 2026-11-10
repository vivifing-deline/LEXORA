import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constant';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/auth/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { SubscriptionManagerService } from '../../../core/services/subscription-manager.service';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  providers: [SubscriptionManagerService],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    IconComponent,
    LoadingSkeletonComponent,
    ModalComponent,
    ConfirmModalComponent
  ],
  templateUrl: './client-detail.component.html',
  styleUrls: ['./client-detail.component.scss']
})
export class ClientDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly subManager = inject(SubscriptionManagerService);

  readonly clientId = signal<string>('');
  readonly client = signal<any>(null);
  readonly isLoading = signal<boolean>(true);
  readonly activeTab = signal<string>('overview');

  // Edit Client Modal
  readonly isEditModalOpen = signal<boolean>(false);
  readonly editForm = this.fb.group({
    name: ['', [Validators.required]],
    type: ['individual', [Validators.required]],
    organization: [''],
    email: ['', [Validators.email]],
    phone: [''],
    nationalId: [''],
    city: ['Karachi'],
    address: [''],
    jurisdiction: ['Pakistan'],
    clientType: ['Standard'],
    notes: ['']
  });

  // Delete Client Confirm
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly isDeleting = signal<boolean>(false);

  // Contact Modal
  readonly isContactModalOpen = signal<boolean>(false);
  readonly contactForm = this.fb.group({
    name: ['', [Validators.required]],
    designation: [''],
    email: ['', [Validators.email]],
    phone: [''],
    isPrimary: [false]
  });

  // Delete Contact Confirm
  readonly isDeleteContactModalOpen = signal<boolean>(false);
  readonly contactToDelete = signal<any>(null);

  ngOnInit(): void {
    this.subManager.add(
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.clientId.set(id);
          this.loadClient();
        }
      })
    );
  }

  loadClient(): void {
    this.isLoading.set(true);
    this.api.get<any>(API_ENDPOINTS.CLIENTS.BY_ID(this.clientId())).pipe(this.subManager.untilDestroyed()).subscribe({
      next: (res) => {
        this.client.set(res.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  openEditModal(): void {
    const c = this.client();
    if (!c) return;
    this.editForm.patchValue({
      name: c.name,
      type: c.type,
      organization: c.organization || '',
      email: c.email || '',
      phone: c.phone || '',
      nationalId: c.nationalId || '',
      city: c.city || 'Karachi',
      address: c.address || '',
      jurisdiction: c.jurisdiction || 'Pakistan',
      clientType: c.clientType || 'Standard',
      notes: c.notes || ''
    });
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
  }

  submitEdit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.api.put<any>(API_ENDPOINTS.CLIENTS.BY_ID(this.clientId()), this.editForm.value, {
      successMessage: 'Client updated successfully'
    }).subscribe({
      next: () => {
        this.closeEditModal();
        this.loadClient();
      }
    });
  }

  openDeleteModal(): void {
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
  }

  confirmDeleteClient(): void {
    this.isDeleting.set(true);
    this.api.delete<any>(API_ENDPOINTS.CLIENTS.BY_ID(this.clientId()), {
      successMessage: 'Client archived/deleted successfully'
    }).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        this.router.navigate(['/clients']);
      },
      error: () => {
        this.isDeleting.set(false);
      }
    });
  }

  // Contact operations
  openContactModal(): void {
    this.contactForm.reset({
      name: '',
      designation: '',
      email: '',
      phone: '',
      isPrimary: false
    });
    this.isContactModalOpen.set(true);
  }

  closeContactModal(): void {
    this.isContactModalOpen.set(false);
  }

  submitContact(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.api.post<any>(API_ENDPOINTS.CLIENTS.CONTACTS(this.clientId()), this.contactForm.value, {
      successMessage: 'Corporate contact added'
    }).subscribe({
      next: () => {
        this.closeContactModal();
        this.loadClient();
      }
    });
  }

  openDeleteContactModal(contact: any): void {
    this.contactToDelete.set(contact);
    this.isDeleteContactModalOpen.set(true);
  }

  closeDeleteContactModal(): void {
    this.isDeleteContactModalOpen.set(false);
    this.contactToDelete.set(null);
  }

  confirmDeleteContact(): void {
    const contact = this.contactToDelete();
    if (!contact) return;

    this.api.delete<any>(API_ENDPOINTS.CLIENTS.CONTACT_BY_ID(this.clientId(), contact.id), {
      successMessage: 'Contact removed'
    }).subscribe({
      next: () => {
        this.closeDeleteContactModal();
        this.loadClient();
      }
    });
  }

  formatCurrency(val: number): string {
    return 'Rs. ' + (val || 0).toLocaleString();
  }
}
