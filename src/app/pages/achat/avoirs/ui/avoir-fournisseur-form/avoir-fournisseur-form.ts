import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_REF, DialogRef } from '../../../../../core/services/dialog.service';
import { ApiError } from '../../../../../core/services/api.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../shared/ui/text-input/text-input';
import { Select, SelectOption } from '../../../../../shared/ui/select/select';
import { Button } from '../../../../../shared/ui/button/button';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { SUPPLIER_CREDIT_NOTE_KINDS } from '../../data/supplier-credit-note.model';
import { SupplierCreditNoteService } from '../../data/supplier-credit-note.service';
import { SupplierInvoiceService } from '../../../factures/data/supplier-invoice.service';
import { SupplierInvoice } from '../../../factures/data/supplier-invoice.model';
import { ProductService } from '../../../../operations/stock/produits/data/product.service';
import { Product } from '../../../../operations/stock/produits/data/product.model';

@Component({
  selector: 'app-avoir-fournisseur-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, Select, Button, Icon],
  templateUrl: './avoir-fournisseur-form.html',
  styleUrls: ['../../../../../shared/ui/line-editor/line-editor.css'],
})
export class AvoirFournisseurForm {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(SupplierCreditNoteService);
  private readonly invoiceService = inject(SupplierInvoiceService);
  private readonly productService = inject(ProductService);
  private readonly toast = inject(ToastService);

  ref = inject(DIALOG_REF) as DialogRef<boolean>;

  submitted = signal(false);
  saving = signal(false);
  kinds = SUPPLIER_CREDIT_NOTE_KINDS;

  invoiceOptions = signal<SelectOption[]>([]);
  productOptions = signal<SelectOption[]>([]);
  private productNames = new Map<number, string>();

  /** Map invoice id → full invoice for auto-fill. */
  private invoicesById = new Map<number, SupplierInvoice>();
  /** Map product id → product for price lookup. */
  private productsById = new Map<number, Product>();

  form = this.fb.group({
    supplierInvoiceId: [null as number | null, Validators.required],
    kind: ['FINANCIAL', Validators.required],
    reason: ['', Validators.required],
    lines: this.fb.array([this.lineGroup()]),
  });

  get lines(): FormArray { return this.form.get('lines') as FormArray; }

  constructor() {
    // Only validated invoices can be corrected by a credit note.
    this.invoiceService.list({ page: 0, size: 200 }).subscribe((res) => {
      const creditable = res.content.filter((i) => i.status !== 'DRAFT' && i.status !== 'CANCELLED');
      this.invoiceOptions.set(
        creditable.map((i) => ({ value: i.id, label: `${i.reference} — ${i.supplierName ?? ''}`.trim() })),
      );
      creditable.forEach((i) => this.invoicesById.set(i.id, i));
    });
    this.productService.list({ page: 0, size: 200 }).subscribe((res) => {
      this.productOptions.set(res.content.map((p) => ({ value: p.id, label: `${p.sku} — ${p.name}` })));
      this.productNames = new Map(res.content.map((p) => [p.id, p.name]));
      res.content.forEach((p) => this.productsById.set(p.id, p));
    });

    // Watch invoice selection to auto-fill lines
    this.form.controls.supplierInvoiceId.valueChanges.subscribe((invoiceId) => {
      if (invoiceId == null) return;
      this.autoFillFromInvoice(invoiceId);
    });
  }

  /**
   * When a supplier invoice is selected, auto-fill lines from the invoice.
   * Price = unitPurchasePrice (supplier context: purchase price).
   */
  private autoFillFromInvoice(invoiceId: number): void {
    const invoice = this.invoicesById.get(invoiceId);
    if (!invoice || !invoice.lines?.length) return;

    // Clear existing lines
    this.lines.clear();

    // Re-create lines from invoice
    for (const line of invoice.lines) {
      // Supplier context → use unitPurchasePrice from product
      const product = this.productsById.get(line.productId);
      const unitPrice = product?.unitPurchasePrice ?? line.unitPrice ?? 0;

      this.lines.push(this.fb.group({
        productId: [line.productId, Validators.required],
        quantity: [line.quantity, [Validators.required, Validators.min(0.01)]],
        unitPrice: [unitPrice, [Validators.required, Validators.min(0)]],
        vatRate: [line.vatRate ?? 19.25],
      }));
    }
  }

  private lineGroup() {
    return this.fb.group({
      productId: [null as number | null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      vatRate: [19.25],
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
      supplierInvoiceId: v.supplierInvoiceId!,
      kind: v.kind!,
      reason: v.reason!,
      lines: v.lines.map((l) => ({
        productId: l.productId!,
        productName: this.productNames.get(l.productId!) ?? `Produit ${l.productId}`,
        quantity: l.quantity!, unitPrice: l.unitPrice!, vatRate: l.vatRate ?? 0,
      })),
    }).subscribe({
      next: () => { this.toast.success('Avoir fournisseur créé.'); this.ref.close(true); },
      error: (e) => { this.saving.set(false); this.toast.error(e instanceof ApiError ? e.message : 'Création impossible.'); },
    });
  }
}
