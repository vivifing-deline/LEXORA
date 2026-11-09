import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { ThemeService } from '../../core/services/theme.service';
import { ConfigService } from '../../core/services/config.service';
import { ApiService } from '../../core/services/api.service';
import { API_ENDPOINTS } from '../../core/constants/api-endpoints.constant';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IconComponent,
    ModalComponent,
    ConfirmModalComponent,
    LoadingSkeletonComponent
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly themeService = inject(ThemeService);
  readonly configService = inject(ConfigService);
  private readonly toastService = inject(ToastService);

  readonly isLoading = signal<boolean>(true);
  readonly activeTab = signal<'environment' | 'profile' | 'courts' | 'master' | 'audit'>('environment');

  readonly envInfo = signal<any>(null);
  readonly workspaceData = signal<any>(null);
  readonly auditLogs = signal<any[]>([]);
  readonly courts = signal<any[]>([]);
  readonly departments = signal<any[]>([]);
  readonly practiceAreas = signal<any[]>([]);

  readonly isBackingUp = signal<boolean>(false);
  readonly isResetting = signal<boolean>(false);
  readonly isResetModalOpen = signal<boolean>(false);

  readonly demoAccounts = [
    { role: 'Firm Admin', email: 'admin@lexora.demo', password: 'Demo@123' },
    { role: 'Senior Advocate', email: 'senior@lexora.demo', password: 'Demo@123' },
    { role: 'Associate', email: 'associate@lexora.demo', password: 'Demo@123' },
    { role: 'Junior Advocate', email: 'junior@lexora.demo', password: 'Demo@123' },
    { role: 'Clerk', email: 'clerk@lexora.demo', password: 'Demo@123' },
    { role: 'Accountant', email: 'accountant@lexora.demo', password: 'Demo@123' },
    { role: 'Client', email: 'client@lexora.demo', password: 'Demo@123' }
  ];

  // Profile Form
  readonly profileForm = this.fb.group({
    name: ['', Validators.required],
    legalName: [''],
    phone: [''],
    email: ['', [Validators.required, Validators.email]],
    address: [''],
    city: [''],
    country: ['Pakistan'],
    currency: ['PKR'],
    currencySymbol: ['Rs.'],
    primaryColor: ['#1E3A8A']
  });

  // Master Forms
  readonly isCourtModalOpen = signal<boolean>(false);
  readonly isEditCourt = signal<boolean>(false);
  readonly courtForm = this.fb.group({
    id: [''],
    name: ['', Validators.required],
    type: ['District Court', Validators.required],
    city: ['Karachi', Validators.required],
    jurisdiction: ['Sindh', Validators.required],
    courtroomCount: [1, Validators.min(1)],
    notes: ['']
  });

  readonly isJudgeModalOpen = signal<boolean>(false);
  readonly judgeForm = this.fb.group({
    name: ['', Validators.required],
    designation: ['Justice', Validators.required],
    courtId: ['', Validators.required],
    roomNumber: [''],
    benchType: ['Single Bench'],
    notes: ['']
  });

  readonly isDeptModalOpen = signal<boolean>(false);
  readonly deptForm = this.fb.group({
    name: ['', Validators.required],
    description: ['']
  });

  readonly isAreaModalOpen = signal<boolean>(false);
  readonly areaForm = this.fb.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
    description: ['']
  });

  // Confirm modal state
  readonly confirmModal = signal<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    isDanger: boolean;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    isDanger: false,
    action: () => {}
  });

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.isLoading.set(true);

    // Environment info
    this.api.get<any>(API_ENDPOINTS.SYSTEM.INFO).subscribe({
      next: (res) => this.envInfo.set(res.data)
    });

    // Workspace & settings
    this.api.get<any>(API_ENDPOINTS.SYSTEM.SETTINGS).subscribe({
      next: (res) => {
        this.workspaceData.set(res.data);
        if (res.data?.workspace) {
          this.profileForm.patchValue(res.data.workspace);
        }
        this.courts.set(res.data?.courts || []);
        this.departments.set(res.data?.departments || []);
        this.practiceAreas.set(res.data?.practiceAreas || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });

    // Audit logs
    this.api.get<any>(API_ENDPOINTS.SYSTEM.AUDIT).subscribe({
      next: (res) => this.auditLogs.set(res.data || [])
    });
  }

  // Profile save
  saveProfile(): void {
    if (this.profileForm.invalid) return;

    this.api.put<any>(API_ENDPOINTS.SYSTEM.SETTINGS, this.profileForm.value, {
      successMessage: 'Firm profile and settings updated successfully'
    }).subscribe({
      next: () => this.loadAll()
    });
  }

  // Backup & Restore
  createBackup(): void {
    this.isBackingUp.set(true);
    this.api.post<any>(API_ENDPOINTS.SYSTEM.BACKUP, {}).subscribe({
      next: (res) => {
        this.isBackingUp.set(false);
        this.toastService.success(`Backup created: ${res.data?.fileName || 'lexora-backup.db'}`);
        this.loadAll();
      },
      error: () => {
        this.isBackingUp.set(false);
      }
    });
  }

  confirmResetDemo(): void {
    this.isResetting.set(true);
    this.configService.resetDemoData().subscribe({
      next: () => {
        this.isResetting.set(false);
        this.isResetModalOpen.set(false);
        this.toastService.success('Demo dataset successfully restored to original presentation state');
        window.location.reload();
      },
      error: () => {
        this.isResetting.set(false);
      }
    });
  }

  // ==========================================
  // COURTS CRUD
  // ==========================================

  openCreateCourtModal(): void {
    this.isEditCourt.set(false);
    this.courtForm.reset({
      type: 'District Court',
      city: 'Karachi',
      jurisdiction: 'Sindh'
    });
    this.isCourtModalOpen.set(true);
  }

  openEditCourtModal(c: any): void {
    this.isEditCourt.set(true);
    this.courtForm.reset(c);
    this.isCourtModalOpen.set(true);
  }

  saveCourt(): void {
    if (this.courtForm.invalid) return;

    const val = this.courtForm.value;
    if (this.isEditCourt()) {
      this.api.put<any>(`${API_ENDPOINTS.HEARINGS.COURTS}/${val.id}`, val, {
        successMessage: 'Court updated successfully'
      }).subscribe({
        next: () => {
          this.isCourtModalOpen.set(false);
          this.loadAll();
        }
      });
    } else {
      this.api.post<any>(API_ENDPOINTS.HEARINGS.COURTS, val, {
        successMessage: 'Court created successfully'
      }).subscribe({
        next: () => {
          this.isCourtModalOpen.set(false);
          this.loadAll();
        }
      });
    }
  }

  deleteCourt(c: any): void {
    this.confirmModal.set({
      isOpen: true,
      title: 'Delete Court Entry?',
      message: `Are you sure you want to delete ${c.name}? If cases exist in this court, it will be safely deactivated.`,
      confirmText: 'Delete Court',
      isDanger: true,
      action: () => {
        this.api.delete<any>(`${API_ENDPOINTS.HEARINGS.COURTS}/${c.id}`, {
          successMessage: 'Court deleted/deactivated'
        }).subscribe({
          next: () => {
            this.confirmModal.update(s => ({ ...s, isOpen: false }));
            this.loadAll();
          }
        });
      }
    });
  }

  // ==========================================
  // JUDGES CRUD
  // ==========================================

  openAddJudgeModal(courtId: string): void {
    this.judgeForm.reset({
      courtId,
      designation: 'Justice'
    });
    this.isJudgeModalOpen.set(true);
  }

  saveJudge(): void {
    if (this.judgeForm.invalid) return;

    this.api.post<any>(API_ENDPOINTS.HEARINGS.JUDGES, this.judgeForm.value, {
      successMessage: 'Judge added successfully'
    }).subscribe({
      next: () => {
        this.isJudgeModalOpen.set(false);
        this.loadAll();
      }
    });
  }

  deleteJudge(j: any): void {
    this.confirmModal.set({
      isOpen: true,
      title: 'Delete Judge Record?',
      message: `Delete judge ${j.name}?`,
      confirmText: 'Delete Judge',
      isDanger: true,
      action: () => {
        this.api.delete<any>(`${API_ENDPOINTS.HEARINGS.JUDGES}/${j.id}`, {
          successMessage: 'Judge removed'
        }).subscribe({
          next: () => {
            this.confirmModal.update(s => ({ ...s, isOpen: false }));
            this.loadAll();
          }
        });
      }
    });
  }

  // ==========================================
  // DEPARTMENTS & PRACTICE AREAS
  // ==========================================

  openCreateDeptModal(): void {
    this.deptForm.reset();
    this.isDeptModalOpen.set(true);
  }

  saveDepartment(): void {
    if (this.deptForm.invalid) return;
    this.api.post<any>(API_ENDPOINTS.SYSTEM.DEPARTMENTS, this.deptForm.value, {
      successMessage: 'Department created'
    }).subscribe({
      next: () => {
        this.isDeptModalOpen.set(false);
        this.loadAll();
      }
    });
  }

  deleteDepartment(d: any): void {
    this.confirmModal.set({
      isOpen: true,
      title: 'Delete Department?',
      message: `Delete department ${d.name}?`,
      confirmText: 'Delete Department',
      isDanger: true,
      action: () => {
        this.api.delete<any>(API_ENDPOINTS.SYSTEM.DEPARTMENT_BY_ID(d.id), {
          successMessage: 'Department deleted'
        }).subscribe({
          next: () => {
            this.confirmModal.update(s => ({ ...s, isOpen: false }));
            this.loadAll();
          }
        });
      }
    });
  }

  openCreateAreaModal(): void {
    this.areaForm.reset();
    this.isAreaModalOpen.set(true);
  }

  savePracticeArea(): void {
    if (this.areaForm.invalid) return;
    this.api.post<any>(API_ENDPOINTS.SYSTEM.PRACTICE_AREAS, this.areaForm.value, {
      successMessage: 'Practice area created'
    }).subscribe({
      next: () => {
        this.isAreaModalOpen.set(false);
        this.loadAll();
      }
    });
  }

  deletePracticeArea(p: any): void {
    this.confirmModal.set({
      isOpen: true,
      title: 'Delete Practice Area?',
      message: `Delete practice area ${p.name}?`,
      confirmText: 'Delete Area',
      isDanger: true,
      action: () => {
        this.api.delete<any>(API_ENDPOINTS.SYSTEM.PRACTICE_AREA_BY_ID(p.id), {
          successMessage: 'Practice area removed'
        }).subscribe({
          next: () => {
            this.confirmModal.update(s => ({ ...s, isOpen: false }));
            this.loadAll();
          }
        });
      }
    });
  }

  closeConfirmModal(): void {
    this.confirmModal.update(s => ({ ...s, isOpen: false }));
  }

  onConfirmModalAction(): void {
    const act = this.confirmModal().action;
    if (act) act();
  }
}
