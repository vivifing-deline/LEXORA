import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { API_ENDPOINTS } from '../../core/constants/api-endpoints.constant';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { MultiSelectComponent, SelectOption } from '../../shared/components/multi-select/multi-select.component';
import { CustomSelectComponent, CustomSelectOption } from '../../shared/components/custom-select/custom-select.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IconComponent,
    ModalComponent,
    ConfirmModalComponent,
    LoadingSkeletonComponent,
    MultiSelectComponent,
    CustomSelectComponent,
    PaginationComponent
  ],
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss']
})
export class TeamComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly isLoading = signal<boolean>(true);
  readonly page = signal<number>(1);
  readonly limit = signal<number>(10);
  readonly total = signal<number>(0);
  readonly totalPages = signal<number>(1);
  readonly activeTab = signal<'users' | 'roles' | 'matrix'>('users');
  readonly users = signal<any[]>([]);
  readonly roles = signal<any[]>([]);
  readonly permissions = signal<any[]>([]);
  readonly departments = signal<any[]>([]);

  // Filtering
  readonly userSearch = signal<string>('');
  readonly userStatusFilter = signal<string>('all');

  readonly userStatusOptions: CustomSelectOption[] = [
    { label: 'All Statuses', value: 'all', dotColor: 'var(--text-muted)' },
    { label: 'Active Only', value: 'active', dotColor: 'var(--success)' },
    { label: 'Deactivated Only', value: 'inactive', dotColor: 'var(--danger)' }
  ];
  readonly matrixSearch = signal<string>('');

  // Matrix selection state
  readonly selectedRoleId = signal<string>('');
  readonly matrixSelectedPermIds = signal<Set<string>>(new Set<string>());
  readonly isMatrixSaving = signal<boolean>(false);

  // Modals state
  readonly isUserModalOpen = signal<boolean>(false);
  readonly isEditUser = signal<boolean>(false);
  readonly selectedUserId = signal<string | null>(null);
  userForm!: FormGroup;

  readonly isRoleModalOpen = signal<boolean>(false);
  readonly isEditRole = signal<boolean>(false);
  roleForm!: FormGroup;

  readonly isPasswordModalOpen = signal<boolean>(false);
  passwordForm!: FormGroup;

  // Confirmation modal
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

  // Computed
  readonly roleOptions = computed<SelectOption[]>(() => {
    return this.roles().map(r => ({
      label: r.displayName || r.name,
      value: r.id,
      description: r.description
    }));
  });

  readonly filteredUsers = computed(() => {
    const q = this.userSearch().toLowerCase().trim();
    const status = this.userStatusFilter();

    return this.users().filter(u => {
      const matchQ = !q ||
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.designation && u.designation.toLowerCase().includes(q));

      const matchStatus = status === 'all' ||
        (status === 'active' && u.isActive) ||
        (status === 'inactive' && !u.isActive);

      return matchQ && matchStatus;
    });
  });

  readonly selectedRole = computed(() => {
    const roleId = this.selectedRoleId();
    return this.roles().find(r => r.id === roleId) || this.roles()[0] || null;
  });

  readonly groupedPermissions = computed(() => {
    const q = this.matrixSearch().toLowerCase().trim();
    const all = this.permissions();
    const filtered = !q ? all : all.filter(p =>
      p.code.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      p.module.toLowerCase().includes(q)
    );

    const groups: { [key: string]: any[] } = {};
    for (const p of filtered) {
      if (!groups[p.module]) {
        groups[p.module] = [];
      }
      groups[p.module].push(p);
    }

    return Object.keys(groups).sort().map(module => ({
      module,
      permissions: groups[module]
    }));
  });

  ngOnInit(): void {
    this.initForms();
    this.loadTeamData();
  }

  initForms(): void {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]],
      designation: [''],
      phone: [''],
      departmentId: [''],
      roleIds: [[], [Validators.required]]
    });

    this.roleForm = this.fb.group({
      id: [''],
      name: ['', [Validators.required]],
      displayName: ['', [Validators.required]],
      description: ['']
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  loadTeamData(): void {
    this.isLoading.set(true);

    this.api.get<any>(API_ENDPOINTS.AUTH.USERS, { page: this.page(), limit: this.limit() }).subscribe({
      next: (res) => {
        this.users.set(res.data || []);
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

    this.api.get<any>(API_ENDPOINTS.AUTH.ROLES).subscribe({
      next: (res) => {
        const roles = res.data || [];
        this.roles.set(roles);
        if (roles.length > 0 && !this.selectedRoleId()) {
          this.selectRoleForMatrix(roles[0].id);
        }
      }
    });

    this.api.get<any>(API_ENDPOINTS.AUTH.PERMISSIONS).subscribe({
      next: (res) => {
        this.permissions.set(res.data?.list || res.data || []);
      }
    });

    this.api.get<any>(API_ENDPOINTS.SYSTEM.DEPARTMENTS).subscribe({
      next: (res) => {
        this.departments.set(res.data || []);
      }
    });
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadTeamData();
  }

  onLimitChange(newLimit: number): void {
    this.limit.set(newLimit);
    this.page.set(1);
    this.loadTeamData();
  }

  // ==========================================
  // USER CRUD
  // ==========================================

  openCreateUserModal(): void {
    this.isEditUser.set(false);
    this.selectedUserId.set(null);
    this.userForm.reset({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      designation: 'Associate Advocate',
      phone: '',
      departmentId: this.departments()[0]?.id || '',
      roleIds: this.roles().find(r => r.name === 'Associate Advocate') ? [this.roles().find(r => r.name === 'Associate Advocate').id] : []
    });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.isUserModalOpen.set(true);
  }

  openEditUserModal(user: any): void {
    this.isEditUser.set(true);
    this.selectedUserId.set(user.id);
    this.userForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      designation: user.designation || '',
      phone: user.phone || '',
      departmentId: user.departmentId || '',
      roleIds: (user.roles || []).map((r: any) => typeof r === 'string' ? (this.roles().find(x => x.name === r)?.id) : r.id).filter(Boolean)
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.isUserModalOpen.set(true);
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.toastService.warning('Please fill in all required fields');
      return;
    }

    const payload = { ...this.userForm.value };
    if (this.isEditUser()) {
      delete payload.email; // Keep email immutable
      if (!payload.password) delete payload.password;

      this.api.put<any>(API_ENDPOINTS.AUTH.USER_BY_ID(this.selectedUserId()!), payload, {
        successMessage: 'User updated successfully'
      }).subscribe({
        next: () => {
          this.isUserModalOpen.set(false);
          this.loadTeamData();
        }
      });
    } else {
      this.api.post<any>(API_ENDPOINTS.AUTH.USERS, payload, {
        successMessage: 'User created successfully and can now log in'
      }).subscribe({
        next: () => {
          this.isUserModalOpen.set(false);
          this.loadTeamData();
        }
      });
    }
  }

  toggleUserStatus(user: any): void {
    const newStatus = !user.isActive;
    const actionLabel = newStatus ? 'activate' : 'deactivate';

    this.confirmModal.set({
      isOpen: true,
      title: `${newStatus ? 'Activate' : 'Deactivate'} User?`,
      message: `Are you sure you want to ${actionLabel} ${user.fullName}? ${newStatus ? 'The user will be able to log in.' : 'The user will be immediately blocked from signing in.'}`,
      confirmText: newStatus ? 'Activate User' : 'Deactivate User',
      isDanger: !newStatus,
      action: () => {
        this.api.put<any>(`${API_ENDPOINTS.AUTH.USERS}/${user.id}/status`, { isActive: newStatus }, {
          successMessage: `User ${user.fullName} ${actionLabel}d`
        }).subscribe({
          next: () => {
            this.confirmModal.update(s => ({ ...s, isOpen: false }));
            this.loadTeamData();
          }
        });
      }
    });
  }

  openResetPasswordModal(user: any): void {
    this.selectedUserId.set(user.id);
    this.passwordForm.reset({ newPassword: '' });
    this.isPasswordModalOpen.set(true);
  }

  saveResetPassword(): void {
    if (this.passwordForm.invalid) {
      this.toastService.warning('Password must be at least 6 characters long');
      return;
    }

    const { newPassword } = this.passwordForm.value;
    this.api.post<any>(API_ENDPOINTS.AUTH.USER_RESET_PASSWORD(this.selectedUserId()!), { newPassword }, {
      successMessage: 'User password reset successfully'
    }).subscribe({
      next: () => {
        this.isPasswordModalOpen.set(false);
      }
    });
  }

  confirmDeleteUser(user: any): void {
    this.confirmModal.set({
      isOpen: true,
      title: 'Delete User Account?',
      message: `Are you sure you want to delete ${user.fullName} (${user.email})? If the user has assigned cases or invoices, the account will be safely archived to preserve audit integrity.`,
      confirmText: 'Delete User',
      isDanger: true,
      action: () => {
        this.api.delete<any>(API_ENDPOINTS.AUTH.USER_BY_ID(user.id), {
          successMessage: 'User deleted successfully'
        }).subscribe({
          next: () => {
            this.confirmModal.update(s => ({ ...s, isOpen: false }));
            this.loadTeamData();
          }
        });
      }
    });
  }

  // ==========================================
  // ROLE CRUD
  // ==========================================

  openCreateRoleModal(): void {
    this.isEditRole.set(false);
    this.roleForm.reset({
      name: '',
      displayName: '',
      description: ''
    });
    this.isRoleModalOpen.set(true);
  }

  openEditRoleModal(role: any): void {
    this.isEditRole.set(true);
    this.roleForm.reset({
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description || ''
    });
    this.isRoleModalOpen.set(true);
  }

  saveRole(): void {
    if (this.roleForm.invalid) {
      this.toastService.warning('Role name and display name are required');
      return;
    }

    const payload = this.roleForm.value;
    if (this.isEditRole()) {
      this.api.put<any>(API_ENDPOINTS.AUTH.ROLE_BY_ID(payload.id), payload, {
        successMessage: 'Role updated successfully'
      }).subscribe({
        next: () => {
          this.isRoleModalOpen.set(false);
          this.loadTeamData();
        }
      });
    } else {
      this.api.post<any>(API_ENDPOINTS.AUTH.ROLES, payload, {
        successMessage: 'Custom role created successfully'
      }).subscribe({
        next: () => {
          this.isRoleModalOpen.set(false);
          this.loadTeamData();
        }
      });
    }
  }

  confirmDeleteRole(role: any): void {
    if (role.name === 'Firm Admin') {
      this.toastService.warning('The Firm Admin system role cannot be deleted');
      return;
    }

    this.confirmModal.set({
      isOpen: true,
      title: 'Delete Legal Role?',
      message: `Are you sure you want to delete role '${role.displayName}'? This action is only permitted if no users are currently assigned to this role.`,
      confirmText: 'Delete Role',
      isDanger: true,
      action: () => {
        this.api.delete<any>(API_ENDPOINTS.AUTH.ROLE_BY_ID(role.id), {
          successMessage: 'Role deleted successfully'
        }).subscribe({
          next: () => {
            this.confirmModal.update(s => ({ ...s, isOpen: false }));
            this.loadTeamData();
          }
        });
      }
    });
  }

  // ==========================================
  // PERMISSION MATRIX
  // ==========================================

  selectRoleForMatrix(roleId: string): void {
    this.selectedRoleId.set(roleId);
    const role = this.roles().find(r => r.id === roleId);
    if (role) {
      const permIds = new Set<string>(role.permissionIds || []);
      this.matrixSelectedPermIds.set(permIds);
    }
  }

  switchToMatrixForRole(role: any): void {
    this.selectRoleForMatrix(role.id);
    this.activeTab.set('matrix');
  }

  isPermChecked(permId: string): boolean {
    if (this.selectedRole()?.name === 'Firm Admin') return true;
    return this.matrixSelectedPermIds().has(permId);
  }

  togglePerm(permId: string): void {
    if (this.selectedRole()?.name === 'Firm Admin') {
      this.toastService.info('Firm Admin automatically retains all system privileges.');
      return;
    }

    const current = new Set(this.matrixSelectedPermIds());
    if (current.has(permId)) {
      current.delete(permId);
    } else {
      current.add(permId);
    }
    this.matrixSelectedPermIds.set(current);
  }

  toggleModulePerms(modulePerms: any[]): void {
    if (this.selectedRole()?.name === 'Firm Admin') return;

    const current = new Set(this.matrixSelectedPermIds());
    const allModuleSelected = modulePerms.every(p => current.has(p.id));

    if (allModuleSelected) {
      modulePerms.forEach(p => current.delete(p.id));
    } else {
      modulePerms.forEach(p => current.add(p.id));
    }
    this.matrixSelectedPermIds.set(current);
  }

  selectAllPerms(): void {
    if (this.selectedRole()?.name === 'Firm Admin') return;
    const allIds = new Set<string>(this.permissions().map(p => p.id));
    this.matrixSelectedPermIds.set(allIds);
  }

  clearAllPerms(): void {
    if (this.selectedRole()?.name === 'Firm Admin') return;
    this.matrixSelectedPermIds.set(new Set<string>());
  }

  saveMatrix(): void {
    const roleId = this.selectedRoleId();
    if (!roleId) return;

    this.isMatrixSaving.set(true);
    const permissionIds = Array.from(this.matrixSelectedPermIds());

    this.api.put<any>(API_ENDPOINTS.AUTH.ROLE_PERMISSIONS(roleId), { permissionIds }, {
      successMessage: `Permissions matrix updated for ${this.selectedRole()?.displayName}`
    }).subscribe({
      next: () => {
        this.isMatrixSaving.set(false);
        this.loadTeamData();
      },
      error: () => {
        this.isMatrixSaving.set(false);
      }
    });
  }
}
