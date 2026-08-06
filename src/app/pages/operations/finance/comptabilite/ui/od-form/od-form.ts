import { Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { DIALOG_DATA, DIALOG_REF, DialogRef } from '../../../../../../core/services/dialog.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { ApiError } from '../../../../../../core/services/api.service';
import { formatNumber } from '../../../../../../core/utils/format';
import { FormField } from '../../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../../shared/ui/text-input/text-input';
import { DateInput } from '../../../../../../shared/ui/date-input/date-input';
import { Select, SelectOption } from '../../../../../../shared/ui/select/select';
import { Button } from '../../../../../../shared/ui/button/button';
import { Icon } from '../../../../../../shared/ui/icon/icon';
import { AccountingService } from '../../data/accounting.service';
import { AccountingPeriod, ChartAccount } from '../../data/accounting.model';

export interface OdFormData {
  periods: AccountingPeriod[];
  accounts: ChartAccount[];
}

/** Rounding noise must not fail an otherwise balanced entry. */
const BALANCE_TOLERANCE = 0.005;

/**
 * Manual journal entry (`OD`). Double entry is enforced client-side before the
 * request leaves: an unbalanced entry is refused by the backend anyway, and
 * catching it here shows the person *where* the gap is.
 */
@Component({
  selector: 'app-od-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, DateInput, Select, Button, Icon],
  templateUrl: './od-form.html',
  styleUrls: ['../../../../../../shared/ui/line-editor/line-editor.css', './od-form.css'],
})
export class OdForm {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AccountingService);
  private readonly toast = inject(ToastService);

  data = inject(DIALOG_DATA) as OdFormData;
  ref = inject(DIALOG_REF) as DialogRef<boolean>;
  submitted = signal(false);
  saving = signal(false);

  periodOptions: SelectOption[] = (this.data?.periods ?? []).map((p) => ({ value: p.id, label: p.label }));
  accountOptions: SelectOption[] = (this.data?.accounts ?? [])
    .filter((a) => a.active && !a.isParent)
    .map((a) => ({ value: a.code, label: `${a.code} — ${a.label}` }));

  form = this.fb.group({
    description: ['', Validators.required],
    entryDate: [new Date().toISOString().slice(0, 10), Validators.required],
    periodId: [null as number | null, Validators.required],
    lines: this.fb.array([this.lineGroup(), this.lineGroup()]),
  });

  get lines(): FormArray { return this.form.get('lines') as FormArray; }

  /** Totals recompute on every keystroke, so the balance badge stays honest. */
  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly totalDebit = computed(() => this.sum('debit'));
  readonly totalCredit = computed(() => this.sum('credit'));
  readonly balanced = computed(() => {
    const debit = this.totalDebit();
    return debit > 0 && Math.abs(debit - this.totalCredit()) < BALANCE_TOLERANCE;
  });

  money(v: number): string { return formatNumber(v); }

  lineGroup() {
    return this.fb.group({
      accountCode: ['', Validators.required],
      label: ['', Validators.required],
      debit: [0],
      credit: [0],
    });
  }

  addLine(): void { this.lines.push(this.lineGroup()); }
  removeLine(i: number): void { if (this.lines.length > 2) this.lines.removeAt(i); }

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid || !this.balanced()) return;

    const v = this.form.getRawValue();
    this.saving.set(true);
    this.service.journalCreateOd({
      periodId: v.periodId!,
      entryDate: v.entryDate!,
      description: v.description!,
      lines: v.lines.map((l) => ({
        accountCode: l.accountCode!,
        label: l.label!,
        debit: Number(l.debit ?? 0),
        credit: Number(l.credit ?? 0),
      })),
    }).subscribe({
      next: () => { this.toast.success('Écriture enregistrée.'); this.ref.close(true); },
      error: (e) => { this.saving.set(false); this.toast.error(e instanceof ApiError ? e.message : 'Échec de l’enregistrement.'); },
    });
  }

  private sum(field: 'debit' | 'credit'): number {
    const lines = (this.value().lines ?? []) as { debit?: number | null; credit?: number | null }[];
    return lines.reduce((total, l) => total + Number(l[field] ?? 0), 0);
  }
}
