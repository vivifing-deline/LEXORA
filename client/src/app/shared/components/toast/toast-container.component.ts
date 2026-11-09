import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="toast-wrapper">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-card" [ngClass]="'toast-' + toast.type">
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') { <app-icon name="check" [size]="18" color="#16A34A"></app-icon> }
              @case ('error') { <app-icon name="alert-circle" [size]="18" color="#EF4444"></app-icon> }
              @case ('warning') { <app-icon name="alert-triangle" [size]="18" color="#F59E0B"></app-icon> }
              @default { <app-icon name="info" [size]="18" color="#0284C7"></app-icon> }
            }
          </div>
          <div class="toast-content">
            @if (toast.title) {
              <div class="toast-title">{{ toast.title }}</div>
            }
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" (click)="toastService.remove(toast.id)" title="Dismiss">
            <app-icon name="x" [size]="14"></app-icon>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-wrapper {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 380px;
      width: 100%;
      pointer-events: none;
    }
    .toast-card {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      padding: 0.85rem 1rem;
      border-radius: var(--radius-md);
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      box-shadow: var(--shadow-lg);
      animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      transition: all 0.2s ease;
    }
    .toast-success { border-left: 4px solid var(--success); }
    .toast-error { border-left: 4px solid var(--danger); }
    .toast-warning { border-left: 4px solid var(--warning); }
    .toast-info { border-left: 4px solid var(--info); }

    .toast-icon {
      margin-top: 2px;
      flex-shrink: 0;
    }
    .toast-content {
      flex: 1;
      min-width: 0;
    }
    .toast-title {
      font-weight: 600;
      font-size: 13px;
      color: var(--text-primary);
      margin-bottom: 2px;
    }
    .toast-message {
      font-size: 12.5px;
      color: var(--text-secondary);
      line-height: 1.4;
    }
    .toast-close {
      color: var(--text-muted);
      padding: 4px;
      border-radius: 4px;
      transition: color 0.15s ease;
      &:hover {
        color: var(--text-primary);
      }
    }
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `]
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}

