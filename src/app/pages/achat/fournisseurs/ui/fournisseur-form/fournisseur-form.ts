import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { DIALOG_DATA, DIALOG_REF, DialogRef } from '../../../../../core/services/dialog.service';
import { ApiError } from '../../../../../core/services/api.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../shared/ui/text-input/text-input';
import { Button } from '../../../../../shared/ui/button/button';
import { Supplier } from '../../data/supplier.model';
import { SupplierService } from '../../data/supplier.service';

export interface FournisseurFormData { supplier?: Supplier; }

@Component({
  selector: 'app-fournisseur-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, Button],
  templateUrl: './fournisseur-form.html',
})
export class FournisseurForm {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(SupplierService);
  private readonly toast = inject(ToastService);

  data = inject(DIALOG_DATA) as FournisseurFormData | null;
  ref = inject(DIALOG_REF) as DialogRef<boolean>;

  supplier = this.data?.supplier;
  isEdit = !!this.supplier;
  submitted = signal(false);
  saving = signal(false);

  form = this.fb.group({
    name: [this.supplier?.name ?? '', Validators.required],
    email: [this.supplier?.email ?? '', Validators.email],
    phone: [this.supplier?.phone ?? ''],
    taxId: [this.supplier?.taxId ?? ''],
    address: [this.supplier?.address ?? ''],
  });

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const payload = {
      name: v.name!, email: v.email ?? undefined, phone: v.phone ?? undefined,
      taxId: v.taxId ?? undefined, address: v.address ?? undefined,
    };
    this.run(
      this.isEdit ? this.service.update(this.supplier!.id, payload) : this.service.create(payload),
      this.isEdit ? 'Fournisseur modifié.' : 'Fournisseur créé.',
    );
  }

  private run(request$: Observable<unknown>, message: string): void {
    this.saving.set(true);
    request$.subscribe({
      next: () => { this.toast.success(message); this.ref.close(true); },
      error: (e) => { this.saving.set(false); this.toast.error(e instanceof ApiError ? e.message : 'Enregistrement impossible.'); },
    });
  }
}
