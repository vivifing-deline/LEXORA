import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constant';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SubscriptionManagerService } from '../../../core/services/subscription-manager.service';

@Component({
  selector: 'app-case-detail',
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
    LoadingSkeletonComponent,
    EmptyStateComponent
  ],
  templateUrl: './case-detail.component.html',
  styleUrls: ['./case-detail.component.scss']
})
export class CaseDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly subManager = inject(SubscriptionManagerService);
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly caseId = signal<string>('');
  readonly caseData = signal<any>(null);
  readonly isLoading = signal<boolean>(true);
  readonly activeTab = signal<string>('overview');

  // Modals
  readonly isHearingModalOpen = signal<boolean>(false);
  readonly isDiaryModalOpen = signal<boolean>(false);
  readonly isProceedingModalOpen = signal<boolean>(false);
  readonly selectedHearing = signal<any>(null);

  // Close Case Modal
  readonly isCloseModalOpen = signal<boolean>(false);
  readonly closeForm = this.fb.group({
    reason: ['Disposed off / Final decree in favour of client', [Validators.required]]
  });

  // Delete Case Confirm
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly isDeleting = signal<boolean>(false);

  // Party Modal
  readonly isPartyModalOpen = signal<boolean>(false);
  readonly partyForm = this.fb.group({
    name: ['', [Validators.required]],
    partyType: ['individual', [Validators.required]],
    role: ['Defendant', [Validators.required]],
    advocate: [''],
    contactInfo: [''],
    notes: ['']
  });
  readonly isDeletePartyModalOpen = signal<boolean>(false);
  readonly partyToDelete = signal<any>(null);

  // Legal Reference Modal
  readonly isReferenceModalOpen = signal<boolean>(false);
  readonly refForm = this.fb.group({
    title: ['', [Validators.required]],
    citation: ['', [Validators.required]],
    court: ['Supreme Court of Pakistan'],
    year: [2024],
    relevantProvisions: [''],
    summary: ['']
  });

  readonly hearingForm = this.fb.group({
    hearingDate: ['', [Validators.required]],
    hearingTime: ['09:30 AM'],
    courtroom: [''],
    purpose: ['', [Validators.required]],
    bench: ['']
  });

  readonly proceedingForm = this.fb.group({
    status: ['completed', [Validators.required]],
    proceedingsSummary: ['', [Validators.required]],
    orderPassed: [''],
    adjournmentReason: [''],
    nextHearingDate: [''],
    nextHearingPurpose: [''],
    diaryNotes: ['']
  });

  readonly diaryForm = this.fb.group({
    proceedings: ['', [Validators.required]],
    courtObservations: [''],
    argumentsMade: [''],
    ordersPassed: [''],
    nextSteps: [''],
    privateNotes: ['']
  });

  readonly allStages = [
    'Consultation', 'Client Onboarding', 'Preparation', 'Filing',
    'Notice / Summons', 'Written Statement / Response', 'Issues',
    'Evidence', 'Arguments', 'Judgment', 'Appeal', 'Execution', 'Closed'
  ];

  ngOnInit(): void {
    this.subManager.add(
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.caseId.set(id);
          this.loadCaseDetails();
        }
      })
    );
  }

  loadCaseDetails(): void {
    this.isLoading.set(true);
    this.api.get<any>(API_ENDPOINTS.CASES.BY_ID(this.caseId())).pipe(this.subManager.untilDestroyed()).subscribe({
      next: (res) => {
        this.caseData.set(res.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  updateStage(newStage: string): void {
    if (newStage === this.caseData()?.currentStage) return;

    this.api.put<any>(API_ENDPOINTS.CASES.BY_ID(this.caseId()), {
      currentStage: newStage
    }, {
      successMessage: `Case transitioned to: ${newStage}`
    }).subscribe({
      next: () => this.loadCaseDetails()
    });
  }

  // Close & Reopen Case
  openCloseModal(): void {
    this.isCloseModalOpen.set(true);
  }

  closeCloseModal(): void {
    this.isCloseModalOpen.set(false);
  }

  submitCloseCase(): void {
    if (this.closeForm.invalid) return;

    this.api.post<any>(API_ENDPOINTS.CASES.CLOSE(this.caseId()), this.closeForm.value, {
      successMessage: 'Case closed successfully'
    }).subscribe({
      next: () => {
        this.closeCloseModal();
        this.loadCaseDetails();
      }
    });
  }

  reopenCase(): void {
    this.api.post<any>(API_ENDPOINTS.CASES.REOPEN(this.caseId()), {}, {
      successMessage: 'Case reopened and restored to active docket'
    }).subscribe({
      next: () => this.loadCaseDetails()
    });
  }

  // Delete Case
  openDeleteModal(): void {
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
  }

  confirmDeleteCase(): void {
    this.isDeleting.set(true);
    this.api.delete<any>(API_ENDPOINTS.CASES.BY_ID(this.caseId()), {
      successMessage: 'Case deleted successfully'
    }).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        this.router.navigate(['/cases']);
      },
      error: () => {
        this.isDeleting.set(false);
      }
    });
  }

  // Case Parties
  openPartyModal(): void {
    this.partyForm.reset({
      name: '',
      partyType: 'individual',
      role: 'Defendant',
      advocate: '',
      contactInfo: '',
      notes: ''
    });
    this.isPartyModalOpen.set(true);
  }

  closePartyModal(): void {
    this.isPartyModalOpen.set(false);
  }

  submitParty(): void {
    if (this.partyForm.invalid) {
      this.partyForm.markAllAsTouched();
      return;
    }

    this.api.post<any>(API_ENDPOINTS.CASES.PARTIES(this.caseId()), this.partyForm.value, {
      successMessage: 'Case party added successfully'
    }).subscribe({
      next: () => {
        this.closePartyModal();
        this.loadCaseDetails();
      }
    });
  }

  openDeletePartyModal(party: any): void {
    this.partyToDelete.set(party);
    this.isDeletePartyModalOpen.set(true);
  }

  closeDeletePartyModal(): void {
    this.isDeletePartyModalOpen.set(false);
    this.partyToDelete.set(null);
  }

  confirmDeleteParty(): void {
    const p = this.partyToDelete();
    if (!p) return;

    this.api.delete<any>(`${API_ENDPOINTS.CASES.PARTIES(this.caseId())}/${p.id}`, {
      successMessage: 'Party removed'
    }).subscribe({
      next: () => {
        this.closeDeletePartyModal();
        this.loadCaseDetails();
      }
    });
  }

  // Legal Reference
  openReferenceModal(): void {
    this.refForm.reset({
      title: '',
      citation: '',
      court: 'Supreme Court of Pakistan',
      year: 2024,
      relevantProvisions: '',
      summary: ''
    });
    this.isReferenceModalOpen.set(true);
  }

  closeReferenceModal(): void {
    this.isReferenceModalOpen.set(false);
  }

  submitReference(): void {
    if (this.refForm.invalid) {
      this.refForm.markAllAsTouched();
      return;
    }

    this.api.post<any>(`${API_ENDPOINTS.CASES.BY_ID(this.caseId())}/references`, this.refForm.value, {
      successMessage: 'Legal reference / precedent linked to case'
    }).subscribe({
      next: () => {
        this.closeReferenceModal();
        this.loadCaseDetails();
      }
    });
  }

  unlinkReference(refId: string): void {
    this.api.delete<any>(`${API_ENDPOINTS.CASES.BY_ID(this.caseId())}/references/${refId}`, {
      successMessage: 'Legal reference unlinked'
    }).subscribe({
      next: () => this.loadCaseDetails()
    });
  }

  // Hearing Scheduling
  openHearingModal(): void {
    this.hearingForm.reset({
      hearingDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      hearingTime: '09:30 AM',
      courtroom: this.caseData()?.court?.roomNumber || 'Courtroom 3',
      purpose: 'Hearing on Merits',
      bench: 'Single Bench'
    });
    this.isHearingModalOpen.set(true);
  }

  closeHearingModal(): void {
    this.isHearingModalOpen.set(false);
  }

  scheduleHearing(): void {
    if (this.hearingForm.invalid) {
      this.hearingForm.markAllAsTouched();
      return;
    }

    const payload = {
      ...this.hearingForm.value,
      caseId: this.caseId(),
      courtId: this.caseData()?.courtId,
      assignedAdvocateId: this.caseData()?.assignments?.[0]?.userId
    };

    this.api.post<any>(API_ENDPOINTS.HEARINGS.BASE, payload, {
      successMessage: 'Court hearing scheduled successfully'
    }).subscribe({
      next: () => {
        this.closeHearingModal();
        this.loadCaseDetails();
      }
    });
  }

  // Record Proceedings
  openProceedingModal(hearing: any): void {
    this.selectedHearing.set(hearing);
    this.proceedingForm.reset({
      status: 'completed',
      proceedingsSummary: '',
      orderPassed: '',
      adjournmentReason: '',
      nextHearingDate: '',
      nextHearingPurpose: '',
      diaryNotes: ''
    });
    this.isProceedingModalOpen.set(true);
  }

  closeProceedingModal(): void {
    this.isProceedingModalOpen.set(false);
    this.selectedHearing.set(null);
  }

  submitProceeding(): void {
    if (this.proceedingForm.invalid) {
      this.proceedingForm.markAllAsTouched();
      return;
    }

    const hearingId = this.selectedHearing()?.id;
    if (!hearingId) return;

    this.api.put<any>(API_ENDPOINTS.HEARINGS.BY_ID(hearingId), this.proceedingForm.value, {
      successMessage: 'Hearing proceedings recorded and diary updated'
    }).subscribe({
      next: () => {
        this.closeProceedingModal();
        this.loadCaseDetails();
      }
    });
  }

  // Diary Entry
  openDiaryModal(): void {
    this.diaryForm.reset();
    this.isDiaryModalOpen.set(true);
  }

  closeDiaryModal(): void {
    this.isDiaryModalOpen.set(false);
  }

  submitDiaryEntry(): void {
    if (this.diaryForm.invalid) {
      this.diaryForm.markAllAsTouched();
      return;
    }

    const payload = {
      status: 'scheduled',
      diaryNotes: this.diaryForm.value.privateNotes || this.diaryForm.value.proceedings,
      proceedingsSummary: this.diaryForm.value.proceedings,
      orderPassed: this.diaryForm.value.ordersPassed
    };

    const firstHearingId = this.caseData()?.hearings?.[0]?.id;
    if (firstHearingId) {
      this.api.put<any>(API_ENDPOINTS.HEARINGS.BY_ID(firstHearingId), payload, {
        successMessage: 'Case diary entry recorded'
      }).subscribe({
        next: () => {
          this.closeDiaryModal();
          this.loadCaseDetails();
        }
      });
    } else {
      this.toastService.info('Please schedule a hearing first to attach diary notes');
      this.closeDiaryModal();
    }
  }

  formatCurrency(val: number): string {
    return 'Rs. ' + (val || 0).toLocaleString();
  }

  getDownloadUrl(docId: string): string {
    return this.api.getAbsoluteUrl(API_ENDPOINTS.DOCUMENTS.DOWNLOAD(docId));
  }
}
