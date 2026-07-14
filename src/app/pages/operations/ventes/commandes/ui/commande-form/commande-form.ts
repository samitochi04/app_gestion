import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { DIALOG_DATA, DIALOG_REF, DialogRef } from '../../../../../../core/services/dialog.service';
import { FormField } from '../../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../../shared/ui/text-input/text-input';
import { Select, SelectOption } from '../../../../../../shared/ui/select/select';
import { Button } from '../../../../../../shared/ui/button/button';
import { Icon } from '../../../../../../shared/ui/icon/icon';
import { Badge } from '../../../../../../shared/ui/badge/badge';
import { Order } from '../../data/order.model';
import { OrderActions } from '../../data/store/order.actions';
import { documentStatusMeta } from '../../../../../../core/models/status.model';
import { ProductService } from '../../../../stock/produits/data/product.service';
import { CustomerService } from '../../../clients/data/customer.service';

export interface CommandeFormData { order?: Order; }

@Component({
  selector: 'app-commande-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, Select, Button, Icon, Badge],
  templateUrl: './commande-form.html',
  styleUrls: ['../../../../stock/mouvements/ui/mouvement-form/mouvement-form.css', './commande-form.css'],
})
export class CommandeForm {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly productService = inject(ProductService);
  private readonly customerService = inject(CustomerService);

  data = inject(DIALOG_DATA) as CommandeFormData;
  ref = inject(DIALOG_REF) as DialogRef<boolean>;

  submitted = signal(false);
  isEdit = !!this.data?.order;
  order = this.data?.order;

  productOptions = signal<SelectOption[]>([]);
  customerOptions = signal<SelectOption[]>([]);

  form = this.fb.group({
    customerId: [this.order?.customerId ?? null, Validators.required],
    street: [this.order?.shippingStreet ?? ''],
    city: [this.order?.shippingCity ?? ''],
    postalCode: [this.order?.shippingPostalCode ?? ''],
    country: [this.order?.shippingCountry ?? ''],
    notes: [this.order?.notes ?? ''],
    lines: this.fb.array((this.order?.lines ?? [this.emptyLine()]).map((l) => this.lineGroup(l))),
  });

  get lines(): FormArray { return this.form.get('lines') as FormArray; }

  statusLabel = this.order ? documentStatusMeta(this.order.status).label : '';
  statusTone = this.order ? documentStatusMeta(this.order.status).tone : 'neutral';

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
      street: v.street ?? undefined, city: v.city ?? undefined,
      postalCode: v.postalCode ?? undefined, country: v.country ?? undefined,
      notes: v.notes ?? undefined,
    };
    if (this.isEdit) {
      this.store.dispatch(OrderActions.update({ id: this.order!.id, payload }));
    } else {
      this.store.dispatch(OrderActions.create({ payload }));
    }
    this.ref.close(true);
  }

  confirm(): void { this.store.dispatch(OrderActions.confirm({ id: this.order!.id })); this.ref.close(true); }
  prepare(): void { this.store.dispatch(OrderActions.prepare({ id: this.order!.id })); this.ref.close(true); }
  ship(): void { this.store.dispatch(OrderActions.ship({ id: this.order!.id })); this.ref.close(true); }
  deliver(): void { this.store.dispatch(OrderActions.deliver({ id: this.order!.id })); this.ref.close(true); }
  cancel(): void { this.store.dispatch(OrderActions.cancel({ id: this.order!.id })); this.ref.close(true); }
}
