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
import { SupplierInvoice } from '../../data/supplier-invoice.model';
import { SupplierInvoiceService } from '../../data/supplier-invoice.service';
import { SupplierService } from '../../../fournisseurs/data/supplier.service';
import { FactureFournisseurForm } from '../facture-fournisseur-form/facture-fournisseur-form';
import { SupplierPaymentForm } from '../facture-fournisseur-form/supplier-payment-form';

@Component({
  selector: 'app-factures-fournisseur-list',
  standalone: true,
  imports: [PageHeader, Card, Button, SearchInput, DataTable],
  templateUrl: './factures-fournisseur-list.html',
})
export class FacturesFournisseurList implements OnInit {
  private readonly service = inject(SupplierInvoiceService);
  private readonly supplierService = inject(SupplierService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);

  invoices = signal<SupplierInvoice[]>([]);
  loading = signal(true);
  searchTerm = signal('');
  private supplierNames = new Map<number, string>();

  columns: DataTableColumn<SupplierInvoice>[] = [
    { key: 'reference', header: 'Référence', width: '150px' },
    { key: 'supplierId', header: 'Fournisseur', cell: (r) => r.supplierName || this.supplierName(r.supplierId) },
    { key: 'status', header: 'Statut', cell: (r) => documentStatusMeta(r.status).label },
    { key: 'totalAmountTTC', header: 'Total TTC', align: 'right', cell: (r) => formatMoney(r.totalAmountTTC) },
    { key: 'remainingAmount', header: 'Reste', align: 'right', cell: (r) => formatMoney(r.remainingAmount) },
    { key: 'dueDate', header: 'Échéance', cell: (r) => formatDate(r.dueDate) },
  ];

  actions: DataTableAction<SupplierInvoice>[] = [
    { icon: 'check-circle', label: 'Valider', visible: (r) => r.status === 'DRAFT', run: (r) => this.validate(r) },
    { icon: 'wallet', label: 'Enregistrer un règlement', visible: (r) => this.payable(r), run: (r) => this.pay(r) },
    { icon: 'x', label: 'Annuler', danger: true, visible: (r) => r.status === 'DRAFT', run: (r) => this.cancel(r) },
  ];

  ngOnInit(): void {
    this.supplierService.list({ page: 0, size: 200 }).subscribe((res) => {
      this.supplierNames = new Map(res.content.map((s) => [s.id, s.name]));
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.list({ page: 0, size: 100 }).subscribe({
      next: (res) => { this.invoices.set(res.content); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  create(): void {
    const ref = this.dialog.open(FactureFournisseurForm, { title: 'Nouvelle facture fournisseur', size: 'lg' });
    ref.closed$.subscribe((ok) => { if (ok) this.load(); });
  }

  view(inv: SupplierInvoice): void {
    const data: DetailDialogData = {
      sections: [
        {
          title: 'Facture fournisseur',
          fields: [
            { label: 'Référence', value: inv.reference },
            { label: 'Fournisseur', value: inv.supplierName || this.supplierName(inv.supplierId) },
            { label: 'Statut', value: documentStatusMeta(inv.status).label, tone: documentStatusMeta(inv.status).tone },
            { label: 'Émise le', value: formatDate(inv.issueDate) },
            { label: 'Échéance', value: formatDate(inv.dueDate) },
            { label: 'Total TTC', value: formatMoney(inv.totalAmountTTC) },
            { label: 'Payé', value: formatMoney(inv.paidAmount) },
            { label: 'Reste', value: formatMoney(inv.remainingAmount) },
          ],
        },
        {
          title: 'Lignes',
          table: {
            columns: [
              { header: 'Produit' }, { header: 'Qté', align: 'right' },
              { header: 'PU', align: 'right' }, { header: 'Total TTC', align: 'right' },
            ],
            rows: (inv.lines ?? []).map((l) => [
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
    this.dialog.open(DetailDialog, { title: `Facture ${inv.reference}`, size: 'lg', data });
  }

  private payable(r: SupplierInvoice): boolean {
    return ['VALIDATED', 'PARTIALLY_PAID', 'SENT', 'OVERDUE'].includes(r.status) && (r.remainingAmount ?? 0) > 0;
  }

  private validate(inv: SupplierInvoice): void {
    this.service.validate(inv.id).subscribe({
      next: () => { this.toast.success('Facture validée.'); this.load(); },
      error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Validation impossible.'),
    });
  }

  private cancel(inv: SupplierInvoice): void {
    const ref = this.dialog.open<ConfirmDialogData, boolean>(ConfirmDialog, {
      title: 'Annuler la facture ?',
      data: { message: `Annuler « ${inv.reference} » ? (brouillon uniquement)`, danger: true, confirmLabel: 'Annuler la facture' },
    });
    ref.closed$.subscribe((confirmed) => {
      if (!confirmed) return;
      this.service.cancel(inv.id).subscribe({
        next: () => { this.toast.success('Facture annulée.'); this.load(); },
        error: (e) => this.toast.error(e instanceof ApiError ? e.message : 'Annulation impossible.'),
      });
    });
  }

  private pay(inv: SupplierInvoice): void {
    const ref = this.dialog.open(SupplierPaymentForm, { title: `Règlement — ${inv.reference}`, data: { invoice: inv } });
    ref.closed$.subscribe((ok) => { if (ok) this.load(); });
  }

  private supplierName(id: number): string {
    return this.supplierNames.get(id) ?? `#${id}`;
  }
}
