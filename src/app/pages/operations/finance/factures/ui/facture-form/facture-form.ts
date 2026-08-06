import { Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { DIALOG_DATA, DIALOG_REF, DialogRef, DialogService } from '../../../../../../core/services/dialog.service';
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
import { ProductService } from '../../../../stock/produits/data/product.service';
import { Invoice, InvoiceLine } from '../../data/invoice.model';
import { InvoiceActions } from '../../data/store/invoice.actions';
import { InvoiceService } from '../../data/invoice.service';
import { FacturePaymentForm } from '../facture-payment-form/facture-payment-form';
import { FactureScheduleForm } from '../facture-schedule-form/facture-schedule-form';

export interface FactureFormData { invoice: Invoice; }

/** Statuses that still carry a balance worth settling. */
const SETTLEABLE = ['VALIDATED', 'SENT', 'PARTIALLY_PAID', 'OVERDUE'];

/**
 * Opens on an existing invoice — there is no creation path, because the
 * backend has no `POST /api/invoices`. A draft may still be corrected; once
 * validated the document is locked and an avoir is the only correction.
 */
@Component({
  selector: 'app-facture-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, Select, DateInput, Button, Icon, Badge],
  templateUrl: './facture-form.html',
  styleUrls: ['../../../../../../shared/ui/line-editor/line-editor.css', './facture-form.css'],
})
export class FactureForm {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly service = inject(InvoiceService);
  private readonly productService = inject(ProductService);
  private readonly dialog = inject(DialogService);

  data = inject(DIALOG_DATA) as FactureFormData;
  ref = inject(DIALOG_REF) as DialogRef<boolean>;
  invoice = this.data.invoice;

  submitted = signal(false);
  statusLabel = documentStatusMeta(this.invoice.status).label;
  statusTone = documentStatusMeta(this.invoice.status).tone;

  readonly isDraft = computed(() => this.invoice.status === 'DRAFT');
  readonly canSend = computed(() => ['VALIDATED', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'].includes(this.invoice.status));
  readonly canSettle = computed(() => SETTLEABLE.includes(this.invoice.status));

  productOptions = signal<SelectOption[]>([]);

  form = this.fb.group({
    dueDate: [this.invoice.dueDate ?? ''],
    notes: [this.invoice.notes ?? ''],
    lines: this.fb.array((this.invoice.lines ?? []).map((l) => this.lineGroup(l))),
  });

  get lines(): FormArray { return this.form.get('lines') as FormArray; }

  constructor() {
    this.productService.list({ page: 0, size: 200 }).subscribe((res) => {
      this.productOptions.set(res.content.map((p) => ({ value: p.id, label: `${p.sku} — ${p.name}` })));
    });
    if (this.isDraft() && this.lines.length === 0) this.addLine();
  }

  money(v: number | null | undefined): string { return formatMoney(v); }

  addLine(): void { this.lines.push(this.lineGroup(this.emptyLine())); }
  removeLine(i: number): void { if (this.lines.length > 1) this.lines.removeAt(i); }

  save(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.store.dispatch(InvoiceActions.update({
      id: this.invoice.id,
      payload: {
        dueDate: v.dueDate || undefined,
        notes: v.notes ?? undefined,
        lines: v.lines.map((l) => this.toLine(l)),
      },
    }));
    this.ref.close(true);
  }

  validate(): void {
    this.store.dispatch(InvoiceActions.validate({ id: this.invoice.id }));
    this.ref.close(true);
  }

  send(): void {
    const ref = this.dialog.open<PromptDialogData, string>(PromptDialog, {
      title: `Envoyer la facture ${this.invoice.reference}`,
      data: { label: 'Adresse du destinataire', type: 'email', placeholder: 'client@exemple.com', confirmLabel: 'Envoyer' },
    });
    ref.closed$.subscribe((email) => {
      if (!email) return;
      this.store.dispatch(InvoiceActions.send({ id: this.invoice.id, email }));
      this.ref.close(true);
    });
  }

  cancelInvoice(): void {
    const ref = this.dialog.open<PromptDialogData, string>(PromptDialog, {
      title: `Annuler la facture ${this.invoice.reference}`,
      data: {
        label: 'Motif',
        message: 'Seul un brouillon peut être annulé. Une facture validée se corrige par un avoir.',
        confirmLabel: 'Annuler la facture',
      },
    });
    ref.closed$.subscribe((reason) => {
      if (!reason) return;
      this.store.dispatch(InvoiceActions.cancel({ id: this.invoice.id, reason }));
      this.ref.close(true);
    });
  }

  recordPayment(): void {
    this.dialog.open(FacturePaymentForm, { title: 'Enregistrer un paiement', data: { invoice: this.invoice } });
    this.ref.close(true);
  }

  openSchedule(): void {
    this.dialog.open(FactureScheduleForm, { title: `Échéancier — ${this.invoice.reference}`, size: 'lg', data: { invoice: this.invoice } });
    this.ref.close(true);
  }

  downloadPdf(): void {
    this.service.downloadPdf(this.invoice.id, this.invoice.reference).subscribe();
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

  /** `productName` is required by `BillingLineDto`. */
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
