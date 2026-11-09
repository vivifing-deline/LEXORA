import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-wrapper">
      @switch (type) {
        @case ('table') {
          <div class="skeleton-table">
            <div class="skeleton-row skeleton-header"></div>
            @for (i of rowsArray; track i) {
              <div class="skeleton-row"></div>
            }
          </div>
        }
        @case ('cards') {
          <div class="skeleton-grid">
            @for (i of rowsArray; track i) {
              <div class="skeleton-card"></div>
            }
          </div>
        }
        @default {
          <div class="skeleton-block" [style.height]="height" [style.width]="width"></div>
        }
      }
    </div>
  `,
  styles: [`
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .skeleton-block, .skeleton-row, .skeleton-card {
      background: linear-gradient(90deg, var(--bg-hover) 25%, var(--bg-surface-elevated) 50%, var(--bg-hover) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--radius-sm);
    }
    .skeleton-table {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      width: 100%;
    }
    .skeleton-header {
      height: 40px;
      opacity: 0.8;
    }
    .skeleton-row {
      height: 48px;
    }
    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
      width: 100%;
    }
    .skeleton-card {
      height: 120px;
    }
  `]
})
export class LoadingSkeletonComponent {
  @Input() type: 'block' | 'table' | 'cards' = 'block';
  @Input() rows: number = 4;
  @Input() height: string = '20px';
  @Input() width: string = '100%';

  get rowsArray(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }
}
