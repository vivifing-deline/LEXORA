import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';
import { ApiService } from '../../core/services/api.service';
import { API_ENDPOINTS } from '../../core/constants/api-endpoints.constant';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, IconComponent, LoadingSkeletonComponent, PaginationComponent],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toastService = inject(ToastService);

  readonly isLoading = signal<boolean>(true);
  readonly reportType = signal<'cases' | 'finance' | 'workload'>('cases');
  readonly reportData = signal<any>(null);

  readonly page = signal<number>(1);
  readonly limit = signal<number>(10);

  readonly currentList = computed<any[]>(() => {
    const data = this.reportData();
    if (!data) return [];
    if (this.reportType() === 'cases') return Array.isArray(data) ? data : [];
    if (this.reportType() === 'finance') return Array.isArray(data.invoices) ? data.invoices : [];
    if (this.reportType() === 'workload') return Array.isArray(data) ? data : [];
    return [];
  });

  readonly total = computed<number>(() => this.currentList().length);

  readonly totalPages = computed<number>(() => {
    const t = this.total();
    const l = this.limit();
    return Math.max(1, Math.ceil(t / l));
  });

  readonly paginatedRows = computed<any[]>(() => {
    const list = this.currentList();
    const start = (this.page() - 1) * this.limit();
    return list.slice(start, start + this.limit());
  });

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.isLoading.set(true);
    this.api.get<any>(API_ENDPOINTS.SYSTEM.REPORTS, { type: this.reportType() }).subscribe({
      next: (res) => {
        this.reportData.set(res.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  setReportType(type: 'cases' | 'finance' | 'workload'): void {
    this.reportType.set(type);
    this.page.set(1);
    this.loadReport();
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
  }

  onLimitChange(newLimit: number): void {
    this.limit.set(newLimit);
    this.page.set(1);
  }

  exportCsv(): void {
    const exportUrl = `${this.api.getAbsoluteUrl(API_ENDPOINTS.SYSTEM.REPORTS_EXPORT)}?module=cases`;
    window.open(exportUrl, '_blank');
    this.toastService.success('CSV export started');
  }

  printReport(): void {
    window.print();
  }

  formatCurrency(val: number): string {
    return 'Rs. ' + (val || 0).toLocaleString();
  }
}
