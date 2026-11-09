import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, IconComponent],
  template: `
    <app-modal
      [isOpen]="isOpen"
      [title]="title"
      [maxWidth]="'480px'"
      [showFooter]="true"
      (close)="onCancel()"
    >
      <div class="confirm-modal-body">
        <div class="confirm-icon-box" [class.danger-icon]="isDanger">
          <app-icon [name]="isDanger ? 'alert-triangle' : 'info'" [size]="24" [color]="isDanger ? 'var(--danger)' : 'var(--primary)'"></app-icon>
        </div>
        <div class="confirm-text">
          <p class="confirm-message">{{ message }}</p>
          <ng-content></ng-content>
        </div>
      </div>

      <div slot="footer" class="confirm-modal-actions">
        <button class="btn btn-secondary" [disabled]="isLoading" (click)="onCancel()">
          {{ cancelText }}
        </button>
        <button
          class="btn"
          [class.btn-danger]="isDanger"
          [class.btn-primary]="!isDanger"
          [disabled]="isLoading"
          (click)="onConfirm()"
        >
          @if (isLoading) {
            <span class="spinner-small mr-1"></span>
          }
          {{ confirmText }}
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .confirm-modal-body {
      display: flex;
      gap: 1.25rem;
      align-items: flex-start;
      padding: 0.5rem 0;
    }
    .confirm-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(79, 70, 229, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .confirm-icon-box.danger-icon {
      background: rgba(239, 68, 68, 0.1);
    }
    .confirm-text {
      flex: 1;
    }
    .confirm-message {
      font-size: 0.9375rem;
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 0;
    }
    .confirm-modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      width: 100%;
    }
    .spinner-small {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ConfirmModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() isDanger = false;
  @Input() isLoading = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}

