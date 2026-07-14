import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { DIALOG_DATA, DIALOG_REF, DialogRef } from '../../../../../../core/services/dialog.service';
import { FormField } from '../../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../../shared/ui/text-input/text-input';
import { Select, SelectOption } from '../../../../../../shared/ui/select/select';
import { DateInput } from '../../../../../../shared/ui/date-input/date-input';
import { Button } from '../../../../../../shared/ui/button/button';
import { Icon } from '../../../../../../shared/ui/icon/icon';
import { Quote } from '../../data/quote.model';
import { QuoteActions } from '../../data/store/quote.actions';
import { ProductService } from '../../../../stock/produits/data/product.service';
import { CustomerService } from '../../../clients/data/customer.service';

export interface DevisFormData { quote?: Quote; }

@Component({
  selector: 'app-devis-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, Select, DateInput, Button, Icon],
  templateUrl: './devis-form.html',
  styleUrl: '../../../../stock/mouvements/ui/mouvement-form/mouvement-form.css',
})
export class DevisForm {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly productService = inject(ProductService);
  private readonly customerService = inject(CustomerService);

  data = inject(DIALOG_DATA) as DevisFormData;
  ref = inject(DIALOG_REF) as DialogRef<boolean>;

  submitted = signal(false);
  isEdit = !!this.data?.quote;
  isDraft = !this.data?.quote || this.data.quote.status === 'DRAFT';

  productOptions = signal<SelectOption[]>([]);
  customerOptions = signal<SelectOption[]>([]);

  form = this.fb.group({
    customerId: [this.data?.quote?.customerId ?? null, Validators.required],
    validUntil: [this.data?.quote?.validUntil ?? ''],
    notes: [this.data?.quote?.notes ?? ''],
    lines: this.fb.array((this.data?.quote?.lines ?? [this.emptyLine()]).map((l) => this.lineGroup(l))),
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
    return { productId: 0, quantity: 1, unitSalePrice: 0, discount: 0, vatRate: 20 };
  }

  private lineGroup(l: { productId: number; quantity: number; unitSalePrice: number; discount?: number; vatRate?: number }) {
    return this.fb.group({
      productId: [l.productId || null, Validators.required],
      quantity: [l.quantity, [Validators.required, Validators.min(0.01)]],
      unitSalePrice: [l.unitSalePrice, [Validators.required, Validators.min(0)]],
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
        productId: l.productId!, quantity: l.quantity!, unitSalePrice: l.unitSalePrice!,
        discount: l.discount ?? 0, vatRate: l.vatRate ?? 20,
      })),
      validUntil: v.validUntil || undefined,
      notes: v.notes ?? undefined,
    };
    if (this.isEdit) {
      this.store.dispatch(QuoteActions.update({ id: this.data.quote!.id, payload }));
    } else {
      this.store.dispatch(QuoteActions.create({ payload }));
    }
    this.ref.close(true);
  }

  send(): void {
    if (this.data?.quote) this.store.dispatch(QuoteActions.send({ id: this.data.quote.id }));
    this.ref.close(true);
  }

  convert(): void {
    if (this.data?.quote) this.store.dispatch(QuoteActions.convert({ id: this.data.quote.id }));
    this.ref.close(true);
  }
}
