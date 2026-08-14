import { Component, OnInit, inject, signal } from '@angular/core';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../shared/ui/card/card';
import { Button } from '../../../../../shared/ui/button/button';
import { SearchInput } from '../../../../../shared/ui/search-input/search-input';
import { DataTable, DataTableAction, DataTableColumn } from '../../../../../shared/ui/data-table/data-table';
import { DialogService } from '../../../../../core/services/dialog.service';
import { DetailDialog, DetailDialogData } from '../../../../../shared/ui/detail-dialog/detail-dialog';
import { ConfirmDialog, ConfirmDialogData } from '../../../../../shared/ui/confirm-dialog/confirm-dialog';
import { ToastService } from '../../../../../core/services/toast.service';
import { ApiError } from '../../../../../core/services/api.service';
import { Supplier } from '../../data/supplier.model';
import { SupplierService } from '../../data/supplier.service';
import { FournisseurForm } from '../fournisseur-form/fournisseur-form';

@Component({
  selector: 'app-fournisseurs-list',
  standalone: true,
  imports: [PageHeader, Card, Button, SearchInput, DataTable],
  templateUrl: './fournisseurs-list.html',
})
export class FournisseursList implements OnInit {
  private readonly service = inject(SupplierService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);

  suppliers = signal<Supplier[]>([]);
  loading = signal(true);
  searchTerm = signal('');

  columns: DataTableColumn<Supplier>[] = [
    { key: 'reference', header: 'Référence', width: '140px' },
    { key: 'name', header: 'Nom' },
    { key: 'email', header: 'E-mail' },
    { key: 'phone', header: 'Téléphone' },
    { key: 'active', header: 'Statut', align: 'center', cell: (r) => (r.active ? 'Actif' : 'Inactif') },
  ];

  actions: DataTableAction<Supplier>[] = [
    { icon: 'x', label: 'Désactiver', danger: true, visible: (r) => r.active, run: (r) => this.deactivate(r) },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.service.list({ page: 0, size: 200 }).subscribe({
      next: (res) => { this.suppliers.set(res.content); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  create(): void {
    const ref = this.dialog.open(FournisseurForm, { title: 'Nouveau fournisseur', size: 'lg' });
    ref.closed$.subscribe((ok) => { if (ok) this.load(); });
  }

  edit(supplier: Supplier): void {
    const ref = this.dialog.open(FournisseurForm, { title: 'Modifier le fournisseur', size: 'lg', data: { supplier } });
    ref.closed$.subscribe((ok) => { if (ok) this.load(); });
  }

  view(supplier: Supplier): void {
    const data: DetailDialogData = {
      sections: [{
        title: 'Fournisseur',
        fields: [
          { label: 'Référence', value: supplier.reference },
          { label: 'Nom', value: supplier.name },
          { label: 'Statut', value: supplier.active ? 'Actif' : 'Inactif', tone: supplier.active ? 'success' : 'neutral' },
          { label: 'E-mail', value: supplier.email || '—' },
          { label: 'Téléphone', value: supplier.phone || '—' },
          { label: 'Identifiant fiscal', value: supplier.taxId || '—' },
          { label: 'Adresse', value: supplier.address || '—' },
        ],
      }],
    };
    this.dialog.open(DetailDialog, { title: `Fournisseur — ${supplier.name}`, size: 'md', data });
  }

  private deactivate(supplier: Supplier): void {
    const ref = this.dialog.open<ConfirmDialogData, boolean>(ConfirmDialog, {
      title: 'Désactiver le fournisseur ?',
      data: { message: `« ${supplier.name} » ne pourra plus recevoir de commandes. Ses écritures restent intactes.`, danger: true, confirmLabel: 'Désactiver' },
    });
    ref.closed$.subscribe((confirmed) => {
      if (!confirmed) return;
      this.service.deactivate(supplier.id).subscribe({
        next: () => { this.toast.success('Fournisseur désactivé.'); this.load(); },
        error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Désactivation impossible.'),
      });
    });
  }
}
