import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DIALOG_REF, DialogRef } from '../../../../../core/services/dialog.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { ApiError } from '../../../../../core/services/api.service';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../shared/ui/text-input/text-input';
import { Select, SelectOption } from '../../../../../shared/ui/select/select';
import { Button } from '../../../../../shared/ui/button/button';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { CreditNoteService } from '../../data/credit-note.service';
import { InvoiceService } from '../../../factures/data/invoice.service';
import { ProductService } from '../../../../operations/stock/produits/data/product.service';

const TYPES: SelectOption[] = [
  { value: 'PARTIAL', label: 'Partiel' },
  { value: 'TOTAL', label: 'Total' },
];

@Component({
  selector: 'app-avoir-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, Select, Button, Icon],
  templateUrl: './avoir-form.html',
  styleUrls: ['../../../../operations/stock/mouvements/ui/mouvement-form/mouvement-form.css'],
})
export class AvoirForm {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CreditNoteService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly productService = inject(ProductService);
  private readonly toast = inject(ToastService);

  ref = inject(DIALOG_REF) as DialogRef<boolean>;
  submitted = signal(false);
  saving = signal(false);
  types = TYPES;

  invoiceOptions = signal<SelectOption[]>([]);
  productOptions = signal<SelectOption[]>([]);

  form = this.fb.group({
    invoiceId: [null as number | null, Validators.required],
    type: ['PARTIAL', Validators.required],
    reason: ['', Validators.required],
    lines: this.fb.array([this.lineGroup()]),
  });

  get lines(): FormArray { return this.form.get('lines') as FormArray; }

  constructor() {
    this.invoiceService.list({ page: 0, size: 200 }).subscribe((res) => {
      this.invoiceOptions.set(res.content.map((i) => ({ value: i.id, label: `${i.reference} — ${i.customerName}` })));
    });
    this.productService.list({ page: 0, size: 200 }).subscribe((res) => {
      this.productOptions.set(res.content.map((p) => ({ value: p.id, label: `${p.sku} — ${p.name}` })));
    });
  }

  lineGroup() {
    return this.fb.group({
      productId: [null as number | null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
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
      invoiceId: v.invoiceId!, reason: v.reason!, type: v.type!,
      lines: v.lines.map((l) => ({ productId: l.productId!, quantity: l.quantity!, unitPrice: l.unitPrice! })),
    }).subscribe({
      next: () => { this.toast.success('Avoir créé.'); this.ref.close(true); },
      error: (e) => { this.saving.set(false); this.toast.error(e instanceof ApiError ? e.message : 'Création impossible.'); },
    });
  }
}
