import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DIALOG_REF, DialogRef } from '../../../../../../core/services/dialog.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { ApiError } from '../../../../../../core/services/api.service';
import { FormField } from '../../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../../shared/ui/text-input/text-input';
import { Select, SelectOption } from '../../../../../../shared/ui/select/select';
import { Button } from '../../../../../../shared/ui/button/button';
import { AccountingMapping } from '../../data/accounting.model';
import { AccountingService } from '../../data/accounting.service';

export interface MappingFormData { mapping?: AccountingMapping; }

/** The entity kinds the resolver knows about. */
const ENTITY_TYPES: SelectOption[] = [
  { value: 'PRODUCT', label: 'Produit' },
  { value: 'PRODUCT_CATEGORY', label: 'Catégorie de produit' },
  { value: 'CUSTOMER', label: 'Client' },
  { value: 'SUPPLIER', label: 'Fournisseur' },
  { value: 'PAYMENT_METHOD', label: 'Mode de règlement' },
  { value: 'VAT_RATE', label: 'Taux de TVA' },
  { value: 'INVENTORY', label: 'Inventaire' },
];

/** What the account is used for, per entity kind. */
const ACCOUNT_TYPES: SelectOption[] = [
  { value: 'REVENUE', label: 'Produit (701)' },
  { value: 'STOCK', label: 'Stock (311)' },
  { value: 'COST', label: 'Coût des ventes (601)' },
  { value: 'RECEIVABLE', label: 'Créance client (411)' },
  { value: 'PAYABLE', label: 'Dette fournisseur (401)' },
  { value: 'PENDING_INVOICE', label: 'Facture non parvenue (4081)' },
  { value: 'CASH', label: 'Trésorerie (521)' },
  { value: 'VAT_COLLECTED', label: 'TVA collectée (4441)' },
  { value: 'VAT_DEDUCTIBLE', label: 'TVA déductible (4445)' },
  { value: 'ADJUSTMENT_LOSS', label: 'Perte d’inventaire (658)' },
  { value: 'ADJUSTMENT_GAIN', label: 'Gain d’inventaire (758)' },
];

/**
 * `PUT /api/accounting/mappings` upserts on `(entityType, entityId, accountType)`,
 * so this one form covers creation and edition alike.
 */
@Component({
  selector: 'app-mapping-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField, TextInput, Select, Button],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <div class="row-2">
        <app-form-field label="Type d’entité" [required]="true">
          <app-select [options]="entityTypes" formControlName="entityType" placeholder="Choisir..." />
        </app-form-field>
        <app-form-field label="Identifiant" hint="Vide = correspondance par défaut pour ce type">
          <app-text-input formControlName="entityId" />
        </app-form-field>
      </div>

      <div class="row-2">
        <app-form-field label="Usage du compte" [required]="true">
          <app-select [options]="accountTypes" formControlName="accountType" placeholder="Choisir..." />
        </app-form-field>
        <app-form-field label="Code du compte" [required]="true"
          [error]="submitted() && form.controls.accountCode.invalid ? 'Code requis.' : ''">
          <app-text-input formControlName="accountCode" placeholder="701" />
        </app-form-field>
      </div>

      <app-form-field label="Libellé">
        <app-text-input formControlName="label" />
      </app-form-field>

      <div class="form-actions">
        <app-button type="submit" [loading]="saving()">Enregistrer</app-button>
      </div>
    </form>
  `,
})
export class MappingForm {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AccountingService);
  private readonly toast = inject(ToastService);

  data = inject(DIALOG_DATA) as MappingFormData | null;
  ref = inject(DIALOG_REF) as DialogRef<boolean>;

  entityTypes = ENTITY_TYPES;
  accountTypes = ACCOUNT_TYPES;
  submitted = signal(false);
  saving = signal(false);

  form = this.fb.group({
    entityType: [this.data?.mapping?.entityType ?? '', Validators.required],
    entityId: [this.data?.mapping?.entityId ?? ''],
    accountType: [this.data?.mapping?.accountType ?? '', Validators.required],
    accountCode: [this.data?.mapping?.accountCode ?? '', Validators.required],
    label: [this.data?.mapping?.label ?? ''],
  });

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.service.upsertMapping({
      entityType: v.entityType!,
      entityId: v.entityId || undefined,
      accountType: v.accountType!,
      accountCode: v.accountCode!,
      label: v.label ?? undefined,
    }).subscribe({
      next: () => { this.toast.success('Correspondance enregistrée.'); this.ref.close(true); },
      error: (e) => { this.saving.set(false); this.toast.error(e instanceof ApiError ? e.message : 'Enregistrement impossible.'); },
    });
  }
}
