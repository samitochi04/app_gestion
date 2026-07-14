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
import { QuoteActions } from '../../data/store/quote.actions';
import {
  selectAllQuotes, selectQuotesLoading, selectQuotesPage,
  selectQuotesSize, selectQuotesTotalElements, selectQuotesTotalPages,
} from '../../data/store/quote.selectors';
import { Quote } from '../../data/quote.model';
import { DevisForm } from '../devis-form/devis-form';
import { formatMoney } from '../../../../../../core/utils/format';

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'SENT', label: 'Envoyé' },
  { value: 'VALIDATED', label: 'Validé' },
  { value: 'CONVERTED', label: 'Converti' },
  { value: 'EXPIRED', label: 'Expiré' },
];

@Component({
  selector: 'app-devis-list',
  standalone: true,
  imports: [PageHeader, Card, Button, Icon, SearchInput, DataTable, Paginator],
  templateUrl: './devis-list.html',
})
export class DevisList implements OnInit {
  private readonly store = inject(Store);
  private readonly dialog = inject(DialogService);

  quotes = toSignal(this.store.select(selectAllQuotes), { initialValue: [] as Quote[] });
  loading = toSignal(this.store.select(selectQuotesLoading), { initialValue: false });
  page = toSignal(this.store.select(selectQuotesPage), { initialValue: 0 });
  size = toSignal(this.store.select(selectQuotesSize), { initialValue: 20 });
  totalElements = toSignal(this.store.select(selectQuotesTotalElements), { initialValue: 0 });
  totalPages = toSignal(this.store.select(selectQuotesTotalPages), { initialValue: 0 });

  searchTerm = signal('');
  activeFilterCount = signal(0);

  columns: DataTableColumn<Quote>[] = [
    { key: 'reference', header: 'Référence', width: '150px' },
    { key: 'customerId', header: 'Client', cell: (r) => `#${r.customerId}` },
    { key: 'status', header: 'Statut', cell: (r) => documentStatusMeta(r.status).label },
    { key: 'totalAmountTTC', header: 'Total TTC', align: 'right', cell: (r) => formatMoney(r.totalAmountTTC) },
    { key: 'validUntil', header: 'Valide jusqu’au' },
  ];

  ngOnInit(): void { this.store.dispatch(QuoteActions.loadPage({ page: 0 })); }
  onPageChange(page: number): void { this.store.dispatch(QuoteActions.loadPage({ page })); }

  openFilters(): void {
    const fields: FilterFieldConfig[] = [
      { key: 'status', label: 'Statut', type: 'select', options: STATUS_OPTIONS },
    ];
    const ref = this.dialog.open<{ fields: FilterFieldConfig[] }, Record<string, string | number | null>>(
      FilterDialog,
      { title: 'Filtrer les devis', data: { fields } },
    );
    ref.closed$.subscribe((result) => {
      if (result === undefined) return;
      this.activeFilterCount.set(Object.keys(result).length);
      this.store.dispatch(QuoteActions.loadPage({ page: 0, filters: result as Record<string, string | number> }));
    });
  }

  create(): void {
    this.dialog.open(DevisForm, { title: 'Nouveau devis', size: 'lg' });
  }

  edit(quote: Quote): void {
    this.dialog.open(DevisForm, { title: `Devis ${quote.reference}`, size: 'lg', data: { quote } });
  }
}
