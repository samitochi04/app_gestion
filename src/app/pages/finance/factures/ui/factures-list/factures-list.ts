import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../shared/ui/card/card';
import { Button } from '../../../../../shared/ui/button/button';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { SearchInput } from '../../../../../shared/ui/search-input/search-input';
import { DataTable, DataTableColumn } from '../../../../../shared/ui/data-table/data-table';
import { Paginator } from '../../../../../shared/ui/paginator/paginator';
import { AlertBanner } from '../../../../../shared/ui/alert-banner/alert-banner';
import { DialogService } from '../../../../../core/services/dialog.service';
import { FilterDialog, FilterFieldConfig } from '../../../../../shared/ui/filter-dialog/filter-dialog';
import { NotificationsService } from '../../../../../core/services/notifications.service';
import { documentStatusMeta } from '../../../../../core/models/status.model';
import { InvoiceActions } from '../../data/store/invoice.actions';
import {
  selectAllInvoices, selectInvoicesLoading, selectInvoicesPage,
  selectInvoicesSize, selectInvoicesTotalElements, selectInvoicesTotalPages,
} from '../../data/store/invoice.selectors';
import { Invoice } from '../../data/invoice.model';
import { FactureForm } from '../facture-form/facture-form';
import { formatMoney } from '../../../../../core/utils/format';

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'VALIDATED', label: 'Validé' },
  { value: 'SENT', label: 'Envoyé' },
  { value: 'PAID', label: 'Payé' },
  { value: 'PARTIALLY_PAID', label: 'Partiellement payé' },
  { value: 'OVERDUE', label: 'En retard' },
  { value: 'CANCELLED', label: 'Annulé' },
];

@Component({
  selector: 'app-factures-list',
  standalone: true,
  imports: [PageHeader, Card, Button, Icon, SearchInput, DataTable, Paginator, AlertBanner],
  templateUrl: './factures-list.html',
})
export class FacturesList implements OnInit {
  private readonly store = inject(Store);
  private readonly dialog = inject(DialogService);
  private readonly notifications = inject(NotificationsService);

  invoices = toSignal(this.store.select(selectAllInvoices), { initialValue: [] as Invoice[] });
  loading = toSignal(this.store.select(selectInvoicesLoading), { initialValue: false });
  page = toSignal(this.store.select(selectInvoicesPage), { initialValue: 0 });
  size = toSignal(this.store.select(selectInvoicesSize), { initialValue: 20 });
  totalElements = toSignal(this.store.select(selectInvoicesTotalElements), { initialValue: 0 });
  totalPages = toSignal(this.store.select(selectInvoicesTotalPages), { initialValue: 0 });

  searchTerm = signal('');
  activeFilterCount = signal(0);

  invoiceAlerts = computed(() => this.notifications.items().filter((n) => n.id.startsWith('invoices-')));
  invoiceBannerTone = computed<'success' | 'warning' | 'danger'>(() => {
    const alerts = this.invoiceAlerts();
    if (alerts.some((a) => a.tone === 'danger')) return 'danger';
    if (alerts.length > 0) return 'warning';
    return 'success';
  });
  invoiceBannerMessage = computed(() => this.invoiceAlerts().map((a) => a.message).join(' ') || 'Aucune facture en retard ou en attente.');

  columns: DataTableColumn<Invoice>[] = [
    { key: 'reference', header: 'Référence', width: '150px' },
    { key: 'customerName', header: 'Client' },
    { key: 'status', header: 'Statut', cell: (r) => documentStatusMeta(r.status).label },
    { key: 'totalAmountTTC', header: 'Total TTC', align: 'right', cell: (r) => formatMoney(r.totalAmountTTC) },
    { key: 'remainingAmount', header: 'Restant dû', align: 'right', cell: (r) => formatMoney(r.remainingAmount) },
    { key: 'dueDate', header: 'Échéance' },
  ];

  ngOnInit(): void {
    this.store.dispatch(InvoiceActions.loadPage({ page: 0 }));
    this.notifications.refresh();
  }

  onPageChange(page: number): void { this.store.dispatch(InvoiceActions.loadPage({ page })); }

  openFilters(): void {
    const fields: FilterFieldConfig[] = [
      { key: 'status', label: 'Statut', type: 'select', options: STATUS_OPTIONS },
      { key: 'from', label: 'Échéance du', type: 'date' },
      { key: 'to', label: 'Échéance au', type: 'date' },
    ];
    const ref = this.dialog.open<{ fields: FilterFieldConfig[] }, Record<string, string | number | null>>(
      FilterDialog,
      { title: 'Filtrer les factures', data: { fields } },
    );
    ref.closed$.subscribe((result) => {
      if (result === undefined) return;
      this.activeFilterCount.set(Object.keys(result).length);
      this.store.dispatch(InvoiceActions.loadPage({ page: 0, filters: result as Record<string, string | number> }));
    });
  }

  create(): void {
    this.dialog.open(FactureForm, { title: 'Nouvelle facture', size: 'lg' });
  }

  edit(invoice: Invoice): void {
    this.dialog.open(FactureForm, { title: `Facture ${invoice.reference}`, size: 'lg', data: { invoice } });
  }
}
