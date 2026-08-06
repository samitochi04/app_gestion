import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DIALOG_DATA, DIALOG_REF, DialogRef } from '../../../core/services/dialog.service';
import { Button } from '../button/button';
import { FormField } from '../form-field/form-field';
import { TextInput } from '../text-input/text-input';

export interface PromptDialogData {
  label: string;
  message?: string;
  hint?: string;
  initialValue?: string;
  placeholder?: string;
  type?: 'text' | 'email';
  confirmLabel?: string;
  /** Reject empty input. Default true. */
  required?: boolean;
}

/**
 * Single-field prompt for the arguments several endpoints demand as query
 * parameters: the recipient address of `POST /invoices/{id}/send`, the reason
 * of a cancellation or a refund. Emits the value, or `undefined` if dismissed.
 */
@Component({
  selector: 'app-prompt-dialog',
  standalone: true,
  imports: [FormsModule, Button, FormField, TextInput],
  template: `
    <div class="prompt">
      @if (data.message) { <p class="t-body prompt__message">{{ data.message }}</p> }
      <app-form-field [label]="data.label" [hint]="data.hint ?? ''"
                      [error]="showError() ? 'Ce champ est requis.' : ''"
                      [required]="isRequired()">
        <app-text-input [type]="data.type ?? 'text'" [placeholder]="data.placeholder ?? ''"
                        [ngModel]="value()" (ngModelChange)="value.set($event)" />
      </app-form-field>
      <div class="prompt__actions">
        <app-button variant="secondary" (pressed)="ref.close()">Annuler</app-button>
        <app-button (pressed)="submit()">{{ data.confirmLabel ?? 'Valider' }}</app-button>
      </div>
    </div>
  `,
  styles: [`
    .prompt { display: flex; flex-direction: column; gap: var(--space-4); }
    .prompt__message { color: var(--color-text-secondary); }
    .prompt__actions { display: flex; justify-content: flex-end; gap: var(--space-2); }
  `],
})
export class PromptDialog {
  data = inject(DIALOG_DATA) as PromptDialogData;
  ref = inject(DIALOG_REF) as DialogRef<string>;

  readonly value = signal(this.data.initialValue ?? '');
  private readonly touched = signal(false);

  readonly isRequired = computed(() => this.data.required !== false);
  readonly showError = computed(() => this.touched() && this.isRequired() && !this.value().trim());

  submit(): void {
    this.touched.set(true);
    if (this.isRequired() && !this.value().trim()) return;
    this.ref.close(this.value().trim());
  }
}
