import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DIALOG_REF, DialogRef } from '../../../../../../core/services/dialog.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { ApiError } from '../../../../../../core/services/api.service';
import { FormField } from '../../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../../shared/ui/text-input/text-input';
import { Button } from '../../../../../../shared/ui/button/button';
import { Category } from '../../data/category.model';
import { CategoryService } from '../../data/category.service';

export interface CategorieFormData { category?: Category; }

@Component({
  selector: 'app-categorie-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, Button],
  templateUrl: './categorie-form.html',
})
export class CategorieForm {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CategoryService);
  private readonly toast = inject(ToastService);

  data = inject(DIALOG_DATA) as CategorieFormData;
  ref = inject(DIALOG_REF) as DialogRef<boolean>;

  submitted = signal(false);
  saving = signal(false);
  isEdit = !!this.data?.category;

  form = this.fb.group({
    name: [this.data?.category?.name ?? '', Validators.required],
    description: [this.data?.category?.description ?? ''],
  });

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.saving.set(true);
    const req$ = this.isEdit
      ? this.service.update(this.data.category!.id, { name: v.name!, description: v.description ?? '' })
      : this.service.create({ name: v.name!, description: v.description ?? '' });

    req$.subscribe({
      next: () => { this.toast.success(this.isEdit ? 'Catégorie modifiée.' : 'Catégorie créée.'); this.ref.close(true); },
      error: (e) => { this.saving.set(false); this.toast.error(e instanceof ApiError ? e.message : 'Échec de l’enregistrement.'); },
    });
  }
}
