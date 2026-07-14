import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { DIALOG_DATA, DIALOG_REF, DialogRef } from '../../../../../core/services/dialog.service';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../shared/ui/text-input/text-input';
import { Select, SelectOption } from '../../../../../shared/ui/select/select';
import { Button } from '../../../../../shared/ui/button/button';
import { Invoice } from '../../data/invoice.model';
import { InvoiceActions } from '../../data/store/invoice.actions';
import { formatMoney } from '../../../../../core/utils/format';

export interface FacturePaymentFormData { invoice: Invoice; }

const METHODS: SelectOption[] = [
  { value: 'CASH', label: 'Espèces' },
  { value: 'BANK_TRANSFER', label: 'Virement bancaire' },
  { value: 'CHECK', label: 'Chèque' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'CARD', label: 'Carte bancaire' },
];

@Component({
  selector: 'app-facture-payment-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, Select, Button],
  templateUrl: './facture-payment-form.html',
  styleUrl: './facture-payment-form.css',
})
export class FacturePaymentForm {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);

  data = inject(DIALOG_DATA) as FacturePaymentFormData;
  ref = inject(DIALOG_REF) as DialogRef<boolean>;

  submitted = signal(false);
  methods = METHODS;

  money(v: number | null | undefined): string { return formatMoney(v); }

  form = this.fb.group({
    amount: [this.data.invoice.remainingAmount ?? 0, [Validators.required, Validators.min(0.01)]],
    method: ['CASH', Validators.required],
    reference: [''],
    notes: [''],
  });

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.store.dispatch(InvoiceActions.recordPayment({
      payload: {
        invoiceId: this.data.invoice.id, amount: v.amount!, method: v.method!,
        reference: v.reference ?? undefined, notes: v.notes ?? undefined,
      },
    }));
    this.ref.close(true);
  }
}
