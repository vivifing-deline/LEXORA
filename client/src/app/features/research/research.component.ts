import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { API_ENDPOINTS } from '../../core/constants/api-endpoints.constant';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { CustomSelectComponent, CustomSelectOption } from '../../shared/components/custom-select/custom-select.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-research',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    IconComponent,
    ModalComponent,
    CustomSelectComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent
  ],
  templateUrl: './research.component.html',
  styleUrls: ['./research.component.scss']
})
export class ResearchComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly isLoading = signal<boolean>(true);
  readonly references = signal<any[]>([]);
  readonly searchQuery = signal<string>('');
  readonly categoryFilter = signal<string>('');
  readonly isCreateModalOpen = signal<boolean>(false);

  readonly referenceForm = this.fb.group({
    title: ['', [Validators.required]],
    category: ['CPC Orders and Rules', [Validators.required]],
    actName: ['Code of Civil Procedure, 1908'],
    sectionRule: [''],
    citation: [''],
    court: ['Supreme Court of Pakistan'],
    year: [2024],
    summary: ['', [Validators.required]],
    tags: ['']
  });

  readonly researchCategoryOptions: CustomSelectOption[] = [
    { label: 'All Categories', value: '' },
    { label: 'CPC Orders and Rules', value: 'CPC Orders and Rules', icon: 'book' },
    { label: 'CrPC Sections', value: 'CrPC Sections', icon: 'shield' },
    { label: 'Constitution Articles', value: 'Constitution Articles', icon: 'file-text' },
    { label: 'Corporate & Companies Act', value: 'Corporate & Companies Act', icon: 'landmark' },
    { label: 'Case Law', value: 'Case Law', icon: 'briefcase' },
    { label: 'Precedents', value: 'Precedents', icon: 'folder' },
    { label: 'Internal Research', value: 'Internal Research', icon: 'search' }
  ];
  readonly categories = this.researchCategoryOptions;

  ngOnInit(): void {
    this.loadReferences();
  }

  loadReferences(): void {
    this.isLoading.set(true);
    const params: Record<string, any> = {};
    if (this.categoryFilter()) params['category'] = this.categoryFilter();
    if (this.searchQuery()) params['search'] = this.searchQuery();

    this.api.get<any>(API_ENDPOINTS.DOCUMENTS.REFERENCES, params).subscribe({
      next: (res) => {
        this.references.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.referenceForm.reset({
      category: 'CPC Orders and Rules',
      actName: 'Code of Civil Procedure, 1908',
      court: 'Supreme Court of Pakistan',
      year: 2024
    });
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  submitReference(): void {
    if (this.referenceForm.invalid) {
      this.referenceForm.markAllAsTouched();
      return;
    }

    this.api.post<any>(API_ENDPOINTS.DOCUMENTS.REFERENCES, this.referenceForm.value, {
      successMessage: 'Legal reference added to chambers knowledge base'
    }).subscribe({
      next: () => {
        this.closeCreateModal();
        this.loadReferences();
      }
    });
  }
}
