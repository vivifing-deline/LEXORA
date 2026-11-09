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
  selector: 'app-documents',
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
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.scss']
})
export class DocumentsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly isLoading = signal<boolean>(true);
  readonly page = signal<number>(1);
  readonly limit = signal<number>(10);
  readonly total = signal<number>(0);
  readonly totalPages = signal<number>(1);
  readonly documents = signal<any[]>([]);
  readonly searchQuery = signal<string>('');
  readonly categoryFilter = signal<string>('');

  readonly categoryOptions: CustomSelectOption[] = [
    { label: 'All Categories', value: '', dotColor: 'var(--text-muted)' },
    { label: 'Pleading', value: 'pleading', icon: 'file-text' },
    { label: 'Order / Judgment', value: 'order', icon: 'gavel' },
    { label: 'Evidence', value: 'evidence', icon: 'shield' },
    { label: 'Power of Attorney', value: 'power_of_attorney', icon: 'briefcase' },
    { label: 'Correspondence', value: 'correspondence', icon: 'book-open' },
    { label: 'Other', value: 'other', icon: 'folder' }
  ];
  readonly isUploadModalOpen = signal<boolean>(false);
  readonly caseOptions = signal<SelectOption[]>([]);
  selectedFile: File | null = null;

  // Edit Modal
  readonly isEditModalOpen = signal<boolean>(false);
  readonly docToEdit = signal<any>(null);
  readonly editForm = this.fb.group({
    title: ['', [Validators.required]],
    category: ['Plaint', [Validators.required]],
    tags: [''],
    description: [''],
    isConfidential: [false]
  });

  // Delete Confirm
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly docToDelete = signal<any>(null);
  readonly isDeleting = signal<boolean>(false);

  readonly uploadForm = this.fb.group({
    title: ['', [Validators.required]],
    category: ['Plaint', [Validators.required]],
    caseId: [''],
    tags: [''],
    description: [''],
    isConfidential: [false]
  });

  readonly categories = [
    'Plaint', 'Written Statement', 'Petition', 'Application',
    'Affidavit', 'Vakalatnama', 'Evidence', 'Exhibit',
    'Court Order', 'Judgment', 'Appeal', 'Legal Notice', 'Contract', 'Other'
  ];

  ngOnInit(): void {
    this.loadDocuments();
    this.loadCases();
  }

  getDownloadUrl(docId: string): string {
    return this.api.getAbsoluteUrl(API_ENDPOINTS.DOCUMENTS.DOWNLOAD(docId));
  }

  loadDocuments(): void {
    this.isLoading.set(true);
    const params: Record<string, any> = {
      page: this.page(),
      limit: this.limit()
    };
    if (this.categoryFilter()) params['category'] = this.categoryFilter();
    if (this.searchQuery()) params['search'] = this.searchQuery();

    this.api.get<any>(API_ENDPOINTS.DOCUMENTS.BASE, params).subscribe({
      next: (res) => {
        this.documents.set(res.data || []);
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
    this.loadDocuments();
  }

  onLimitChange(newLimit: number): void {
    this.limit.set(newLimit);
    this.page.set(1);
    this.loadDocuments();
  }

  loadCases(): void {
    this.api.get<any>(API_ENDPOINTS.CASES.BASE, { limit: 100 }).subscribe({
      next: (res) => {
        const opts = (res.data || []).map((c: any) => ({
          label: `${c.internalReference}: ${c.title}`,
          value: c.id,
          description: c.court?.name
        }));
        this.caseOptions.set(opts);
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      if (!this.uploadForm.value.title) {
        this.uploadForm.patchValue({ title: file.name });
      }
    }
  }

  openUploadModal(): void {
    this.uploadForm.reset({
      category: 'Plaint',
      isConfidential: false
    });
    this.selectedFile = null;
    this.isUploadModalOpen.set(true);
  }

  closeUploadModal(): void {
    this.isUploadModalOpen.set(false);
  }

  submitUpload(): void {
    if (this.uploadForm.invalid) {
      this.uploadForm.markAllAsTouched();
      return;
    }
    if (!this.selectedFile) {
      this.toastService.warning('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('title', this.uploadForm.value.title || this.selectedFile.name);
    formData.append('category', this.uploadForm.value.category || 'Other');
    if (this.uploadForm.value.caseId) {
      formData.append('caseId', this.uploadForm.value.caseId);
    }
    if (this.uploadForm.value.tags) {
      formData.append('tags', this.uploadForm.value.tags);
    }
    if (this.uploadForm.value.description) {
      formData.append('description', this.uploadForm.value.description);
    }
    formData.append('isConfidential', String(this.uploadForm.value.isConfidential));

    this.api.post<any>(API_ENDPOINTS.DOCUMENTS.UPLOAD, formData, {
      successMessage: 'Document uploaded to local vault successfully'
    }).subscribe({
      next: () => {
        this.closeUploadModal();
        this.loadDocuments();
      }
    });
  }

  // Edit metadata
  openEditModal(doc: any): void {
    this.docToEdit.set(doc);
    this.editForm.patchValue({
      title: doc.title,
      category: doc.category || 'Plaint',
      tags: doc.tags || '',
      description: doc.description || '',
      isConfidential: doc.isConfidential || false
    });
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.docToEdit.set(null);
  }

  submitEdit(): void {
    if (this.editForm.invalid) return;

    const doc = this.docToEdit();
    if (!doc) return;

    this.api.put<any>(API_ENDPOINTS.DOCUMENTS.BY_ID(doc.id), this.editForm.value, {
      successMessage: 'Document metadata updated'
    }).subscribe({
      next: () => {
        this.closeEditModal();
        this.loadDocuments();
      }
    });
  }

  // Delete
  openDeleteModal(doc: any): void {
    this.docToDelete.set(doc);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.docToDelete.set(null);
  }

  confirmDeleteDocument(): void {
    const doc = this.docToDelete();
    if (!doc) return;

    this.isDeleting.set(true);
    this.api.delete<any>(API_ENDPOINTS.DOCUMENTS.BY_ID(doc.id), {
      successMessage: 'Document deleted from vault'
    }).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        this.loadDocuments();
      },
      error: () => {
        this.isDeleting.set(false);
      }
    });
  }
}
