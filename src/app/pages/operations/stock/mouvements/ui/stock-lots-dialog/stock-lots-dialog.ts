import { Component, inject, signal } from '@angular/core';
import { DIALOG_DATA } from '../../../../../../core/services/dialog.service';
import { DataTable, DataTableColumn } from '../../../../../../shared/ui/data-table/data-table';
import { Badge } from '../../../../../../shared/ui/badge/badge';
import { StatusTone, deriveExpiryStatus, STOCK_STATUS } from '../../../../../../core/models/status.model';
import { formatMoney } from '../../../../../../core/utils/format';
import { StockLot } from '../../data/movement.model';
import { MovementService } from '../../data/movement.service';

export interface StockLotsDialogData { productId: number; productName: string; }

/**
 * Lots of one product, in the order stock is consumed: FEFO — first expired,
 * first out — which is why the expiry column leads the reading.
 */
@Component({
  selector: 'app-stock-lots-dialog',
  standalone: true,
  imports: [DataTable, Badge],
  template: `
    <p class="t-caption lots-intro">
      Les lots sont consommés au plus proche de la péremption (FEFO).
    </p>
    @if (expiringCount() > 0) {
      <app-badge tone="warning">{{ expiringCount() }} lot(s) à surveiller</app-badge>
    }
    <app-data-table
      [columns]="columns" [rows]="lots()" [loading]="loading()"
      emptyTitle="Aucun lot" emptyMessage="Ce produit n’a aucun lot en stock."
      [showActions]="false"
    />
  `,
  styles: [`
    .lots-intro { margin: 0 0 var(--space-3); }
    app-badge { margin-bottom: var(--space-3); display: inline-block; }
  `],
})
export class StockLotsDialog {
  private readonly service = inject(MovementService);
  data = inject(DIALOG_DATA) as StockLotsDialogData;

  lots = signal<StockLot[]>([]);
  loading = signal(true);
  expiringCount = signal(0);

  columns: DataTableColumn<StockLot>[] = [
    { key: 'batchNumber', header: 'N° de lot', cell: (r) => r.batchNumber || '—' },
    { key: 'expirationDate', header: 'Péremption', cell: (r) => this.expiryLabel(r) },
    { key: 'quantity', header: 'Quantité', align: 'right' },
    { key: 'availableQuantity', header: 'Disponible', align: 'right' },
    { key: 'unitCost', header: 'Coût unitaire', align: 'right', cell: (r) => formatMoney(r.unitCost) },
  ];

  constructor() {
    this.service.lots(this.data.productId).subscribe({
      next: (lots) => {
        this.lots.set(lots);
        this.expiringCount.set(lots.filter((l) => l.expired || deriveExpiryStatus(l.expirationDate)).length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  tone(lot: StockLot): StatusTone {
    if (lot.expired) return STOCK_STATUS.EXPIRED.tone;
    const status = deriveExpiryStatus(lot.expirationDate);
    return status ? STOCK_STATUS[status].tone : 'neutral';
  }

  private expiryLabel(lot: StockLot): string {
    if (!lot.expirationDate) return '—';
    const date = new Date(lot.expirationDate).toLocaleDateString('fr-FR');
    if (lot.expired) return `${date} · périmé`;
    const status = deriveExpiryStatus(lot.expirationDate);
    return status === 'EXPIRING' ? `${date} · bientôt` : date;
  }
}
