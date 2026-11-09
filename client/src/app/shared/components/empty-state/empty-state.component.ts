import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="empty-state-card">
      <div class="empty-icon-wrapper">
        <app-icon [name]="icon || 'folder'" [size]="32" color="var(--primary)"></app-icon>
      </div>
      <h4 class="empty-title">{{ title }}</h4>
      <p class="empty-description">{{ description }}</p>
      @if (actionText) {
        <button class="btn btn-primary btn-sm mt-3" (click)="action.emit()">
          @if (actionIcon) {
            <app-icon [name]="actionIcon" [size]="14"></app-icon>
          }
          {{ actionText }}
        </button>
      }
    </div>
  `,
  styles: [`
    .empty-state-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3.5rem 1.5rem;
      border: 1px dashed var(--border-strong);
      border-radius: var(--radius-lg);
      background: var(--bg-surface-secondary);
    }
    .empty-icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-full);
      background: var(--primary-light);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }
    .empty-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.35rem;
    }
    .empty-description {
      font-size: 13px;
      color: var(--text-muted);
      max-width: 360px;
      line-height: 1.5;
    }
    .mt-3 {
      margin-top: 1.25rem;
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon?: string;
  @Input() title: string = 'No records found';
  @Input() description: string = 'There are currently no items to display in this view.';
  @Input() actionText?: string;
  @Input() actionIcon?: string;

  @Output() action = new EventEmitter<void>();
}

