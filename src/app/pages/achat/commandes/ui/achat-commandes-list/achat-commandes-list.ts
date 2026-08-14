import { Component, OnInit, inject, signal } from '@angular/core';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../shared/ui/card/card';
import { Button } from '../../../../../shared/ui/button/button';
import { SearchInput } from '../../../../../shared/ui/search-input/search-input';
import { DataTable, DataTableColumn } from '../../../../../shared/ui/data-table/data-table';
import { DialogService } from '../../../../../core/services/dialog.service';
import { DetailDialog, DetailDialogData } from '../../../../../shared/ui/detail-dialog/detail-dialog';
import { documentStatusMeta } from '../../../../../core/models/status.model';
import { formatMoney, formatDate } from '../../../../../core/utils/format';
import { PurchaseOrder } from '../../data/purchase-order.model';
import { PurchaseOrderService } from '../../data/purchase-order.service';
import { SupplierService } from '../../../fournisseurs/data/supplier.service';
import { AchatCommandeForm } from '../achat-commande-form/achat-commande-form';

@Component({
  selector: 'app-achat-commandes-list',
  standalone: true,
  imports: [PageHeader, Card, Button, SearchInput, DataTable],
  templateUrl: './achat-commandes-list.html',
})
export class AchatCommandesList implements OnInit {
  private readonly service = inject(PurchaseOrderService);
  private readonly supplierService = inject(SupplierService);
  private readonly dialog = inject(DialogService);

  orders = signal<PurchaseOrder[]>([]);
  loading = signal(true);
  searchTerm = signal('');
  private supplierNames = new Map<number, string>();

  columns: DataTableColumn<PurchaseOrder>[] = [
    { key: 'reference', header: 'Référence', width: '150px' },
    { key: 'supplierId', header: 'Fournisseur', cell: (r) => r.supplierName || this.supplierName(r.supplierId) },
    { key: 'status', header: 'Statut', cell: (r) => documentStatusMeta(r.status).label },
    { key: 'totalAmountTTC', header: 'Montant TTC', align: 'right', cell: (r) => formatMoney(r.totalAmountTTC) },
    { key: 'createdAt', header: 'Créée le', cell: (r) => formatDate(r.createdAt) },
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
      next: (res) => { this.orders.set(res.content); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  create(): void {
    const ref = this.dialog.open(AchatCommandeForm, { title: 'Nouvelle commande d’achat', size: 'lg' });
    ref.closed$.subscribe((ok) => { if (ok) this.load(); });
  }

  edit(order: PurchaseOrder): void {
    const ref = this.dialog.open(AchatCommandeForm, { title: `Commande ${order.reference}`, size: 'lg', data: { order } });
    ref.closed$.subscribe((ok) => { if (ok) this.load(); });
  }

  view(order: PurchaseOrder): void {
    const data: DetailDialogData = {
      sections: [
        {
          title: 'Commande d’achat',
          fields: [
            { label: 'Référence', value: order.reference },
            { label: 'Fournisseur', value: order.supplierName || this.supplierName(order.supplierId) },
            { label: 'Statut', value: documentStatusMeta(order.status).label, tone: documentStatusMeta(order.status).tone },
            { label: 'Date attendue', value: formatDate(order.expectedDate) },
            { label: 'Total HT', value: formatMoney(order.totalAmountHT) },
            { label: 'Total TTC', value: formatMoney(order.totalAmountTTC) },
          ],
        },
        {
          title: 'Lignes',
          table: {
            columns: [
              { header: 'Produit' }, { header: 'Nature' }, { header: 'Qté', align: 'right' },
              { header: 'Reçu', align: 'right' }, { header: 'PU', align: 'right' }, { header: 'Total TTC', align: 'right' },
            ],
            rows: (order.lines ?? []).map((l) => [
              { text: l.productName || `Produit ${l.productId}` },
              { text: l.nature === 'SERVICE' ? 'Prestation' : 'Marchandise' },
              { text: String(l.quantity ?? 0), align: 'right' as const },
              { text: String(l.receivedQuantity ?? 0), align: 'right' as const },
              { text: formatMoney(l.unitPrice), align: 'right' as const },
              { text: formatMoney(l.amountTTC), align: 'right' as const },
            ]),
            empty: 'Aucune ligne.',
          },
        },
      ],
    };
    this.dialog.open(DetailDialog, { title: `Commande ${order.reference}`, size: 'lg', data });
  }

  private supplierName(id: number): string {
    return this.supplierNames.get(id) ?? `#${id}`;
  }
}
