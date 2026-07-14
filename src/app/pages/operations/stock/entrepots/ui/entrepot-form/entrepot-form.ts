import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DIALOG_REF, DialogRef } from '../../../../../../core/services/dialog.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { ApiError } from '../../../../../../core/services/api.service';
import { FormField } from '../../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../../shared/ui/text-input/text-input';
import { Button } from '../../../../../../shared/ui/button/button';
import { Warehouse } from '../../data/warehouse.model';
import { WarehouseService } from '../../data/warehouse.service';

export interface EntrepotFormData { warehouse?: Warehouse; }

@Component({
  selector: 'app-entrepot-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, Button],
  templateUrl: './entrepot-form.html',
})
export class EntrepotForm {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(WarehouseService);
  private readonly toast = inject(ToastService);

  data = inject(DIALOG_DATA) as EntrepotFormData;
  ref = inject(DIALOG_REF) as DialogRef<boolean>;

  submitted = signal(false);
  saving = signal(false);
  isEdit = !!this.data?.warehouse;

  form = this.fb.group({
    code: [this.data?.warehouse?.code ?? '', Validators.required],
    name: [this.data?.warehouse?.name ?? '', Validators.required],
    address: [this.data?.warehouse?.address ?? ''],
  });

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.saving.set(true);
    const req$ = this.isEdit
      ? this.service.update(this.data.warehouse!.id, { code: v.code!, name: v.name!, address: v.address ?? '' })
      : this.service.create({ code: v.code!, name: v.name!, address: v.address ?? '' });

    req$.subscribe({
      next: () => { this.toast.success(this.isEdit ? 'Entrepôt modifié.' : 'Entrepôt créé.'); this.ref.close(true); },
      error: (e) => { this.saving.set(false); this.toast.error(e instanceof ApiError ? e.message : 'Échec de l’enregistrement.'); },
    });
  }
}
