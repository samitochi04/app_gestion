import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Native date input (ISO yyyy-MM-dd in/out) — matches backend LocalDate fields. */
@Component({
  selector: 'app-date-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <input
      type="date"
      class="date-input"
      [disabled]="disabled"
      [ngModel]="value"
      (ngModelChange)="onChange($event)"
      (blur)="onTouched()"
    />
  `,
  styleUrl: './date-input.css',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateInput), multi: true },
  ],
})
export class DateInput implements ControlValueAccessor {
  value = '';
  disabled = false;

  private onChangeFn: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  onChange(v: string): void {
    this.value = v;
    this.onChangeFn(v);
  }

  writeValue(v: string): void { this.value = v ?? ''; }
  registerOnChange(fn: (v: string) => void): void { this.onChangeFn = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
}
