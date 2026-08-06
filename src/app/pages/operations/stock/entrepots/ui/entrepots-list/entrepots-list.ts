import { Component, OnInit, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { PageHeader } from '../../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../../shared/ui/card/card';
import { Button } from '../../../../../../shared/ui/button/button';
import { SearchInput } from '../../../../../../shared/ui/search-input/search-input';
import { DataTable, DataTableAction, DataTableColumn } from '../../../../../../shared/ui/data-table/data-table';
import { DialogService } from '../../../../../../core/services/dialog.service';
import { ConfirmDialog, ConfirmDialogData } from '../../../../../../shared/ui/confirm-dialog/confirm-dialog';
import { ToastService } from '../../../../../../core/services/toast.service';
import { ApiError } from '../../../../../../core/services/api.service';
import { Warehouse } from '../../data/warehouse.model';
import { WarehouseService } from '../../data/warehouse.service';
import { EntrepotForm } from '../entrepot-form/entrepot-form';

@Component({
  selector: 'app-entrepots-list',
  standalone: true,
  imports: [PageHeader, Card, Button, SearchInput, DataTable],
  templateUrl: './entrepots-list.html',
})
export class EntrepotsList implements OnInit {
  private readonly service = inject(WarehouseService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);

  warehouses = signal<Warehouse[]>([]);
  loading = signal(true);
  searchTerm = signal('');

  columns: DataTableColumn<Warehouse>[] = [
    { key: 'code', header: 'Code', width: '120px' },
    { key: 'name', header: 'Nom' },
    { key: 'address', header: 'Adresse' },
    { key: 'role', header: 'Rôle', cell: (r) => this.roleLabel(r) },
    { key: 'active', header: 'Statut', align: 'center', cell: (r) => (r.active ? 'Actif' : 'Inactif') },
  ];

  /**
   * Both flags are unique across warehouses and mutually exclusive, so an
   * action only shows on a warehouse that holds neither today.
   */
  actions: DataTableAction<Warehouse>[] = [
    {
      icon: 'download',
      label: 'Désigner comme entrepôt d’achat',
      visible: (r) => !r.purchaseDefault && !r.damagedDefault,
      run: (r) => this.setPurchaseDefault(r),
    },
    {
      icon: 'alert-triangle',
      label: 'Désigner comme entrepôt d’avariés',
      visible: (r) => !r.damagedDefault && !r.purchaseDefault,
      run: (r) => this.setDamagedDefault(r),
    },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (list) => { this.warehouses.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  create(): void {
    const ref = this.dialog.open(EntrepotForm, { title: 'Nouvel entrepôt' });
    ref.closed$.subscribe((ok) => { if (ok) this.load(); });
  }

  edit(warehouse: Warehouse): void {
    const ref = this.dialog.open(EntrepotForm, { title: 'Modifier l’entrepôt', data: { warehouse } });
    ref.closed$.subscribe((ok) => { if (ok) this.load(); });
  }

  remove(warehouse: Warehouse): void {
    const ref = this.dialog.open<ConfirmDialogData, boolean>(ConfirmDialog, {
      title: 'Supprimer l’entrepôt ?',
      data: { message: `Supprimer « ${warehouse.name} » ?`, danger: true },
    });
    ref.closed$.subscribe((confirmed) => {
      if (!confirmed) return;
      this.service.delete(warehouse.id).subscribe({
        next: () => { this.toast.success('Entrepôt supprimé.'); this.load(); },
        error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Suppression impossible.'),
      });
    });
  }

  private setPurchaseDefault(warehouse: Warehouse): void {
    this.confirmFlag(
      warehouse,
      'Entrepôt d’achat',
      `Toutes les réceptions fournisseur arriveront dans « ${warehouse.name} ». L’entrepôt d’achat actuel perdra ce rôle.`,
      () => this.service.markPurchaseDefault(warehouse.id),
    );
  }

  private setDamagedDefault(warehouse: Warehouse): void {
    this.confirmFlag(
      warehouse,
      'Entrepôt d’avariés',
      `Les quantités déclarées avariées à la réception iront dans « ${warehouse.name} ».`,
      () => this.service.markDamagedDefault(warehouse.id),
    );
  }

  private confirmFlag(warehouse: Warehouse, title: string, message: string, run: () => Observable<Warehouse>): void {
    const ref = this.dialog.open<ConfirmDialogData, boolean>(ConfirmDialog, {
      title,
      data: { message, confirmLabel: 'Désigner' },
    });
    ref.closed$.subscribe((confirmed) => {
      if (!confirmed) return;
      run().subscribe({
        next: () => { this.toast.success(`« ${warehouse.name} » désigné.`); this.load(); },
        error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Désignation impossible.'),
      });
    });
  }

  private roleLabel(w: Warehouse): string {
    if (w.purchaseDefault) return 'Achats';
    if (w.damagedDefault) return 'Avariés';
    return '—';
  }
}
