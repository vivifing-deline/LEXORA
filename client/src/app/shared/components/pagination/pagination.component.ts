import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="pagination-container" *ngIf="total > 0">
      <div class="pagination-info">
        <span>Showing <strong class="text-primary">{{ startItem }}</strong> to <strong class="text-primary">{{ endItem }}</strong> of <strong>{{ total }}</strong> records</span>
        <div class="page-size-selector">
          <label for="pageSizeSelect">Show</label>
          <select id="pageSizeSelect" class="size-select" [value]="limit" (change)="onLimitChange($event)">
            <option *ngFor="let opt of pageSizeOptions" [value]="opt">{{ opt }}</option>
          </select>
          <span>per page</span>
        </div>
      </div>

      <div class="pagination-controls" *ngIf="totalPages > 1">
        <button
          type="button"
          class="page-btn nav-btn"
          [disabled]="page <= 1"
          (click)="goToPage(page - 1)"
          title="Previous Page">
          <app-icon name="chevron-left" [size]="14"></app-icon>
          <span class="btn-label">Prev</span>
        </button>

        <div class="page-numbers">
          <ng-container *ngFor="let p of pages">
            <span *ngIf="p === -1" class="page-ellipsis">&hellip;</span>
            <button
              *ngIf="p !== -1"
              type="button"
              class="page-btn page-num-btn"
              [class.active]="p === page"
              (click)="goToPage(p)">
              {{ p }}
            </button>
          </ng-container>
        </div>

        <button
          type="button"
          class="page-btn nav-btn"
          [disabled]="page >= totalPages"
          (click)="goToPage(page + 1)"
          title="Next Page">
          <span class="btn-label">Next</span>
          <app-icon name="chevron-right" [size]="14"></app-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .pagination-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: var(--bg-surface);
      border-top: 1px solid var(--border-subtle);
      font-size: 12.5px;
      color: var(--text-secondary);
    }

    .pagination-info {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      flex-wrap: wrap;

      strong {
        color: var(--text-primary);
        font-weight: 600;
      }
    }

    .page-size-selector {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 12px;
      color: var(--text-muted);

      .size-select {
        padding: 0.2rem 0.5rem;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-subtle);
        background: var(--bg-surface-secondary);
        color: var(--text-primary);
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        outline: none;

        &:focus {
          border-color: var(--primary);
        }
      }
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .page-numbers {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .page-btn {
      min-width: 28px;
      height: 28px;
      padding: 0 0.45rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      background: var(--bg-surface-secondary);
      color: var(--text-secondary);
      font-size: 12px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover:not(:disabled):not(.active) {
        background: var(--bg-hover);
        color: var(--text-primary);
        border-color: var(--border-focus);
      }

      &.active {
        background: var(--primary);
        color: #ffffff;
        border-color: var(--primary);
        font-weight: 700;
        box-shadow: 0 2px 6px var(--primary-glow);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    .nav-btn {
      padding: 0 0.55rem;
    }

    .page-ellipsis {
      padding: 0 0.25rem;
      color: var(--text-muted);
      font-size: 13px;
    }

    @media (max-width: 640px) {
      .pagination-container {
        flex-direction: column;
        align-items: stretch;
      }
      .pagination-controls {
        justify-content: center;
      }
    }
  `]
})
export class PaginationComponent {
  @Input() page: number = 1;
  @Input() limit: number = 10;
  @Input() total: number = 0;
  @Input() totalPages: number = 1;
  @Input() pageSizeOptions: number[] = [10, 25, 50, 100];

  @Output() pageChange = new EventEmitter<number>();
  @Output() limitChange = new EventEmitter<number>();

  get startItem(): number {
    if (this.total === 0) return 0;
    return (this.page - 1) * this.limit + 1;
  }

  get endItem(): number {
    return Math.min(this.page * this.limit, this.total);
  }

  get pages(): number[] {
    const current = this.page;
    const total = this.totalPages;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: number[] = [];
    pages.push(1);

    if (current > 3) {
      pages.push(-1); // ellipsis
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push(-1); // ellipsis
    }

    pages.push(total);
    return pages;
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages && p !== this.page) {
      this.pageChange.emit(p);
    }
  }

  onLimitChange(event: Event): void {
    const val = Number((event.target as HTMLSelectElement).value);
    if (val && val !== this.limit) {
      this.limitChange.emit(val);
    }
  }
}

