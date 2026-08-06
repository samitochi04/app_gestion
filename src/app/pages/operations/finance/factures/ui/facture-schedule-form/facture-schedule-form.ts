import { Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DIALOG_REF, DialogRef } from '../../../../../../core/services/dialog.service';
import { ApiError } from '../../../../../../core/services/api.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { formatMoney } from '../../../../../../core/utils/format';
import { Badge } from '../../../../../../shared/ui/badge/badge';
import { Button } from '../../../../../../shared/ui/button/button';
import { DateInput } from '../../../../../../shared/ui/date-input/date-input';
import { FormField } from '../../../../../../shared/ui/form-field/form-field';
import { Icon } from '../../../../../../shared/ui/icon/icon';
import { Select } from '../../../../../../shared/ui/select/select';
import { TextInput } from '../../../../../../shared/ui/text-input/text-input';
import { StatusTone, documentStatusMeta } from '../../../../../../core/models/status.model';
import { Installment, Invoice, PAYMENT_METHODS, PaymentSchedule } from '../../data/invoice.model';
import { InvoiceService } from '../../data/invoice.service';

export interface FactureScheduleFormData { invoice: Invoice; }

/**
 * An invoice carries at most one schedule. The dialog therefore shows the
 * existing one and lets each instalment be settled, or — when none exists —
 * offers to build one. Every instalment payment publishes the same
 * `PaymentRecordedEvent` as an ordinary receipt.
 */
@Component({
  selector: 'app-facture-schedule-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, DateInput, Select, Button, Icon, Badge],
  templateUrl: './facture-schedule-form.html',
  styleUrls: ['../../../../../../shared/ui/line-editor/line-editor.css', './facture-schedule-form.css'],
})
export class FactureScheduleForm {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(InvoiceService);
  private readonly toast = inject(ToastService);

  data = inject(DIALOG_DATA) as FactureScheduleFormData;
  ref = inject(DIALOG_REF) as DialogRef<boolean>;
  invoice = this.data.invoice;

  methods = PAYMENT_METHODS;
  loading = signal(true);
  saving = signal(false);
  submitted = signal(false);
  schedule = signal<PaymentSchedule | null>(null);

  readonly hasSchedule = computed(() => !!this.schedule());
  readonly plannedTotal = computed(() =>
    this.draft.controls.reduce((sum, g) => sum + Number(g.get('amount')?.value ?? 0), 0),
  );

  /** Two instalments splitting the balance is the common case; both stay editable. */
  form = this.fb.group({
    installments: this.fb.array([this.installmentGroup(), this.installmentGroup()]),
  });

  settle = this.fb.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    method: ['CASH', Validators.required],
    reference: [''],
  });

  get draft(): FormArray { return this.form.get('installments') as FormArray; }

  constructor() {
    this.service.schedule(this.invoice.id).subscribe({
      next: (s) => { this.schedule.set(s); this.loading.set(false); },
      // A missing schedule is the normal case, not an error.
      error: () => { this.schedule.set(null); this.loading.set(false); },
    });
  }

  money(v: number | null | undefined): string { return formatMoney(v); }
  statusLabel(status: string): string { return documentStatusMeta(status).label; }
  statusTone(status: string): StatusTone { return documentStatusMeta(status).tone; }

  addInstallment(): void { this.draft.push(this.installmentGroup()); }
  removeInstallment(i: number): void { if (this.draft.length > 1) this.draft.removeAt(i); }

  create(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const rows = this.form.getRawValue().installments;
    this.saving.set(true);
    this.service.createSchedule({
      invoiceId: this.invoice.id,
      installments: rows.map((r) => ({ dueDate: r.dueDate!, amount: r.amount! })),
    }).subscribe({
      next: (s) => { this.toast.success('Échéancier créé.'); this.schedule.set(s); this.saving.set(false); },
      error: (e) => { this.saving.set(false); this.toast.error(e instanceof ApiError ? e.message : 'Création impossible.'); },
    });
  }

  pay(installment: Installment): void {
    const v = this.settle.getRawValue();
    const amount = v.amount && v.amount > 0 ? v.amount : installment.amount;
    this.saving.set(true);
    this.service.recordInstallment({
      invoiceId: this.invoice.id,
      installmentId: installment.id,
      amount,
      method: v.method!,
      reference: v.reference ?? undefined,
    }).subscribe({
      next: () => {
        this.toast.success('Échéance réglée.');
        this.saving.set(false);
        this.service.schedule(this.invoice.id).subscribe((s) => this.schedule.set(s));
      },
      error: (e) => { this.saving.set(false); this.toast.error(e instanceof ApiError ? e.message : 'Règlement impossible.'); },
    });
  }

  private installmentGroup() {
    return this.fb.group({
      dueDate: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
    });
  }
}
