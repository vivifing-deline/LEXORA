import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ElementRef,
  HostListener,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

export interface CustomSelectOption {
  label: string;
  value: any;
  icon?: string;
  dotColor?: string;
  badge?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div
      class="custom-select-wrapper"
      [class.is-open]="isOpen()"
      [class.is-disabled]="disabled"
      [class.variant-filter]="variant === 'filter'"
      [class.variant-form]="variant === 'form'"
      [style.min-width]="minWidth || null"
    >
      <!-- Dropdown Trigger Button -->
      <button
        type="button"
        class="custom-select-trigger"
        (click)="toggleDropdown()"
        [disabled]="disabled"
      >
        <div class="trigger-content">
          @if (selectedOption()?.dotColor) {
            <span class="status-dot" [style.background-color]="selectedOption()?.dotColor"></span>
          } @else if (selectedOption()?.icon) {
            <app-icon [name]="selectedOption()!.icon!" [size]="14" color="var(--text-secondary)"></app-icon>
          }
          <span class="trigger-label" [class.is-placeholder]="!selectedOption()">
            {{ selectedOption() ? selectedOption()!.label : placeholder }}
          </span>
        </div>

        <div class="trigger-chevron">
          <app-icon name="chevron-down" [size]="14" [customClass]="isOpen() ? 'rotate-180' : ''"></app-icon>
        </div>
      </button>

      <!-- Floating Dropdown List Panel -->
      @if (isOpen()) {
        <div class="custom-select-dropdown" (click)="$event.stopPropagation()">
          @if (showSearch && options.length > 5) {
            <div class="dropdown-search-box">
              <app-icon name="search" [size]="14" color="var(--text-muted)"></app-icon>
              <input
                type="text"
                class="dropdown-search-input"
                placeholder="Search..."
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
                autofocus
              />
              @if (searchQuery()) {
                <button type="button" class="clear-search-btn" (click)="searchQuery.set('')">
                  <app-icon name="x" [size]="12"></app-icon>
                </button>
              }
            </div>
          }

          <div class="dropdown-list-viewport">
            @if (filteredOptions().length === 0) {
              <div class="dropdown-empty">
                <app-icon name="info" [size]="15" color="var(--text-muted)"></app-icon>
                <span>No options match</span>
              </div>
            } @else {
              @for (opt of filteredOptions(); track opt.value) {
                <div
                  class="dropdown-item"
                  [class.is-selected]="isSelected(opt)"
                  [class.is-disabled]="opt.disabled"
                  (click)="selectOption(opt)"
                >
                  <div class="item-left">
                    @if (opt.dotColor) {
                      <span class="status-dot" [style.background-color]="opt.dotColor"></span>
                    } @else if (opt.icon) {
                      <app-icon [name]="opt.icon" [size]="14" [color]="isSelected(opt) ? 'var(--primary)' : 'var(--text-secondary)'"></app-icon>
                    }
                    <span class="item-label">{{ opt.label }}</span>
                  </div>

                  <div class="item-right">
                    @if (opt.badge) {
                      <span class="badge badge-neutral text-xs">{{ opt.badge }}</span>
                    }
                    @if (isSelected(opt)) {
                      <div class="item-check">
                        <app-icon name="check" [size]="14" color="var(--primary)"></app-icon>
                      </div>
                    }
                  </div>
                </div>
              }
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .custom-select-wrapper {
      position: relative;
      display: inline-block;
      width: 100%;
      user-select: none;
    }

    .custom-select-trigger {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      border: 1px solid var(--border-subtle);
      background-color: var(--bg-surface);
      color: var(--text-primary);
      cursor: pointer;
      font-family: inherit;
      transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
      text-align: left;

      &:hover:not(:disabled) {
        border-color: var(--border-strong);
        background-color: var(--bg-hover);
      }

      &:focus-visible {
        outline: none;
        border-color: var(--border-focus);
        box-shadow: 0 0 0 3px var(--primary-glow);
      }
    }

    .is-open .custom-select-trigger {
      border-color: var(--border-focus);
      box-shadow: 0 0 0 3px var(--primary-glow);
      background-color: var(--bg-surface);
    }

    /* Variant Filter (Compact for table toolbars) */
    .variant-filter {
      width: auto;

      .custom-select-trigger {
        padding: 0.45rem 0.75rem;
        font-size: 12.5px;
        font-weight: 500;
        border-radius: var(--radius-sm);
        min-width: 140px;
      }
    }

    /* Variant Form (Full-width for modals & forms) */
    .variant-form {
      .custom-select-trigger {
        padding: 0.62rem 0.85rem;
        font-size: 13.5px;
        font-weight: 500;
        border-radius: var(--radius-md);
      }
    }

    .trigger-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 0;
      flex: 1;
    }

    .trigger-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--text-primary);

      &.is-placeholder {
        color: var(--text-muted);
      }
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: var(--radius-full);
      flex-shrink: 0;
    }

    .trigger-chevron {
      color: var(--text-muted);
      display: flex;
      align-items: center;
      transition: transform 0.2s ease;
    }

    .rotate-180 {
      transform: rotate(180deg);
    }

    /* Floating Dropdown List Panel */
    .custom-select-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      min-width: 100%;
      width: max-content;
      max-width: 320px;
      background: var(--bg-surface-elevated);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      box-shadow: 0 16px 36px -6px rgba(15, 23, 42, 0.16), 0 6px 14px -3px rgba(15, 23, 42, 0.08);
      z-index: 600;
      animation: dropdownFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
      overflow: hidden;
    }

    @keyframes dropdownFadeIn {
      from {
        opacity: 0;
        transform: translateY(-6px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .dropdown-search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.45rem 0.65rem;
      border-bottom: 1px solid var(--border-subtle);
      background: var(--bg-surface-secondary);
    }

    .dropdown-search-input {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: 12.5px;
      color: var(--text-primary);
    }

    .clear-search-btn {
      color: var(--text-muted);
      display: flex;
      align-items: center;
      padding: 2px;
      &:hover { color: var(--text-primary); }
    }

    .dropdown-list-viewport {
      max-height: 250px;
      overflow-y: auto;
      padding: 0.35rem;
    }

    .dropdown-empty {
      padding: 1.25rem 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 12px;
      color: var(--text-muted);
    }

    /* Option Item in the List */
    .dropdown-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.55rem 0.75rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 13px;
      color: var(--text-primary);
      transition: all 0.15s ease;
      margin: 1px 0;

      &:hover:not(.is-disabled) {
        background-color: var(--bg-hover);
        transform: translateX(2px);
      }

      &.is-selected {
        background-color: var(--primary-light);
        color: var(--primary);
        font-weight: 600;

        .item-label {
          color: var(--primary);
        }
      }

      &.is-disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .item-left {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      min-width: 0;
      flex: 1;
    }

    .item-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .item-check {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true
    }
  ]
})
export class CustomSelectComponent implements ControlValueAccessor {
  @Input() options: CustomSelectOption[] = [];
  @Input() placeholder: string = 'Select...';
  @Input() variant: 'filter' | 'form' = 'filter';
  @Input() minWidth?: string;
  @Input() showSearch: boolean = false;
  @Input() disabled: boolean = false;

  @Output() valueChange = new EventEmitter<any>();
  @Output() selectionChange = new EventEmitter<CustomSelectOption>();

  readonly isOpen = signal<boolean>(false);
  readonly selectedValue = signal<any>(null);
  readonly searchQuery = signal<string>('');

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private readonly elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    this.closeDropdown();
  }

  readonly filteredOptions = computed(() => {
    const q = (this.searchQuery() || '').toLowerCase().trim();
    if (!q) return this.options;
    return this.options.filter(o => (o && o.label ? String(o.label).toLowerCase().includes(q) : false));
  });

  readonly selectedOption = computed(() => {
    const val = this.selectedValue();
    if (val === null || val === undefined) return null;
    return this.options.find(o => o.value === val) || null;
  });

  toggleDropdown(): void {
    if (this.disabled) return;
    this.isOpen.update(v => !v);
    if (!this.isOpen()) {
      this.onTouched();
    }
  }

  closeDropdown(): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
      this.searchQuery.set('');
      this.onTouched();
    }
  }

  isSelected(opt: CustomSelectOption): boolean {
    return this.selectedValue() === opt.value;
  }

  selectOption(opt: CustomSelectOption): void {
    if (opt.disabled) return;
    this.selectedValue.set(opt.value);
    this.onChange(opt.value);
    this.valueChange.emit(opt.value);
    this.selectionChange.emit(opt);
    this.closeDropdown();
  }

  // ControlValueAccessor
  writeValue(value: any): void {
    this.selectedValue.set(value);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

