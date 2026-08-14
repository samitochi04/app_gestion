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
import { documentStatusMeta } from '../../../../../core/models/status.model';
import { formatMoney, formatDate } from '../../../../../core/utils/format';
import { SupplierCreditNote } from '../../data/supplier-credit-note.model';
import { SupplierCreditNoteService } from '../../data/supplier-credit-note.service';
import { AvoirFournisseurForm } from '../avoir-fournisseur-form/avoir-fournisseur-form';

@Component({
  selector: 'app-avoirs-fournisseur-list',
  standalone: true,
  imports: [PageHeader, Card, Button, SearchInput, DataTable],
  templateUrl: './avoirs-fournisseur-list.html',
})
export class AvoirsFournisseurList implements OnInit {
  private readonly service = inject(SupplierCreditNoteService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);

  notes = signal<SupplierCreditNote[]>([]);
  loading = signal(true);
  searchTerm = signal('');

  columns: DataTableColumn<SupplierCreditNote>[] = [
    { key: 'reference', header: 'Référence', width: '150px' },
    { key: 'supplierInvoiceReference', header: 'Facture', cell: (r) => r.supplierInvoiceReference || `#${r.supplierInvoiceId}` },
    { key: 'kind', header: 'Nature', cell: (r) => (r.kind === 'RETURN' ? 'Retour' : 'Financier') },
    { key: 'status', header: 'Statut', cell: (r) => documentStatusMeta(r.status).label },
    { key: 'totalAmount', header: 'Montant', align: 'right', cell: (r) => formatMoney(r.totalAmount) },
  ];

  actions: DataTableAction<SupplierCreditNote>[] = [
    { icon: 'check-circle', label: 'Valider', visible: (r) => r.status === 'DRAFT', run: (r) => this.validate(r) },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.service.list({ page: 0, size: 100 }).subscribe({
      next: (res) => { this.notes.set(res.content); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  create(): void {
    const ref = this.dialog.open(AvoirFournisseurForm, { title: 'Nouvel avoir fournisseur', size: 'lg' });
    ref.closed$.subscribe((ok) => { if (ok) this.load(); });
  }

  view(note: SupplierCreditNote): void {
    const data: DetailDialogData = {
      sections: [
        {
          title: 'Avoir fournisseur',
          fields: [
            { label: 'Référence', value: note.reference },
            { label: 'Facture', value: note.supplierInvoiceReference || `#${note.supplierInvoiceId}` },
            { label: 'Nature', value: note.kind === 'RETURN' ? 'Retour de marchandise' : 'Avoir financier' },
            { label: 'Statut', value: documentStatusMeta(note.status).label, tone: documentStatusMeta(note.status).tone },
            { label: 'Motif', value: note.reason || '—' },
            { label: 'Montant', value: formatMoney(note.totalAmount) },
            { label: 'Créé le', value: formatDate(note.createdAt) },
          ],
        },
        {
          title: 'Lignes',
          table: {
            columns: [
              { header: 'Produit' }, { header: 'Qté', align: 'right' },
              { header: 'PU', align: 'right' }, { header: 'Total TTC', align: 'right' },
            ],
            rows: (note.lines ?? []).map((l) => [
              { text: l.productName || `Produit ${l.productId}` },
              { text: String(l.quantity ?? 0), align: 'right' as const },
              { text: formatMoney(l.unitPrice), align: 'right' as const },
              { text: formatMoney(l.amountTTC), align: 'right' as const },
            ]),
            empty: 'Aucune ligne.',
          },
        },
      ],
    };
    this.dialog.open(DetailDialog, { title: `Avoir ${note.reference}`, size: 'lg', data });
  }

  private validate(note: SupplierCreditNote): void {
    const isReturn = note.kind === 'RETURN';
    const ref = this.dialog.open<ConfirmDialogData, boolean>(ConfirmDialog, {
      title: `Valider l’avoir ${note.reference} ?`,
      data: {
        message: isReturn
          ? 'La marchandise retournée sortira de l’entrepôt d’avariés.'
          : 'L’avoir financier crédite le compte fournisseur, sans mouvement de stock.',
        confirmLabel: 'Valider',
      },
    });
    ref.closed$.subscribe((confirmed) => {
      if (!confirmed) return;
      this.service.validate(note.id).subscribe({
        next: () => { this.toast.success('Avoir validé.'); this.load(); },
        error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Validation impossible.'),
      });
    });
  }
}
