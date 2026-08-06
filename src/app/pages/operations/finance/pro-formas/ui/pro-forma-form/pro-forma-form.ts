import { Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { DIALOG_DATA, DIALOG_REF, DialogRef, DialogService } from '../../../../../../core/services/dialog.service';
import { ApiError } from '../../../../../../core/services/api.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { documentStatusMeta } from '../../../../../../core/models/status.model';
import { formatMoney } from '../../../../../../core/utils/format';
import { Badge } from '../../../../../../shared/ui/badge/badge';
import { Button } from '../../../../../../shared/ui/button/button';
import { DateInput } from '../../../../../../shared/ui/date-input/date-input';
import { FormField } from '../../../../../../shared/ui/form-field/form-field';
import { Icon } from '../../../../../../shared/ui/icon/icon';
import { PromptDialog, PromptDialogData } from '../../../../../../shared/ui/prompt-dialog/prompt-dialog';
import { Select, SelectOption } from '../../../../../../shared/ui/select/select';
import { TextInput } from '../../../../../../shared/ui/text-input/text-input';
import { CustomerService } from '../../../../ventes/clients/data/customer.service';
import { ProductService } from '../../../../stock/produits/data/product.service';
import { InvoiceLine } from '../../../factures/data/invoice.model';
import { ProForma } from '../../data/pro-forma.model';
import { ProFormaService } from '../../data/pro-forma.service';

export interface ProFormaFormData { proForma?: ProForma; }

/** Only a pro forma that has not yet been turned into an invoice may change. */
const EDITABLE_STATUSES = ['DRAFT', 'SENT'];

@Component({
  selector: 'app-pro-forma-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, Select, DateInput, Button, Icon, Badge],
  templateUrl: './pro-forma-form.html',
  styleUrls: ['../../../../../../shared/ui/line-editor/line-editor.css'],
})
export class ProFormaForm {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProFormaService);
  private readonly productService = inject(ProductService);
  private readonly customerService = inject(CustomerService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);

  data = inject(DIALOG_DATA) as ProFormaFormData | null;
  ref = inject(DIALOG_REF) as DialogRef<boolean>;
  proForma = this.data?.proForma;
  isEdit = !!this.proForma;

  submitted = signal(false);
  saving = signal(false);

  statusLabel = this.proForma ? documentStatusMeta(this.proForma.status).label : '';
  statusTone = this.proForma ? documentStatusMeta(this.proForma.status).tone : 'neutral';

  productOptions = signal<SelectOption[]>([]);
  customerOptions = signal<SelectOption[]>([]);

  readonly isEditable = computed(() => !this.isEdit || EDITABLE_STATUSES.includes(this.proForma!.status));
  readonly canConvert = computed(() => this.isEdit && this.proForma!.status !== 'CONVERTED');

  form = this.fb.group({
    customerId: [this.proForma?.customerId ?? null, Validators.required],
    validUntil: [this.proForma?.validUntil ?? ''],
    notes: [this.proForma?.notes ?? ''],
    lines: this.fb.array((this.proForma?.lines ?? [this.emptyLine()]).map((l) => this.lineGroup(l))),
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

  money(v: number | null | undefined): string { return formatMoney(v); }

  addLine(): void { this.lines.push(this.lineGroup(this.emptyLine())); }
  removeLine(i: number): void { if (this.lines.length > 1) this.lines.removeAt(i); }

  save(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const lines = v.lines.map((l) => this.toLine(l));

    if (this.isEdit) {
      this.run(this.service.update(this.proForma!.id, {
        validUntil: v.validUntil || undefined,
        notes: v.notes ?? undefined,
        lines,
      }), 'Pro forma modifiée.');
      return;
    }

    // `customerName` is denormalised onto the document and required by the API.
    const customerName = this.customerOptions().find((o) => o.value === v.customerId)?.label ?? '';
    this.run(this.service.create({
      customerId: v.customerId!,
      customerName,
      validUntil: v.validUntil || undefined,
      notes: v.notes ?? undefined,
      lines,
    }), 'Pro forma créée.');
  }

  send(): void {
    const ref = this.dialog.open<PromptDialogData, string>(PromptDialog, {
      title: 'Envoyer la pro forma',
      data: { label: 'Adresse du destinataire', type: 'email', placeholder: 'client@exemple.com', confirmLabel: 'Envoyer' },
    });
    ref.closed$.subscribe((email) => {
      if (email) this.run(this.service.send(this.proForma!.id, email), `Pro forma envoyée à ${email}.`);
    });
  }

  convert(): void {
    this.run(this.service.convert(this.proForma!.id), 'Facture créée à partir de la pro forma.');
  }

  downloadPdf(): void {
    this.service.downloadPdf(this.proForma!.id, this.proForma!.reference).subscribe();
  }

  private run(request$: Observable<unknown>, successMessage: string): void {
    this.saving.set(true);
    request$.subscribe({
      next: () => { this.toast.success(successMessage); this.ref.close(true); },
      error: (e) => {
        this.saving.set(false);
        this.toast.error(e instanceof ApiError ? e.message : 'Opération impossible.');
      },
    });
  }

  private emptyLine(): InvoiceLine {
    return { productId: 0, productName: '', quantity: 1, unitPrice: 0, discount: 0, vatRate: 19.25 };
  }

  private lineGroup(l: InvoiceLine) {
    return this.fb.group({
      productId: [l.productId || null, Validators.required],
      quantity: [l.quantity, [Validators.required, Validators.min(0.01)]],
      unitPrice: [l.unitPrice, [Validators.required, Validators.min(0)]],
      discount: [l.discount ?? 0],
      vatRate: [l.vatRate ?? 19.25],
    });
  }

  /** `productName` is required by `BillingLineDto`; resolve it from the picker. */
  private toLine(l: { productId: number | null; quantity: number | null; unitPrice: number | null; discount: number | null; vatRate: number | null }): InvoiceLine {
    const option = this.productOptions().find((o) => o.value === l.productId);
    return {
      productId: l.productId!,
      productName: option?.label ?? `Produit ${l.productId}`,
      quantity: l.quantity!,
      unitPrice: l.unitPrice!,
      discount: l.discount ?? 0,
      vatRate: l.vatRate ?? 0,
    };
  }
}
