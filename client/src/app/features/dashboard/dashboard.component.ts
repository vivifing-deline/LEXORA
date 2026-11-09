import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ApiService } from '../../core/services/api.service';
import { API_ENDPOINTS } from '../../core/constants/api-endpoints.constant';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IconComponent,
    StatCardComponent,
    LoadingSkeletonComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal<boolean>(true);
  readonly data = signal<any>(null);

  readonly pipelineStages = computed(() => {
    const raw: { stage: string; count: number }[] = this.data()?.charts?.casesByStage || [];
    const countFor = (keyword: string) => {
      const match = raw.find(r => r.stage && r.stage.toLowerCase().includes(keyword.toLowerCase()));
      return match ? match.count : 0;
    };
    return [
      { name: 'Filing', icon: 'file-text', count: countFor('Filing'), color: '#6366F1' },
      { name: 'Preliminary', icon: 'clock', count: countFor('Preliminary') + countFor('Notice') + countFor('Statement') + countFor('Onboarding'), color: '#3B82F6' },
      { name: 'Evidence', icon: 'database', count: countFor('Evidence'), color: '#8B5CF6' },
      { name: 'Arguments', icon: 'message-square', count: countFor('Arguments'), color: '#EC4899' },
      { name: 'Judgment', icon: 'gavel', count: countFor('Judgment') + countFor('Order'), color: '#10B981' },
      { name: 'Execution', icon: 'check-circle-2', count: countFor('Execution') + countFor('Appeal'), color: '#F59E0B' }
    ];
  });

  readonly urgentHearings = computed(() => {
    const d = this.data();
    if (!d || !d.widgets || !d.widgets.upcomingHearings) return [];
    const now = new Date();
    const threshold = new Date(now.getTime() + 48 * 3600 * 1000);
    return d.widgets.upcomingHearings.filter((h: any) => {
      const hDate = new Date(h.hearingDate);
      return hDate <= threshold;
    });
  });

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    this.api.get<any>(API_ENDPOINTS.DASHBOARD.METRICS).subscribe({
      next: (res) => {
        this.data.set(res.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  quickAction(action: string): void {
    switch (action) {
      case 'register-case':
        this.router.navigate(['/cases'], { queryParams: { openCreate: 'true' } });
        break;
      case 'docket-hearing':
        this.router.navigate(['/hearings'], { queryParams: { openSchedule: 'true' } });
        break;
      case 'record-payment':
        this.router.navigate(['/finance'], { queryParams: { tab: 'invoices', openPayment: 'true' } });
        break;
      case 'conflict-check':
        this.router.navigate(['/clients'], { queryParams: { openConflicts: 'true' } });
        break;
      case 'new-task':
        this.router.navigate(['/tasks'], { queryParams: { openCreate: 'true' } });
        break;
    }
  }

  navigateWithFilter(route: string, queryParams: any): void {
    this.router.navigate([route], { queryParams });
  }

  formatCurrency(val: number): string {
    return 'Rs. ' + (val || 0).toLocaleString();
  }
}
