import { Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Native date input (ISO yyyy-MM-dd in/out) — matches backend LocalDate fields.
 *
 * `value`/`disabled` are signals so a value patched after first render (e.g. an
 * edit dialog whose model resolves asynchronously) refreshes the DOM under
 * zoneless change detection.
 */
@Component({
  selector: 'app-date-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <input
      type="date"
      class="date-input"
      [disabled]="disabled()"
      [ngModel]="value()"
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
  value = signal<string>('');
  disabled = signal(false);

  private onChangeFn: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  onChange(v: string): void {
    this.value.set(v);
    this.onChangeFn(v);
  }

  writeValue(v: string): void { this.value.set(v ?? ''); }
  registerOnChange(fn: (v: string) => void): void { this.onChangeFn = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled.set(isDisabled); }
}
