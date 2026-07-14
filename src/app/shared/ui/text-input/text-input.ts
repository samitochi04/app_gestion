import { Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Text/email/password/number input wired as a standalone ControlValueAccessor. */
@Component({
  selector: 'app-text-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <input
      class="input"
      [type]="type()"
      [placeholder]="placeholder()"
      [disabled]="disabled"
      [autocomplete]="autocomplete()"
      [ngModel]="value"
      (ngModelChange)="onChange($event)"
      (blur)="onTouched()"
    />
  `,
  styleUrl: './text-input.css',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextInput), multi: true },
  ],
})
export class TextInput implements ControlValueAccessor {
  type = input<'text' | 'email' | 'password' | 'number' | 'tel'>('text');
  placeholder = input<string>('');
  /** e.g. 'email', 'current-password', 'new-password', 'off'. */
  autocomplete = input<string>('off');

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
