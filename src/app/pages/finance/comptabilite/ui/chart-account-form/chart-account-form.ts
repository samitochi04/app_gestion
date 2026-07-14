import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DIALOG_REF, DialogRef } from '../../../../../core/services/dialog.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { ApiError } from '../../../../../core/services/api.service';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../shared/ui/text-input/text-input';
import { Button } from '../../../../../shared/ui/button/button';
import { ChartAccount } from '../../data/accounting.model';
import { AccountingService } from '../../data/accounting.service';

export interface ChartAccountFormData { account?: ChartAccount; }

@Component({
  selector: 'app-chart-account-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, Button],
  templateUrl: './chart-account-form.html',
})
export class ChartAccountForm {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AccountingService);
  private readonly toast = inject(ToastService);

  data = inject(DIALOG_DATA) as ChartAccountFormData;
  ref = inject(DIALOG_REF) as DialogRef<boolean>;
  isEdit = !!this.data?.account;
  submitted = signal(false);
  saving = signal(false);

  form = this.fb.group({
    code: [this.data?.account?.code ?? '', Validators.required],
    label: [this.data?.account?.label ?? '', Validators.required],
    accountClass: [this.data?.account?.accountClass ?? '', Validators.required],
    type: [this.data?.account?.type ?? '', Validators.required],
    parentCode: [this.data?.account?.parentCode ?? ''],
  });

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const payload = { code: v.code!, label: v.label!, accountClass: v.accountClass!, type: v.type!, parentCode: v.parentCode ?? undefined };
    this.saving.set(true);
    const req$ = this.isEdit ? this.service.chartUpdate(this.data.account!.id, payload) : this.service.chartCreate(payload);
    req$.subscribe({
      next: () => { this.toast.success(this.isEdit ? 'Compte modifié.' : 'Compte créé.'); this.ref.close(true); },
      error: (e) => { this.saving.set(false); this.toast.error(e instanceof ApiError ? e.message : 'Échec de l’enregistrement.'); },
    });
  }
}
