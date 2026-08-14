import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: string | number;
  label: string;
}

/**
 * Native <select> wrapper (kept native for accessibility + mobile support).
 *
 * `value`/`disabled` are signals so a value written after first render (an
 * edit dialog whose option list or model resolves asynchronously) refreshes
 * the DOM under zoneless change detection.
 */
@Component({
  selector: 'app-select',
  standalone: true,
  imports: [FormsModule],
  template: `
    <select
      class="select"
      [disabled]="disabled()"
      [ngModel]="value()"
      (ngModelChange)="onChange($event)"
      (blur)="onTouched()"
    >
      @if (placeholder()) { <option [ngValue]="null" disabled>{{ placeholder() }}</option> }
      @for (opt of options(); track opt.value) {
        <option [ngValue]="opt.value">{{ opt.label }}</option>
      }
    </select>
  `,
  styleUrl: './select.css',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Select), multi: true },
  ],
})
export class Select implements ControlValueAccessor {
  options = input.required<SelectOption[]>();
  placeholder = input<string>('');

  value = signal<string | number | null>(null);
  disabled = signal(false);

  private onChangeFn: (v: string | number | null) => void = () => {};
  onTouched: () => void = () => {};

  onChange(v: string | number | null): void {
    this.value.set(v);
    this.onChangeFn(v);
  }

  writeValue(v: string | number | null): void { this.value.set(v); }
  registerOnChange(fn: (v: string | number | null) => void): void { this.onChangeFn = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled.set(isDisabled); }
}
