import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
  Warehouse
} from '../../models/business.model';
import { WarehouseService } from '../../services/warehouse.service';
import { getApiErrorMessage } from '../../utils/http.util';

@Component({
  selector: 'app-warehouses',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './warehouses.html',
  styleUrl: './warehouses.css'
})
export class WarehousesComponent implements OnInit {
  protected readonly warehouses = signal<Warehouse[]>([]);
  protected readonly loading = signal(false);
  protected readonly showForm = signal(false);
  protected readonly activeOnly = signal(true);
  protected readonly editingWarehouse = signal<Warehouse | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  readonly warehouseForm: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly warehouseService: WarehouseService
  ) {
    this.warehouseForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      code: ['', [Validators.required, Validators.minLength(2)]],
      address: ['']
    });
  }

  ngOnInit(): void {
    this.loadWarehouses();
  }

  loadWarehouses(): void {
    this.loading.set(true);
    this.warehouseService.getWarehouses(this.activeOnly()).subscribe({
      next: (warehouses) => {
        this.warehouses.set(warehouses);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors du chargement des entrepôts'));
        this.loading.set(false);
      }
    });
  }

  toggleActiveFilter(): void {
    this.activeOnly.update((value) => !value);
    this.loadWarehouses();
  }

  openCreateForm(): void {
    this.editingWarehouse.set(null);
    this.warehouseForm.reset({ name: '', code: '', address: '' });
    this.warehouseForm.get('code')?.enable();
    this.showForm.set(true);
    this.clearMessages();
  }

  openEditForm(warehouse: Warehouse): void {
    this.editingWarehouse.set(warehouse);
    this.warehouseForm.reset({
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address
    });
    this.warehouseForm.get('code')?.disable();
    this.showForm.set(true);
    this.clearMessages();
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingWarehouse.set(null);
    this.warehouseForm.reset({ name: '', code: '', address: '' });
    this.warehouseForm.get('code')?.enable();
  }

  onSubmit(): void {
    if (this.warehouseForm.invalid) {
      this.warehouseForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    const raw = this.warehouseForm.getRawValue();
    const request$ = this.editingWarehouse()
      ? this.warehouseService.updateWarehouse(this.editingWarehouse()!.id, {
          name: raw.name,
          address: raw.address
        } as UpdateWarehouseRequest)
      : this.warehouseService.createWarehouse(raw as CreateWarehouseRequest);

    request$.subscribe({
      next: () => {
        this.successMessage.set(
          this.editingWarehouse() ? 'Entrepôt modifié avec succès' : 'Entrepôt créé avec succès'
        );
        this.cancelForm();
        this.loadWarehouses();
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de l\'enregistrement de l\'entrepôt'));
        this.loading.set(false);
      }
    });
  }

  deleteWarehouse(warehouse: Warehouse): void {
    if (!confirm(`Supprimer l'entrepôt "${warehouse.name}" ?`)) {
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    this.warehouseService.deleteWarehouse(warehouse.id).subscribe({
      next: () => {
        this.successMessage.set('Entrepôt supprimé avec succès');
        this.loadWarehouses();
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de la suppression de l\'entrepôt'));
        this.loading.set(false);
      }
    });
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
