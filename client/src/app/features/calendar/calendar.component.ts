import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { API_ENDPOINTS } from '../../core/constants/api-endpoints.constant';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent, ModalComponent],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toastService = inject(ToastService);

  readonly currentDate = signal<Date>(new Date());
  readonly hearings = signal<any[]>([]);
  readonly isLimitationModalOpen = signal<boolean>(false);

  // Limitation Calculator
  limitStartDate: string = new Date().toISOString().split('T')[0];
  limitDays: number = 30;
  calculatedDeadline: string = '';
  statuteProvision: string = 'Section 5, Limitation Act, 1908 / CPC Appeal';

  ngOnInit(): void {
    this.loadHearings();
    this.calculateLimitation();
  }

  loadHearings(): void {
    this.api.get<any>(API_ENDPOINTS.HEARINGS.BASE).subscribe({
      next: (res) => {
        this.hearings.set(res.data || []);
      }
    });
  }

  calculateLimitation(): void {
    if (!this.limitStartDate) return;
    const start = new Date(this.limitStartDate);
    const deadline = new Date(start.getTime() + this.limitDays * 24 * 60 * 60 * 1000);
    this.calculatedDeadline = deadline.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  openLimitationModal(): void {
    this.calculateLimitation();
    this.isLimitationModalOpen.set(true);
  }

  closeLimitationModal(): void {
    this.isLimitationModalOpen.set(false);
  }
}

