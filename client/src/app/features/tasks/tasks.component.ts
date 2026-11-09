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
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-tasks',
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
    PaginationComponent
  ],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly isLoading = signal<boolean>(true);
  readonly page = signal<number>(1);
  readonly limit = signal<number>(10);
  readonly total = signal<number>(0);
  readonly totalPages = signal<number>(1);
  readonly tasks = signal<any[]>([]);
  readonly viewMode = signal<'kanban' | 'list'>('kanban');
  readonly draggedTask = signal<any>(null);
  readonly isCreateModalOpen = signal<boolean>(false);
  readonly caseOptions = signal<SelectOption[]>([]);
  readonly advocateOptions = signal<SelectOption[]>([]);

  readonly taskStatusOptions: CustomSelectOption[] = [
    { label: 'To Do', value: 'todo', dotColor: 'var(--text-muted)' },
    { label: 'In Progress', value: 'in_progress', dotColor: 'var(--primary)' },
    { label: 'Review', value: 'review', dotColor: 'var(--warning)' },
    { label: 'Completed', value: 'completed', dotColor: 'var(--success)' }
  ];

  // Edit Task Modal
  readonly isEditModalOpen = signal<boolean>(false);
  readonly taskToEdit = signal<any>(null);
  readonly editTaskForm = this.fb.group({
    title: ['', [Validators.required]],
    description: [''],
    taskType: ['Drafting', [Validators.required]],
    priority: ['medium'],
    dueDate: ['']
  });

  // Delete Task Confirm
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly taskToDelete = signal<any>(null);
  readonly isDeleting = signal<boolean>(false);

  readonly taskForm = this.fb.group({
    title: ['', [Validators.required]],
    description: [''],
    caseId: [''],
    taskType: ['Drafting', [Validators.required]],
    priority: ['medium'],
    dueDate: [''],
    assignedUserIds: [[] as string[]]
  });

  readonly taskTypes = [
    'Legal Research', 'Drafting', 'Filing', 'Client Meeting',
    'Court Preparation', 'Document Review', 'Evidence Preparation', 'Follow-up', 'Administrative'
  ];

  readonly columns = [
    { id: 'todo', label: 'To Do', color: '#64748B' },
    { id: 'in_progress', label: 'In Progress', color: '#4F46E5' },
    { id: 'review', label: 'Under Review', color: '#F59E0B' },
    { id: 'completed', label: 'Completed', color: '#16A34A' }
  ];

  ngOnInit(): void {
    this.loadTasks();
    this.loadDropdowns();
  }

  loadTasks(): void {
    this.isLoading.set(true);
    const params = {
      page: this.page(),
      limit: this.viewMode() === 'list' ? this.limit() : 100
    };
    this.api.get<any>(API_ENDPOINTS.TASKS.BASE, params).subscribe({
      next: (res) => {
        this.tasks.set(res.data || []);
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
    this.loadTasks();
  }

  onLimitChange(newLimit: number): void {
    this.limit.set(newLimit);
    this.page.set(1);
    this.loadTasks();
  }

  // HTML5 Drag and Drop handlers
  onDragStart(event: DragEvent, task: any): void {
    this.draggedTask.set(task);
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', task.id);
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    const stack = (event.currentTarget as HTMLElement);
    if (stack && !stack.classList.contains('drag-over')) {
      stack.classList.add('drag-over');
    }
  }

  onDragLeave(event: DragEvent): void {
    const stack = (event.currentTarget as HTMLElement);
    if (stack) {
      stack.classList.remove('drag-over');
    }
  }

  onDragEnd(): void {
    this.draggedTask.set(null);
    document.querySelectorAll('.kanban-cards-stack').forEach(el => el.classList.remove('drag-over'));
  }

  onDrop(event: DragEvent, targetStatus: string): void {
    event.preventDefault();
    const stack = (event.currentTarget as HTMLElement);
    if (stack) {
      stack.classList.remove('drag-over');
    }

    const task = this.draggedTask();
    if (!task) return;

    if (task.status === targetStatus) {
      this.draggedTask.set(null);
      return;
    }

    // Optimistic UI update
    const previousStatus = task.status;
    this.tasks.update(currentTasks =>
      currentTasks.map(t => t.id === task.id ? { ...t, status: targetStatus } : t)
    );
    this.draggedTask.set(null);

    // Persist to backend
    this.api.put<any>(API_ENDPOINTS.TASKS.BY_ID(task.id), { status: targetStatus }, { showErrorToast: false }).subscribe({
      next: () => {
        const colLabel = this.columns.find(c => c.id === targetStatus)?.label || targetStatus;
        this.toastService.success(`Task "${task.title}" moved to ${colLabel}`);
      },
      error: (err) => {
        // Rollback on failure
        this.tasks.update(currentTasks =>
          currentTasks.map(t => t.id === task.id ? { ...t, status: previousStatus } : t)
        );
        this.toastService.error(err.error?.message || 'Failed to update task status');
      }
    });
  }

  loadDropdowns(): void {
    this.api.get<any>(API_ENDPOINTS.CASES.BASE, { limit: 50 }).subscribe({
      next: (res) => {
        this.caseOptions.set((res.data || []).map((c: any) => ({
          label: `${c.internalReference}: ${c.title}`,
          value: c.id
        })));
      }
    });

    this.api.get<any>(API_ENDPOINTS.AUTH.USERS).subscribe({
      next: (res) => {
        this.advocateOptions.set((res.data || []).map((u: any) => ({
          label: u.fullName,
          value: u.id,
          description: u.designation,
          avatarText: u.firstName.charAt(0)
        })));
      }
    });
  }

  getTasksByStatus(status: string): any[] {
    return this.tasks().filter(t => t.status === status);
  }

  updateTaskStatus(taskId: string, newStatus: string): void {
    this.api.put<any>(API_ENDPOINTS.TASKS.BY_ID(taskId), { status: newStatus }, {
      successMessage: `Task moved to ${newStatus}`
    }).subscribe({
      next: () => this.loadTasks()
    });
  }

  openCreateModal(): void {
    this.taskForm.reset({
      taskType: 'Drafting',
      priority: 'medium',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      assignedUserIds: []
    });
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  submitTask(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.api.post<any>(API_ENDPOINTS.TASKS.BASE, this.taskForm.value, {
      successMessage: 'Task created and assigned successfully'
    }).subscribe({
      next: () => {
        this.closeCreateModal();
        this.loadTasks();
      }
    });
  }

  // Edit Task
  openEditModal(task: any): void {
    this.taskToEdit.set(task);
    this.editTaskForm.patchValue({
      title: task.title,
      description: task.description || '',
      taskType: task.taskType || 'Drafting',
      priority: task.priority || 'medium',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
    });
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.taskToEdit.set(null);
  }

  submitEditTask(): void {
    if (this.editTaskForm.invalid) return;

    const t = this.taskToEdit();
    if (!t) return;

    this.api.put<any>(API_ENDPOINTS.TASKS.BY_ID(t.id), this.editTaskForm.value, {
      successMessage: 'Task updated'
    }).subscribe({
      next: () => {
        this.closeEditModal();
        this.loadTasks();
      }
    });
  }

  // Delete Task
  openDeleteModal(task: any): void {
    this.taskToDelete.set(task);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.taskToDelete.set(null);
  }

  confirmDeleteTask(): void {
    const t = this.taskToDelete();
    if (!t) return;

    this.isDeleting.set(true);
    this.api.delete<any>(API_ENDPOINTS.TASKS.BY_ID(t.id), {
      successMessage: 'Task deleted'
    }).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        this.loadTasks();
      },
      error: () => {
        this.isDeleting.set(false);
      }
    });
  }
}
