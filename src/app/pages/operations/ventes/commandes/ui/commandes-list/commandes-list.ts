import { Component, OnInit, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { PageHeader } from '../../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../../shared/ui/card/card';
import { Button } from '../../../../../../shared/ui/button/button';
import { Icon } from '../../../../../../shared/ui/icon/icon';
import { SearchInput } from '../../../../../../shared/ui/search-input/search-input';
import { DataTable, DataTableColumn } from '../../../../../../shared/ui/data-table/data-table';
import { Paginator } from '../../../../../../shared/ui/paginator/paginator';
import { DialogService } from '../../../../../../core/services/dialog.service';
import { FilterDialog, FilterFieldConfig } from '../../../../../../shared/ui/filter-dialog/filter-dialog';
import { documentStatusMeta } from '../../../../../../core/models/status.model';
import { OrderActions } from '../../data/store/order.actions';
import {
  selectAllOrders, selectOrdersLoading, selectOrdersPage,
  selectOrdersSize, selectOrdersTotalElements, selectOrdersTotalPages,
} from '../../data/store/order.selectors';
import { Order } from '../../data/order.model';
import { CommandeForm } from '../commande-form/commande-form';
import { formatMoney } from '../../../../../../core/utils/format';

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'CONFIRMED', label: 'Confirmé' },
  { value: 'PREPARING', label: 'En préparation' },
  { value: 'SHIPPED', label: 'Expédié' },
  { value: 'DELIVERED', label: 'Livré' },
  { value: 'CANCELLED', label: 'Annulé' },
];

@Component({
  selector: 'app-commandes-list',
  standalone: true,
  imports: [PageHeader, Card, Button, Icon, SearchInput, DataTable, Paginator],
  templateUrl: './commandes-list.html',
})
export class CommandesList implements OnInit {
  private readonly store = inject(Store);
  private readonly dialog = inject(DialogService);

  orders = toSignal(this.store.select(selectAllOrders), { initialValue: [] as Order[] });
  loading = toSignal(this.store.select(selectOrdersLoading), { initialValue: false });
  page = toSignal(this.store.select(selectOrdersPage), { initialValue: 0 });
  size = toSignal(this.store.select(selectOrdersSize), { initialValue: 20 });
  totalElements = toSignal(this.store.select(selectOrdersTotalElements), { initialValue: 0 });
  totalPages = toSignal(this.store.select(selectOrdersTotalPages), { initialValue: 0 });

  searchTerm = signal('');
  activeFilterCount = signal(0);

  columns: DataTableColumn<Order>[] = [
    { key: 'reference', header: 'Référence', width: '150px' },
    { key: 'customerId', header: 'Client', cell: (r) => `#${r.customerId}` },
    { key: 'status', header: 'Statut', cell: (r) => documentStatusMeta(r.status).label },
    { key: 'totalAmountTTC', header: 'Total TTC', align: 'right', cell: (r) => formatMoney(r.totalAmountTTC) },
    { key: 'createdAt', header: 'Date', cell: (r) => new Date(r.createdAt).toLocaleDateString('fr-FR') },
  ];

  ngOnInit(): void { this.store.dispatch(OrderActions.loadPage({ page: 0 })); }
  onPageChange(page: number): void { this.store.dispatch(OrderActions.loadPage({ page })); }

  openFilters(): void {
    const fields: FilterFieldConfig[] = [
      { key: 'status', label: 'Statut', type: 'select', options: STATUS_OPTIONS },
    ];
    const ref = this.dialog.open<{ fields: FilterFieldConfig[] }, Record<string, string | number | null>>(
      FilterDialog,
      { title: 'Filtrer les commandes', data: { fields } },
    );
    ref.closed$.subscribe((result) => {
      if (result === undefined) return;
      this.activeFilterCount.set(Object.keys(result).length);
      this.store.dispatch(OrderActions.loadPage({ page: 0, filters: result as Record<string, string | number> }));
    });
  }

  create(): void {
    this.dialog.open(CommandeForm, { title: 'Nouvelle commande', size: 'lg' });
  }

  edit(order: Order): void {
    this.dialog.open(CommandeForm, { title: `Commande ${order.reference}`, size: 'lg', data: { order } });
  }
}
