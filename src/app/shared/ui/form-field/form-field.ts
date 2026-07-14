import { Component, input } from '@angular/core';

/** Wraps a control with a label, optional hint, and error message. */
@Component({
  selector: 'app-form-field',
  standalone: true,
  template: `
    <div class="field">
      @if (label()) {
        <label class="field__label t-body-strong">
          {{ label() }}
          @if (required()) { <span class="field__required">*</span> }
        </label>
      }
      <ng-content />
      @if (error()) {
        <p class="field__error t-caption">{{ error() }}</p>
      } @else if (hint()) {
        <p class="field__hint t-caption">{{ hint() }}</p>
      }
    </div>
  `,
  styleUrl: './form-field.css',
})
export class FormField {
  label = input<string>('');
  hint = input<string>('');
  error = input<string>('');
  required = input<boolean>(false);
}
