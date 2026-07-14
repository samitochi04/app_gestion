import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { DIALOG_REF, DialogRef } from '../../../../../../core/services/dialog.service';
import { FormField } from '../../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../../shared/ui/text-input/text-input';
import { Select, SelectOption } from '../../../../../../shared/ui/select/select';
import { Button } from '../../../../../../shared/ui/button/button';
import { SegmentedTabs, TabOption } from '../../../../../../shared/ui/segmented-tabs/segmented-tabs';
import { Icon } from '../../../../../../shared/ui/icon/icon';
import { MovementActions } from '../../data/store/movement.actions';
import { MovementType } from '../../data/movement.model';
import { ProductService } from '../../../produits/data/product.service';
import { WarehouseService } from '../../../entrepots/data/warehouse.service';

const TYPE_OPTIONS: TabOption[] = [
  { value: 'RECEIVE', label: 'Entrée' },
  { value: 'ISSUE', label: 'Sortie' },
  { value: 'ADJUST', label: 'Ajustement' },
  { value: 'TRANSFER', label: 'Transfert' },
];

@Component({
  selector: 'app-mouvement-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, Select, Button, SegmentedTabs, Icon],
  templateUrl: './mouvement-form.html',
  styleUrl: './mouvement-form.css',
})
export class MouvementForm {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly productService = inject(ProductService);
  private readonly warehouseService = inject(WarehouseService);

  ref = inject(DIALOG_REF) as DialogRef<boolean>;

  submitted = signal(false);
  typeOptions = TYPE_OPTIONS;
  type = signal<MovementType>('RECEIVE');

  productOptions = signal<SelectOption[]>([]);
  warehouseOptions = signal<SelectOption[]>([]);

  form = this.fb.group({
    warehouseId: [null as number | null, Validators.required],
    destWarehouseId: [null as number | null],
    reference: [''],
    notes: [''],
    lines: this.fb.array([this.newLine()]),
  });

  get lines(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  constructor() {
    this.productService.list({ page: 0, size: 200 }).subscribe((res) => {
      this.productOptions.set(res.content.map((p) => ({ value: p.id, label: `${p.sku} — ${p.name}` })));
    });
    this.warehouseService.list().subscribe((list) => {
      this.warehouseOptions.set(list.map((w) => ({ value: w.id, label: w.name })));
    });
  }

  newLine() {
    return this.fb.group({
      productId: [null as number | null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitCost: [0],
    });
  }

  addLine(): void { this.lines.push(this.newLine()); }
  removeLine(i: number): void { if (this.lines.length > 1) this.lines.removeAt(i); }

  selectType(t: string): void { this.type.set(t as MovementType); }

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const lines = v.lines.map((l) => ({ productId: l.productId!, quantity: l.quantity!, unitCost: l.unitCost ?? undefined }));

    switch (this.type()) {
      case 'RECEIVE':
        this.store.dispatch(MovementActions.receive({ payload: { lines, warehouseId: v.warehouseId!, reference: v.reference ?? undefined, notes: v.notes ?? undefined } }));
        break;
      case 'ISSUE':
        this.store.dispatch(MovementActions.issue({ payload: { lines, warehouseId: v.warehouseId!, reference: v.reference ?? undefined, notes: v.notes ?? undefined } }));
        break;
      case 'ADJUST':
        this.store.dispatch(MovementActions.adjust({ payload: { lines, warehouseId: v.warehouseId!, reference: v.reference ?? undefined, notes: v.notes ?? undefined } }));
        break;
      case 'TRANSFER':
        this.store.dispatch(MovementActions.transfer({
          payload: {
            sourceWarehouseId: v.warehouseId!, destWarehouseId: v.destWarehouseId!,
            lines, reference: v.reference ?? undefined, notes: v.notes ?? undefined,
          },
        }));
        break;
    }
    this.ref.close(true);
  }
}
