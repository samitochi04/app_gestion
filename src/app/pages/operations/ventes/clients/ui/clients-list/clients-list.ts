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
import { DetailDialog, DetailDialogData } from '../../../../../../shared/ui/detail-dialog/detail-dialog';
import { ConfirmDialog } from '../../../../../../shared/ui/confirm-dialog/confirm-dialog';
import { FilterDialog, FilterFieldConfig } from '../../../../../../shared/ui/filter-dialog/filter-dialog';
import { CustomerActions } from '../../data/store/customer.actions';
import {
  selectAllCustomers, selectCustomersLoading, selectCustomersPage,
  selectCustomersSize, selectCustomersTotalElements, selectCustomersTotalPages,
} from '../../data/store/customer.selectors';
import { Customer } from '../../data/customer.model';
import { ClientForm } from '../client-form/client-form';

const STATUS_OPTIONS = [
  { value: 'true', label: 'Actif' },
  { value: 'false', label: 'Inactif' },
];

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [PageHeader, Card, Button, Icon, SearchInput, DataTable, Paginator],
  templateUrl: './clients-list.html',
})
export class ClientsList implements OnInit {
  private readonly store = inject(Store);
  private readonly dialog = inject(DialogService);

  customers = toSignal(this.store.select(selectAllCustomers), { initialValue: [] as Customer[] });
  loading = toSignal(this.store.select(selectCustomersLoading), { initialValue: false });
  page = toSignal(this.store.select(selectCustomersPage), { initialValue: 0 });
  size = toSignal(this.store.select(selectCustomersSize), { initialValue: 20 });
  totalElements = toSignal(this.store.select(selectCustomersTotalElements), { initialValue: 0 });
  totalPages = toSignal(this.store.select(selectCustomersTotalPages), { initialValue: 0 });

  searchTerm = signal('');
  activeFilterCount = signal(0);

  columns: DataTableColumn<Customer>[] = [
    { key: 'name', header: 'Nom' },
    { key: 'email', header: 'E-mail' },
    { key: 'phone', header: 'Téléphone' },
    { key: 'city', header: 'Ville' },
    { key: 'active', header: 'Statut', align: 'center', cell: (r) => (r.active ? 'Actif' : 'Inactif') },
  ];

  ngOnInit(): void { this.store.dispatch(CustomerActions.loadPage({ page: 0 })); }
  onPageChange(page: number): void { this.store.dispatch(CustomerActions.loadPage({ page })); }

  openFilters(): void {
    const fields: FilterFieldConfig[] = [
      { key: 'city', label: 'Ville', type: 'text', placeholder: 'Ex : Douala' },
      { key: 'active', label: 'Statut', type: 'select', options: STATUS_OPTIONS },
    ];
    const ref = this.dialog.open<{ fields: FilterFieldConfig[] }, Record<string, string | number | null>>(
      FilterDialog,
      { title: 'Filtrer les clients', data: { fields } },
    );
    ref.closed$.subscribe((result) => {
      if (result === undefined) return;
      this.activeFilterCount.set(Object.keys(result).length);
      this.store.dispatch(CustomerActions.loadPage({ page: 0, filters: result as Record<string, string | number> }));
    });
  }

  create(): void {
    this.dialog.open(ClientForm, { title: 'Nouveau client', size: 'lg' });
  }

  view(customer: Customer): void {
    const data: DetailDialogData = {
      sections: [{
        title: 'Client',
        fields: [
          { label: 'Nom', value: customer.name },
          { label: 'Type', value: customer.type === 'INDIVIDUAL' ? 'Particulier' : 'Entreprise' },
          { label: 'Statut', value: customer.active ? 'Actif' : 'Inactif', tone: customer.active ? 'success' : 'neutral' },
          { label: 'E-mail', value: customer.email || '—' },
          { label: 'Téléphone', value: customer.phone || '—' },
          { label: 'Identifiant fiscal', value: customer.taxId || '—' },
          { label: 'Adresse', value: [customer.street, customer.postalCode, customer.city, customer.country].filter(Boolean).join(', ') || '—' },
        ],
      }],
    };
    this.dialog.open(DetailDialog, { title: `Client — ${customer.name}`, size: 'md', data });
  }

  edit(customer: Customer): void {
    this.dialog.open(ClientForm, { title: 'Modifier le client', size: 'lg', data: { customer } });
  }

  remove(customer: Customer): void {
    const ref = this.dialog.open<{ message: string; danger: boolean }, boolean>(ConfirmDialog, {
      title: 'Supprimer le client ?',
      data: { message: `Supprimer « ${customer.name} » ?`, danger: true },
    });
    ref.closed$.subscribe((confirmed) => {
      if (confirmed) this.store.dispatch(CustomerActions.delete({ id: customer.id }));
    });
  }
}
