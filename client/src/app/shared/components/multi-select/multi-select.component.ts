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

export interface SelectOption {
  label: string;
  value: any;
  group?: string;
  description?: string;
  avatarText?: string;
  badge?: string;
  disabled?: boolean;
  [key: string]: any;
}

@Component({
  selector: 'app-multi-select',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './multi-select.component.html',
  styleUrls: ['./multi-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiSelectComponent),
      multi: true
    }
  ]
})
export class MultiSelectComponent implements ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() placeholder: string = 'Select options...';
  @Input() labelKey: string = 'label';
  @Input() valueKey: string = 'value';
  @Input() singleSelect: boolean = false;
  @Input() maxSelections?: number;
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() showAvatars: boolean = false;

  @Output() selectionChange = new EventEmitter<any>();

  readonly isOpen = signal<boolean>(false);
  readonly searchText = signal<string>('');
  readonly selectedValues = signal<any[]>([]);
  readonly activeIndex = signal<number>(-1);

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private readonly elementRef: ElementRef) {}

  readonly filteredOptions = computed(() => {
    const query = this.searchText().toLowerCase().trim();
    if (!query) return this.options;
    return this.options.filter(opt => {
      const label = String(opt[this.labelKey] || opt.label || '').toLowerCase();
      const desc = String(opt.description || '').toLowerCase();
      const group = String(opt.group || '').toLowerCase();
      return label.includes(query) || desc.includes(query) || group.includes(query);
    });
  });

  readonly groupedOptions = computed(() => {
    const list = this.filteredOptions();
    const groups: { [group: string]: SelectOption[] } = {};
    const unGrouped: SelectOption[] = [];

    list.forEach(opt => {
      if (opt.group) {
        if (!groups[opt.group]) groups[opt.group] = [];
        groups[opt.group].push(opt);
      } else {
        unGrouped.push(opt);
      }
    });

    return { groups, unGrouped };
  });

  readonly selectedOptions = computed(() => {
    const vals = this.selectedValues();
    return this.options.filter(opt => {
      const val = opt[this.valueKey] !== undefined ? opt[this.valueKey] : opt.value;
      return vals.includes(val);
    });
  });

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
      this.onTouched();
    }
  }

  isSelected(opt: SelectOption): boolean {
    const val = opt[this.valueKey] !== undefined ? opt[this.valueKey] : opt.value;
    return this.selectedValues().includes(val);
  }

  toggleOption(opt: SelectOption, event?: Event): void {
    if (event) event.stopPropagation();
    if (opt.disabled) return;

    const val = opt[this.valueKey] !== undefined ? opt[this.valueKey] : opt.value;

    if (this.singleSelect) {
      this.selectedValues.set([val]);
      this.propagateChange([val]);
      this.closeDropdown();
      return;
    }

    const current = [...this.selectedValues()];
    const index = current.indexOf(val);

    if (index > -1) {
      current.splice(index, 1);
    } else {
      if (this.maxSelections && current.length >= this.maxSelections) {
        return;
      }
      current.push(val);
    }

    this.selectedValues.set(current);
    this.propagateChange(current);
  }

  removeChip(opt: SelectOption, event: Event): void {
    event.stopPropagation();
    if (this.disabled) return;
    const val = opt[this.valueKey] !== undefined ? opt[this.valueKey] : opt.value;
    const current = this.selectedValues().filter(v => v !== val);
    this.selectedValues.set(current);
    this.propagateChange(current);
  }

  selectAll(): void {
    if (this.singleSelect) return;
    const allAvailable = this.filteredOptions()
      .filter(o => !o.disabled)
      .map(o => (o[this.valueKey] !== undefined ? o[this.valueKey] : o.value));

    const updated = Array.from(new Set([...this.selectedValues(), ...allAvailable]));
    const finalVals = this.maxSelections ? updated.slice(0, this.maxSelections) : updated;
    this.selectedValues.set(finalVals);
    this.propagateChange(finalVals);
  }

  clearAll(event?: Event): void {
    if (event) event.stopPropagation();
    if (this.disabled) return;
    this.selectedValues.set([]);
    this.propagateChange([]);
  }

  private propagateChange(val: any[]): void {
    const emitted = this.singleSelect ? (val.length > 0 ? val[0] : null) : val;
    this.onChange(emitted);
    this.selectionChange.emit(emitted);
  }

  // ControlValueAccessor
  writeValue(value: any): void {
    if (value === null || value === undefined) {
      this.selectedValues.set([]);
    } else if (Array.isArray(value)) {
      this.selectedValues.set(value);
    } else {
      this.selectedValues.set([value]);
    }
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

