import { Component, OnInit, inject, signal } from '@angular/core';
import { PageHeader } from '../../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../../shared/ui/card/card';
import { Button } from '../../../../../../shared/ui/button/button';
import { SearchInput } from '../../../../../../shared/ui/search-input/search-input';
import { DataTable, DataTableColumn } from '../../../../../../shared/ui/data-table/data-table';
import { DialogService } from '../../../../../../core/services/dialog.service';
import { ConfirmDialog } from '../../../../../../shared/ui/confirm-dialog/confirm-dialog';
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
    { key: 'active', header: 'Statut', align: 'center', cell: (r) => (r.active ? 'Actif' : 'Inactif') },
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
    const ref = this.dialog.open<{ message: string; danger: boolean }, boolean>(ConfirmDialog, {
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
}
