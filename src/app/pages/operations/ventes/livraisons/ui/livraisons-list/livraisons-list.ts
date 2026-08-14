import { Component, OnInit, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { PageHeader } from '../../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../../shared/ui/card/card';
import { AlertBanner } from '../../../../../../shared/ui/alert-banner/alert-banner';
import { DataTable, DataTableAction, DataTableColumn } from '../../../../../../shared/ui/data-table/data-table';
import { DialogService } from '../../../../../../core/services/dialog.service';
import { DetailDialog, DetailDialogData } from '../../../../../../shared/ui/detail-dialog/detail-dialog';
import { documentStatusMeta } from '../../../../../../core/models/status.model';
import { formatMoney } from '../../../../../../core/utils/format';
import { OrderActions } from '../../../commandes/data/store/order.actions';
import { selectDeliveryOrders, selectOrdersLoading } from '../../../commandes/data/store/order.selectors';
import { Order } from '../../../commandes/data/order.model';
import { CustomerLookupService } from '../../../clients/data/customer-lookup.service';
import { CommandeForm } from '../../../commandes/ui/commande-form/commande-form';

/**
 * Livraisons: a filtered view over the same Orders store — confirmed orders
 * through the shipping pipeline (CONFIRMED → PREPARING → SHIPPED → DELIVERED).
 * There is no separate backend delivery entity; it reuses OrderService/store.
 *
 * It reads empty until an order reaches CONFIRMED: create a commande, then
 * `Confirmer` it (which reserves stock). From here each row can be advanced —
 * Préparer, Expédier, Livrer — which is exactly the shipping lifecycle.
 * Expédier also triggers the automatic draft invoice on the billing side.
 */
@Component({
  selector: 'app-livraisons-list',
  standalone: true,
  imports: [PageHeader, Card, AlertBanner, DataTable],
  templateUrl: './livraisons-list.html',
})
export class LivraisonsList implements OnInit {
  private readonly store = inject(Store);
  private readonly dialog = inject(DialogService);
  private readonly customers = inject(CustomerLookupService);

  orders = toSignal(this.store.select(selectDeliveryOrders), { initialValue: [] as Order[] });
  loading = toSignal(this.store.select(selectOrdersLoading), { initialValue: false });

  columns: DataTableColumn<Order>[] = [
    { key: 'reference', header: 'Référence', width: '150px' },
    { key: 'customerId', header: 'Client', cell: (r) => this.customers.name(r.customerId) },
    { key: 'shippingCity', header: 'Ville' },
    { key: 'status', header: 'Statut', cell: (r) => documentStatusMeta(r.status).label },
    { key: 'totalAmountTTC', header: 'Montant TTC', align: 'right', cell: (r) => formatMoney(r.totalAmountTTC) },
  ];

  /** The shipping lifecycle, each verb visible only from the state it applies to. */
  actions: DataTableAction<Order>[] = [
    { icon: 'package', label: 'Préparer', visible: (r) => r.status === 'CONFIRMED', run: (r) => this.store.dispatch(OrderActions.prepare({ id: r.id })) },
    { icon: 'truck', label: 'Expédier', visible: (r) => r.status === 'CONFIRMED' || r.status === 'PREPARING', run: (r) => this.store.dispatch(OrderActions.ship({ id: r.id })) },
    { icon: 'check-circle', label: 'Marquer livrée', visible: (r) => r.status === 'SHIPPED', run: (r) => this.store.dispatch(OrderActions.deliver({ id: r.id })) },
  ];

  ngOnInit(): void {
    this.store.dispatch(OrderActions.loadPage({ page: 0, size: 100 }));
    this.customers.load();
  }

  view(order: Order): void {
    const data: DetailDialogData = {
      sections: [
        {
          title: 'Livraison',
          fields: [
            { label: 'Référence', value: order.reference },
            { label: 'Client', value: this.customers.name(order.customerId) },
            { label: 'Statut', value: documentStatusMeta(order.status).label, tone: documentStatusMeta(order.status).tone },
            { label: 'Adresse', value: [order.shippingStreet, order.shippingCity, order.shippingPostalCode, order.shippingCountry].filter(Boolean).join(', ') || '—' },
            { label: 'Montant TTC', value: formatMoney(order.totalAmountTTC) },
          ],
        },
        {
          title: 'Lignes',
          table: {
            columns: [
              { header: 'Produit' }, { header: 'Quantité', align: 'right' },
              { header: 'PU', align: 'right' }, { header: 'Total TTC', align: 'right' },
            ],
            rows: (order.lines ?? []).map((l) => [
              { text: l.productName || `Produit ${l.productId}` },
              { text: String(l.quantity ?? 0), align: 'right' as const },
              { text: formatMoney(l.unitSalePrice), align: 'right' as const },
              { text: formatMoney(l.amountTTC), align: 'right' as const },
            ]),
            empty: 'Aucune ligne.',
          },
        },
      ],
    };
    this.dialog.open(DetailDialog, { title: `Livraison ${order.reference}`, size: 'lg', data });
  }

  edit(order: Order): void {
    this.dialog.open(CommandeForm, { title: `Commande ${order.reference}`, size: 'lg', data: { order } });
  }
}
