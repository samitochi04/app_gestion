import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { DIALOG_DATA, DIALOG_REF, DialogRef } from '../../../../../core/services/dialog.service';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../shared/ui/text-input/text-input';
import { Select, SelectOption } from '../../../../../shared/ui/select/select';
import { DateInput } from '../../../../../shared/ui/date-input/date-input';
import { Button } from '../../../../../shared/ui/button/button';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { Badge } from '../../../../../shared/ui/badge/badge';
import { Invoice } from '../../data/invoice.model';
import { InvoiceActions } from '../../data/store/invoice.actions';
import { documentStatusMeta } from '../../../../../core/models/status.model';
import { formatMoney } from '../../../../../core/utils/format';
import { ProductService } from '../../../../operations/stock/produits/data/product.service';
import { CustomerService } from '../../../../operations/ventes/clients/data/customer.service';
import { DialogService } from '../../../../../core/services/dialog.service';
import { FacturePaymentForm } from '../facture-payment-form/facture-payment-form';

export interface FactureFormData { invoice?: Invoice; }

@Component({
  selector: 'app-facture-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, Select, DateInput, Button, Icon, Badge],
  templateUrl: './facture-form.html',
  styleUrls: ['../../../../operations/stock/mouvements/ui/mouvement-form/mouvement-form.css', './facture-form.css'],
})
export class FactureForm {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly productService = inject(ProductService);
  private readonly customerService = inject(CustomerService);
  private readonly dialog = inject(DialogService);

  data = inject(DIALOG_DATA) as FactureFormData;
  ref = inject(DIALOG_REF) as DialogRef<boolean>;
  invoice = this.data?.invoice;

  submitted = signal(false);
  isEdit = !!this.invoice;
  statusLabel = this.invoice ? documentStatusMeta(this.invoice.status).label : '';
  statusTone = this.invoice ? documentStatusMeta(this.invoice.status).tone : 'neutral';

  money(v: number | null | undefined): string { return formatMoney(v); }

  productOptions = signal<SelectOption[]>([]);
  customerOptions = signal<SelectOption[]>([]);

  form = this.fb.group({
    customerId: [this.invoice?.customerId ?? null, Validators.required],
    dueDate: [this.invoice?.dueDate ?? ''],
    notes: [this.invoice?.notes ?? ''],
    lines: this.fb.array((this.invoice?.lines ?? [this.emptyLine()]).map((l) => this.lineGroup(l))),
  });

  get lines(): FormArray { return this.form.get('lines') as FormArray; }

  constructor() {
    this.productService.list({ page: 0, size: 200 }).subscribe((res) => {
      this.productOptions.set(res.content.map((p) => ({ value: p.id, label: `${p.sku} — ${p.name}` })));
    });
    this.customerService.list({ page: 0, size: 200 }).subscribe((res) => {
      this.customerOptions.set(res.content.map((c) => ({ value: c.id, label: c.name })));
    });
  }

  private emptyLine() {
    return { productId: 0, quantity: 1, unitPrice: 0, discount: 0, vatRate: 20 };
  }

  private lineGroup(l: { productId: number; quantity: number; unitPrice: number; discount?: number; vatRate?: number }) {
    return this.fb.group({
      productId: [l.productId || null, Validators.required],
      quantity: [l.quantity, [Validators.required, Validators.min(0.01)]],
      unitPrice: [l.unitPrice, [Validators.required, Validators.min(0)]],
      discount: [l.discount ?? 0],
      vatRate: [l.vatRate ?? 20],
    });
  }

  addLine(): void { this.lines.push(this.lineGroup(this.emptyLine())); }
  removeLine(i: number): void { if (this.lines.length > 1) this.lines.removeAt(i); }

  save(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const payload = {
      customerId: v.customerId!,
      lines: v.lines.map((l) => ({
        productId: l.productId!, quantity: l.quantity!, unitPrice: l.unitPrice!,
        discount: l.discount ?? 0, vatRate: l.vatRate ?? 20,
      })),
      dueDate: v.dueDate || undefined,
      notes: v.notes ?? undefined,
    };
    if (this.isEdit) {
      this.store.dispatch(InvoiceActions.update({ id: this.invoice!.id, payload }));
    } else {
      this.store.dispatch(InvoiceActions.create({ payload }));
    }
    this.ref.close(true);
  }

  validate(): void { this.store.dispatch(InvoiceActions.validate({ id: this.invoice!.id })); this.ref.close(true); }
  send(): void { this.store.dispatch(InvoiceActions.send({ id: this.invoice!.id })); this.ref.close(true); }
  cancel(): void { this.store.dispatch(InvoiceActions.cancel({ id: this.invoice!.id })); this.ref.close(true); }

  recordPayment(): void {
    this.dialog.open(FacturePaymentForm, { title: 'Enregistrer un paiement', data: { invoice: this.invoice } });
    this.ref.close(true);
  }
}
