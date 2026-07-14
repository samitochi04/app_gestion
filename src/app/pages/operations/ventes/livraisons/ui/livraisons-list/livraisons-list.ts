import { Component, OnInit, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { PageHeader } from '../../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../../shared/ui/card/card';
import { DataTable, DataTableColumn } from '../../../../../../shared/ui/data-table/data-table';
import { DialogService } from '../../../../../../core/services/dialog.service';
import { documentStatusMeta } from '../../../../../../core/models/status.model';
import { OrderActions } from '../../../commandes/data/store/order.actions';
import { selectDeliveryOrders, selectOrdersLoading } from '../../../commandes/data/store/order.selectors';
import { Order } from '../../../commandes/data/order.model';
import { CommandeForm } from '../../../commandes/ui/commande-form/commande-form';

/**
 * Livraisons: a filtered view over the same Orders store — confirmed orders
 * through the shipping pipeline. No separate backend entity; reuses
 * OrderService/store from Commandes.
 */
@Component({
  selector: 'app-livraisons-list',
  standalone: true,
  imports: [PageHeader, Card, DataTable],
  templateUrl: './livraisons-list.html',
})
export class LivraisonsList implements OnInit {
  private readonly store = inject(Store);
  private readonly dialog = inject(DialogService);

  orders = toSignal(this.store.select(selectDeliveryOrders), { initialValue: [] as Order[] });
  loading = toSignal(this.store.select(selectOrdersLoading), { initialValue: false });

  columns: DataTableColumn<Order>[] = [
    { key: 'reference', header: 'Référence', width: '150px' },
    { key: 'customerId', header: 'Client', cell: (r) => `#${r.customerId}` },
    { key: 'shippingCity', header: 'Ville' },
    { key: 'status', header: 'Statut', cell: (r) => documentStatusMeta(r.status).label },
  ];

  ngOnInit(): void { this.store.dispatch(OrderActions.loadPage({ page: 0, size: 100 })); }

  edit(order: Order): void {
    this.dialog.open(CommandeForm, { title: `Commande ${order.reference}`, size: 'lg', data: { order } });
  }
}
