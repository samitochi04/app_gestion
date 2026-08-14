import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { DIALOG_DATA, DIALOG_REF, DialogRef } from '../../../../../../core/services/dialog.service';
import { FormField } from '../../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../../shared/ui/text-input/text-input';
import { Select, SelectOption } from '../../../../../../shared/ui/select/select';
import { Button } from '../../../../../../shared/ui/button/button';
import { Product } from '../../data/product.model';
import { ProductActions } from '../../data/store/product.actions';
import { CategoryService } from '../../../categories/data/category.service';

export interface ProduitFormData { product?: Product; }

@Component({
  selector: 'app-produit-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, Select, Button],
  templateUrl: './produit-form.html',
})
export class ProduitForm {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly categoryService = inject(CategoryService);

  data = inject(DIALOG_DATA) as ProduitFormData;
  ref = inject(DIALOG_REF) as DialogRef<boolean>;

  submitted = signal(false);
  isEdit = !!this.data?.product;

  categoryOptions = signal<SelectOption[]>([]);

  form = this.fb.group({
    name: [this.data?.product?.name ?? '', Validators.required],
    sku: [this.data?.product?.sku ?? '', Validators.required],
    type: [this.data?.product?.type ?? 'STOCKABLE', Validators.required],
    unit: [this.data?.product?.unit ?? 'pcs', Validators.required],
    categoryId: [this.data?.product?.categoryId ?? null, Validators.required],
    unitPurchasePrice: [this.data?.product?.unitPurchasePrice ?? 0, [Validators.required, Validators.min(0)]],
    unitSalePrice: [this.data?.product?.unitSalePrice ?? 0, [Validators.min(0)]],
    marginPercent: [this.data?.product?.marginPercent ?? 0],
    description: [this.data?.product?.description ?? ''],
  });

  constructor() {
    this.categoryService.list().subscribe((cats) => {
      this.categoryOptions.set(cats.map((c) => ({ value: c.id, label: c.name })));
    });
  }

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const v = this.form.getRawValue();

    if (this.isEdit) {
      this.store.dispatch(ProductActions.update({
        id: this.data.product!.id,
        payload: {
          name: v.name!, description: v.description ?? '', categoryId: v.categoryId!,
          unitPurchasePrice: v.unitPurchasePrice!, unit: v.unit!,
          marginPercent: v.marginPercent ?? undefined, unitSalePrice: v.unitSalePrice ?? undefined,
        },
      }));
    } else {
      this.store.dispatch(ProductActions.create({
        payload: {
          name: v.name!, sku: v.sku!, type: v.type!, unit: v.unit!,
          unitPurchasePrice: v.unitPurchasePrice!, description: v.description ?? '', categoryId: v.categoryId!,
        },
        // The create command drops the sale price; hand it to the effect so it
        // can set it with an immediate follow-up update.
        sale: { unitSalePrice: v.unitSalePrice ?? undefined, marginPercent: v.marginPercent ?? undefined },
      }));
    }
    this.ref.close(true);
  }
}
