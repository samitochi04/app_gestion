import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_REF, DialogRef } from '../../../../../core/services/dialog.service';
import { ApiError } from '../../../../../core/services/api.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../shared/ui/text-input/text-input';
import { Select, SelectOption } from '../../../../../shared/ui/select/select';
import { DateInput } from '../../../../../shared/ui/date-input/date-input';
import { Button } from '../../../../../shared/ui/button/button';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { LINE_NATURES } from '../../../commandes/data/purchase-order.model';
import { SupplierInvoiceService } from '../../data/supplier-invoice.service';
import { SupplierService } from '../../../fournisseurs/data/supplier.service';
import { ProductService } from '../../../../operations/stock/produits/data/product.service';

@Component({
  selector: 'app-facture-fournisseur-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, Select, DateInput, Button, Icon],
  templateUrl: './facture-fournisseur-form.html',
  styleUrls: ['../../../../../shared/ui/line-editor/line-editor.css'],
})
export class FactureFournisseurForm {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(SupplierInvoiceService);
  private readonly supplierService = inject(SupplierService);
  private readonly productService = inject(ProductService);
  private readonly toast = inject(ToastService);

  ref = inject(DIALOG_REF) as DialogRef<boolean>;

  submitted = signal(false);
  saving = signal(false);
  natures = LINE_NATURES;

  supplierOptions = signal<SelectOption[]>([]);
  productOptions = signal<SelectOption[]>([]);
  private productNames = new Map<number, string>();

  form = this.fb.group({
    supplierId: [null as number | null, Validators.required],
    issueDate: [''],
    dueDate: [''],
    notes: [''],
    lines: this.fb.array([this.lineGroup()]),
  });

  get lines(): FormArray { return this.form.get('lines') as FormArray; }

  constructor() {
    this.supplierService.list({ page: 0, size: 200 }).subscribe((res) => {
      this.supplierOptions.set(res.content.filter((s) => s.active).map((s) => ({ value: s.id, label: `${s.reference} — ${s.name}` })));
    });
    this.productService.list({ page: 0, size: 200 }).subscribe((res) => {
      this.productOptions.set(res.content.map((p) => ({ value: p.id, label: `${p.sku} — ${p.name}` })));
      this.productNames = new Map(res.content.map((p) => [p.id, p.name]));
    });
  }

  private lineGroup() {
    return this.fb.group({
      productId: [null as number | null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      vatRate: [19.25],
      nature: ['MERCHANDISE', Validators.required],
    });
  }

  addLine(): void { this.lines.push(this.lineGroup()); }
  removeLine(i: number): void { if (this.lines.length > 1) this.lines.removeAt(i); }

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.service.create({
      supplierId: v.supplierId!,
      issueDate: v.issueDate || undefined,
      dueDate: v.dueDate || undefined,
      notes: v.notes ?? undefined,
      lines: v.lines.map((l) => ({
        productId: l.productId!,
        productName: this.productNames.get(l.productId!) ?? `Produit ${l.productId}`,
        quantity: l.quantity!, unitPrice: l.unitPrice!, vatRate: l.vatRate ?? 0, nature: l.nature!,
      })),
    }).subscribe({
      next: () => { this.toast.success('Facture fournisseur créée.'); this.ref.close(true); },
      error: (e) => { this.saving.set(false); this.toast.error(e instanceof ApiError ? e.message : 'Création impossible.'); },
    });
  }
}
