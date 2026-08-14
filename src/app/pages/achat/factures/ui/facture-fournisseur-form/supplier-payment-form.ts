import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DIALOG_REF, DialogRef } from '../../../../../core/services/dialog.service';
import { ApiError } from '../../../../../core/services/api.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../shared/ui/text-input/text-input';
import { Select } from '../../../../../shared/ui/select/select';
import { Button } from '../../../../../shared/ui/button/button';
import { formatMoney } from '../../../../../core/utils/format';
import { SUPPLIER_PAYMENT_METHODS, SupplierInvoice } from '../../data/supplier-invoice.model';
import { SupplierInvoiceService } from '../../data/supplier-invoice.service';

export interface SupplierPaymentFormData { invoice: SupplierInvoice; }

@Component({
  selector: 'app-supplier-payment-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, Select, Button],
  template: `
    <p class="t-caption" style="margin-bottom: var(--space-3);">
      Facture {{ data.invoice.reference }} — Reste à payer : <strong>{{ money(data.invoice.remainingAmount) }}</strong>
    </p>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <div class="row-2">
        <app-form-field label="Montant" [required]="true"
          [error]="submitted() && form.controls.amount.invalid ? 'Montant requis.' : ''">
          <app-text-input type="number" formControlName="amount" />
        </app-form-field>
        <app-form-field label="Mode de règlement" [required]="true">
          <app-select [options]="methods" formControlName="method" />
        </app-form-field>
      </div>
      <app-form-field label="Référence">
        <app-text-input formControlName="reference" />
      </app-form-field>
      <div class="form-actions">
        <app-button type="submit" [loading]="saving()">Enregistrer le règlement</app-button>
      </div>
    </form>
  `,
})
export class SupplierPaymentForm {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(SupplierInvoiceService);
  private readonly toast = inject(ToastService);

  data = inject(DIALOG_DATA) as SupplierPaymentFormData;
  ref = inject(DIALOG_REF) as DialogRef<boolean>;

  submitted = signal(false);
  saving = signal(false);
  methods = SUPPLIER_PAYMENT_METHODS;

  money(v: number | null | undefined): string { return formatMoney(v); }

  form = this.fb.group({
    amount: [this.data.invoice.remainingAmount ?? 0, [Validators.required, Validators.min(0.01)]],
    method: ['BANK_TRANSFER', Validators.required],
    reference: [''],
  });

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.service.recordPayment({
      supplierInvoiceId: this.data.invoice.id, amount: v.amount!, method: v.method!,
      reference: v.reference ?? undefined,
    }).subscribe({
      next: () => { this.toast.success('Règlement enregistré.'); this.ref.close(true); },
      error: (e) => { this.saving.set(false); this.toast.error(e instanceof ApiError ? e.message : 'Règlement impossible.'); },
    });
  }
}
