import { Component, OnInit, inject, signal } from '@angular/core';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../shared/ui/card/card';
import { Button } from '../../../../../shared/ui/button/button';
import { SearchInput } from '../../../../../shared/ui/search-input/search-input';
import { DataTable, DataTableColumn } from '../../../../../shared/ui/data-table/data-table';
import { DialogService } from '../../../../../core/services/dialog.service';
import { documentStatusMeta } from '../../../../../core/models/status.model';
import { CreditNote } from '../../data/credit-note.model';
import { CreditNoteService } from '../../data/credit-note.service';
import { AvoirForm } from '../avoir-form/avoir-form';
import { formatMoney } from '../../../../../core/utils/format';

@Component({
  selector: 'app-avoirs-list',
  standalone: true,
  imports: [PageHeader, Card, Button, SearchInput, DataTable],
  templateUrl: './avoirs-list.html',
})
export class AvoirsList implements OnInit {
  private readonly service = inject(CreditNoteService);
  private readonly dialog = inject(DialogService);

  creditNotes = signal<CreditNote[]>([]);
  loading = signal(true);
  searchTerm = signal('');

  columns: DataTableColumn<CreditNote>[] = [
    { key: 'reference', header: 'Référence', width: '150px' },
    { key: 'type', header: 'Type' },
    { key: 'reason', header: 'Motif' },
    { key: 'status', header: 'Statut', cell: (r) => documentStatusMeta(r.status).label },
    { key: 'totalAmount', header: 'Montant', align: 'right', cell: (r) => formatMoney(r.totalAmount) },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.service.list({ page: 0, size: 50 }).subscribe({
      next: (res) => { this.creditNotes.set(res.content); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  create(): void {
    const ref = this.dialog.open(AvoirForm, { title: 'Nouvel avoir', size: 'lg' });
    ref.closed$.subscribe((ok) => { if (ok) this.load(); });
  }
}
