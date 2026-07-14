import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DIALOG_REF, DialogRef } from '../../../../../core/services/dialog.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { ApiError } from '../../../../../core/services/api.service';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../shared/ui/text-input/text-input';
import { DateInput } from '../../../../../shared/ui/date-input/date-input';
import { Select, SelectOption } from '../../../../../shared/ui/select/select';
import { Button } from '../../../../../shared/ui/button/button';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { AccountingService } from '../../data/accounting.service';
import { AccountingPeriod } from '../../data/accounting.model';

export interface OdFormData { periods: AccountingPeriod[]; }

@Component({
  selector: 'app-od-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, DateInput, Select, Button, Icon],
  templateUrl: './od-form.html',
  styleUrls: ['../../../../operations/stock/mouvements/ui/mouvement-form/mouvement-form.css'],
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

  form = this.fb.group({
    description: ['', Validators.required],
    entryDate: ['', Validators.required],
    periodId: [null as number | null, Validators.required],
    lines: this.fb.array([this.lineGroup()]),
  });

  get lines(): FormArray { return this.form.get('lines') as FormArray; }

  lineGroup() {
    return this.fb.group({
      productId: [0, Validators.required],
      quantity: [1, Validators.required],
      unitCost: [0, Validators.required],
    });
  }

  addLine(): void { this.lines.push(this.lineGroup()); }
  removeLine(i: number): void { if (this.lines.length > 1) this.lines.removeAt(i); }

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.service.journalCreateOd({
      description: v.description!, entryDate: v.entryDate!, periodId: v.periodId!,
      lines: v.lines.map((l) => ({ productId: l.productId!, quantity: l.quantity!, unitCost: l.unitCost! })),
    }).subscribe({
      next: () => { this.toast.success('Écriture enregistrée.'); this.ref.close(true); },
      error: (e) => { this.saving.set(false); this.toast.error(e instanceof ApiError ? e.message : 'Échec de l’enregistrement.'); },
    });
  }
}
