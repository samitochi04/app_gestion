import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { DIALOG_DATA, DIALOG_REF, DialogRef } from '../../../../../../core/services/dialog.service';
import { FormField } from '../../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../../shared/ui/text-input/text-input';
import { Select, SelectOption } from '../../../../../../shared/ui/select/select';
import { Button } from '../../../../../../shared/ui/button/button';
import { Customer } from '../../data/customer.model';
import { CustomerActions } from '../../data/store/customer.actions';

export interface ClientFormData { customer?: Customer; }

/** Backend `CustomerType` — the only two values `POST /api/customers` accepts. */
const CUSTOMER_TYPES: SelectOption[] = [
  { value: 'INDIVIDUAL', label: 'Particulier' },
  { value: 'COMPANY', label: 'Entreprise' },
];

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, Select, Button],
  templateUrl: './client-form.html',
})
export class ClientForm {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);

  data = inject(DIALOG_DATA) as ClientFormData;
  ref = inject(DIALOG_REF) as DialogRef<boolean>;

  submitted = signal(false);
  isEdit = !!this.data?.customer;
  types = CUSTOMER_TYPES;

  form = this.fb.group({
    name: [this.data?.customer?.name ?? '', Validators.required],
    // `type` is required by CreateCustomerCommand — omitting it was the 400.
    type: [this.data?.customer?.type ?? 'COMPANY', Validators.required],
    email: [this.data?.customer?.email ?? '', Validators.email],
    phone: [this.data?.customer?.phone ?? ''],
    taxId: [this.data?.customer?.taxId ?? ''],
    street: [this.data?.customer?.street ?? ''],
    city: [this.data?.customer?.city ?? ''],
    postalCode: [this.data?.customer?.postalCode ?? ''],
    country: [this.data?.customer?.country ?? ''],
  });

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const payload = {
      name: v.name!, type: v.type!, email: v.email ?? undefined, phone: v.phone ?? undefined,
      taxId: v.taxId ?? undefined, street: v.street ?? undefined, city: v.city ?? undefined,
      postalCode: v.postalCode ?? undefined, country: v.country ?? undefined,
    };
    if (this.isEdit) {
      this.store.dispatch(CustomerActions.update({ id: this.data.customer!.id, payload }));
    } else {
      this.store.dispatch(CustomerActions.create({ payload }));
    }
    this.ref.close(true);
  }
}
