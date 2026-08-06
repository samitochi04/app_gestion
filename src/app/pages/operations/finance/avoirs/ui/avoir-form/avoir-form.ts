import { Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { DIALOG_REF, DialogRef } from '../../../../../../core/services/dialog.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { ApiError } from '../../../../../../core/services/api.service';
import { FormField } from '../../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../../shared/ui/text-input/text-input';
import { Select, SelectOption } from '../../../../../../shared/ui/select/select';
import { Button } from '../../../../../../shared/ui/button/button';
import { Icon } from '../../../../../../shared/ui/icon/icon';
import { CREDIT_NOTE_KINDS, CREDIT_NOTE_TYPES } from '../../data/credit-note.model';
import { CreditNoteService } from '../../data/credit-note.service';
import { InvoiceService } from '../../../factures/data/invoice.service';
import { InvoiceLine } from '../../../factures/data/invoice.model';
import { ProductService } from '../../../../stock/produits/data/product.service';
import { WarehouseService } from '../../../../stock/entrepots/data/warehouse.service';

/** Only a validated (or later) invoice can be credited. */
const CREDITABLE = ['VALIDATED', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'];

@Component({
  selector: 'app-avoir-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, Select, Button, Icon],
  templateUrl: './avoir-form.html',
  styleUrls: ['../../../../../../shared/ui/line-editor/line-editor.css'],
})
export class AvoirForm {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CreditNoteService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly productService = inject(ProductService);
  private readonly warehouseService = inject(WarehouseService);
  private readonly toast = inject(ToastService);

  ref = inject(DIALOG_REF) as DialogRef<boolean>;
  submitted = signal(false);
  saving = signal(false);

  types = CREDIT_NOTE_TYPES;
  kinds = CREDIT_NOTE_KINDS;

  invoiceOptions = signal<SelectOption[]>([]);
  productOptions = signal<SelectOption[]>([]);
  warehouseOptions = signal<SelectOption[]>([]);

  form = this.fb.group({
    invoiceId: [null as number | null, Validators.required],
    type: ['PARTIAL', Validators.required],
    kind: ['FINANCIAL', Validators.required],
    warehouseId: [null as number | null],
    reason: ['', Validators.required],
    lines: this.fb.array([this.lineGroup()]),
  });

  /** A return moves stock; a financial credit note never does. */
  private readonly kind = toSignal(this.form.controls.kind.valueChanges, {
    initialValue: this.form.controls.kind.value,
  });
  readonly isReturn = computed(() => this.kind() === 'RETURN');

  get lines(): FormArray { return this.form.get('lines') as FormArray; }

  constructor() {
    this.invoiceService.list({ page: 0, size: 200 }).subscribe((res) => {
      this.invoiceOptions.set(
        res.content
          .filter((i) => CREDITABLE.includes(i.status))
          .map((i) => ({ value: i.id, label: `${i.reference} — ${i.customerName}` })),
      );
    });
    this.productService.list({ page: 0, size: 200 }).subscribe((res) => {
      this.productOptions.set(res.content.map((p) => ({ value: p.id, label: `${p.sku} — ${p.name}` })));
    });
    this.warehouseService.list().subscribe((list) => {
      this.warehouseOptions.set(list.map((w) => ({ value: w.id, label: w.name })));
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
      invoiceId: v.invoiceId!,
      type: v.type!,
      kind: v.kind!,
      reason: v.reason!,
      lines: v.lines.map((l) => this.toLine(l)),
    }).subscribe({
      next: () => { this.toast.success('Avoir créé. Validez-le pour qu’il produise ses effets.'); this.ref.close(true); },
      error: (e) => { this.saving.set(false); this.toast.error(e instanceof ApiError ? e.message : 'Création impossible.'); },
    });
  }

  /** `productName` is required by `BillingLineDto`; resolve it from the picker. */
  private toLine(l: { productId: number | null; quantity: number | null; unitPrice: number | null }): InvoiceLine {
    const option = this.productOptions().find((o) => o.value === l.productId);
    return {
      productId: l.productId!,
      productName: option?.label ?? `Produit ${l.productId}`,
      quantity: l.quantity!,
      unitPrice: l.unitPrice!,
      discount: 0,
      vatRate: 0,
    };
  }
}
