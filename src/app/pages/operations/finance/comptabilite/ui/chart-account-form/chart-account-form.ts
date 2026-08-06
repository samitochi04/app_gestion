import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DIALOG_REF, DialogRef } from '../../../../../../core/services/dialog.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { ApiError } from '../../../../../../core/services/api.service';
import { FormField } from '../../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../../shared/ui/text-input/text-input';
import { Button } from '../../../../../../shared/ui/button/button';
import { ChartAccount } from '../../data/accounting.model';
import { AccountingService } from '../../data/accounting.service';

export interface ChartAccountFormData { account?: ChartAccount; }

/**
 * Creation posts `code`/`label`/`parentCode`/`isParent` as **query parameters**
 * (the backend derives the class from the code); update only takes `label`.
 */
@Component({
  selector: 'app-chart-account-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, Button],
  templateUrl: './chart-account-form.html',
  styles: [`
    .ca-note { margin: 0 0 var(--space-4); }
    .ca-checkbox { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-4); cursor: pointer; }
  `],
})
export class ChartAccountForm {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AccountingService);
  private readonly toast = inject(ToastService);

  data = inject(DIALOG_DATA) as ChartAccountFormData | null;
  ref = inject(DIALOG_REF) as DialogRef<boolean>;
  isEdit = !!this.data?.account;
  submitted = signal(false);
  saving = signal(false);

  form = this.fb.group({
    code: [
      { value: this.data?.account?.code ?? '', disabled: this.isEdit },
      [Validators.required, Validators.pattern(/^\d{1,7}$/)],
    ],
    label: [this.data?.account?.label ?? '', Validators.required],
    parentCode: [{ value: this.data?.account?.parentCode ?? '', disabled: this.isEdit }],
    isParent: [this.data?.account?.isParent ?? false],
  });

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.saving.set(true);

    const request$ = this.isEdit
      ? this.service.chartUpdate(this.data!.account!.id, v.label!)
      : this.service.chartCreate({
          code: v.code!,
          label: v.label!,
          parentCode: v.parentCode || undefined,
          isParent: v.isParent ?? false,
        });

    request$.subscribe({
      next: () => { this.toast.success(this.isEdit ? 'Compte modifié.' : 'Compte créé.'); this.ref.close(true); },
      error: (e) => { this.saving.set(false); this.toast.error(e instanceof ApiError ? e.message : 'Échec de l’enregistrement.'); },
    });
  }
}
