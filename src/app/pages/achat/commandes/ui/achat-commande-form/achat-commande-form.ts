import { Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { DIALOG_DATA, DIALOG_REF, DialogRef } from '../../../../../core/services/dialog.service';
import { ApiError } from '../../../../../core/services/api.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { documentStatusMeta } from '../../../../../core/models/status.model';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../shared/ui/text-input/text-input';
import { Select, SelectOption } from '../../../../../shared/ui/select/select';
import { DateInput } from '../../../../../shared/ui/date-input/date-input';
import { Button } from '../../../../../shared/ui/button/button';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { Badge } from '../../../../../shared/ui/badge/badge';
import { LINE_NATURES, PurchaseOrder } from '../../data/purchase-order.model';
import { PurchaseOrderService } from '../../data/purchase-order.service';
import { SupplierService } from '../../../fournisseurs/data/supplier.service';
import { ProductService } from '../../../../operations/stock/produits/data/product.service';

export interface AchatCommandeFormData { order?: PurchaseOrder; }

@Component({
  selector: 'app-achat-commande-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, Select, DateInput, Button, Icon, Badge],
  templateUrl: './achat-commande-form.html',
  styleUrls: ['../../../../../shared/ui/line-editor/line-editor.css'],
})
export class AchatCommandeForm {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PurchaseOrderService);
  private readonly supplierService = inject(SupplierService);
  private readonly productService = inject(ProductService);
  private readonly toast = inject(ToastService);

  data = inject(DIALOG_DATA) as AchatCommandeFormData | null;
  ref = inject(DIALOG_REF) as DialogRef<boolean>;

  order = this.data?.order;
  isEdit = !!this.order;
  isDraft = !this.order || this.order.status === 'DRAFT';

  submitted = signal(false);
  saving = signal(false);
  natures = LINE_NATURES;

  supplierOptions = signal<SelectOption[]>([]);
  productOptions = signal<SelectOption[]>([]);
  private productNames = new Map<number, string>();

  statusLabel = this.order ? documentStatusMeta(this.order.status).label : '';
  statusTone = this.order ? documentStatusMeta(this.order.status).tone : 'neutral';
  readonly canConfirm = computed(() => this.isEdit && this.order!.status === 'DRAFT');
  readonly canInvoice = computed(() => this.isEdit && ['CONFIRMED', 'RECEIVED', 'PARTIALLY_RECEIVED'].includes(this.order!.status));
  readonly canCancel = computed(() => this.isEdit && ['DRAFT', 'CONFIRMED'].includes(this.order!.status));

  form = this.fb.group({
    supplierId: [this.order?.supplierId ?? null, Validators.required],
    expectedDate: [this.order?.expectedDate ?? ''],
    notes: [this.order?.notes ?? ''],
    lines: this.fb.array((this.order?.lines ?? [this.emptyLine()]).map((l) => this.lineGroup(l))),
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

  private emptyLine() {
    return { productId: 0, quantity: 1, unitPrice: 0, vatRate: 19.25, nature: 'MERCHANDISE' };
  }

  private lineGroup(l: { productId: number; quantity: number; unitPrice: number; vatRate?: number; nature?: string }) {
    return this.fb.group({
      productId: [l.productId || null, Validators.required],
      quantity: [l.quantity, [Validators.required, Validators.min(0.01)]],
      unitPrice: [l.unitPrice, [Validators.required, Validators.min(0)]],
      vatRate: [l.vatRate ?? 19.25],
      nature: [l.nature ?? 'MERCHANDISE', Validators.required],
    });
  }

  addLine(): void { this.lines.push(this.lineGroup(this.emptyLine())); }
  removeLine(i: number): void { if (this.lines.length > 1) this.lines.removeAt(i); }

  save(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const payload = {
      supplierId: v.supplierId!,
      expectedDate: v.expectedDate || undefined,
      notes: v.notes ?? undefined,
      lines: v.lines.map((l) => ({
        productId: l.productId!,
        productName: this.productNames.get(l.productId!) ?? `Produit ${l.productId}`,
        quantity: l.quantity!, unitPrice: l.unitPrice!, vatRate: l.vatRate ?? 0, nature: l.nature!,
      })),
    };
    // Only DRAFT purchase orders are created here; confirmed ones are read-only.
    this.run(this.service.create(payload), 'Commande d’achat créée.');
  }

  confirm(): void { this.run(this.service.confirm(this.order!.id), 'Commande confirmée.'); }
  cancel(): void { this.run(this.service.cancel(this.order!.id), 'Commande annulée.'); }
  invoice(): void { this.run(this.service.invoice(this.order!.id), 'Facture fournisseur pré-remplie créée.'); }

  private run(request$: Observable<unknown>, message: string): void {
    this.saving.set(true);
    request$.subscribe({
      next: () => { this.toast.success(message); this.ref.close(true); },
      error: (e) => { this.saving.set(false); this.toast.error(e instanceof ApiError ? e.message : 'Opération impossible.'); },
    });
  }
}
