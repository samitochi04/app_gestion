import { Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: string | number;
  label: string;
}

/** Native <select> wrapper (kept native for accessibility + mobile support). */
@Component({
  selector: 'app-select',
  standalone: true,
  imports: [FormsModule],
  template: `
    <select
      class="select"
      [disabled]="disabled"
      [ngModel]="value"
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

  value: string | number | null = null;
  disabled = false;

  private onChangeFn: (v: string | number | null) => void = () => {};
  onTouched: () => void = () => {};

  onChange(v: string | number | null): void {
    this.value = v;
    this.onChangeFn(v);
  }

  writeValue(v: string | number | null): void { this.value = v; }
  registerOnChange(fn: (v: string | number | null) => void): void { this.onChangeFn = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
}
