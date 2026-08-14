import { Component, computed, inject, signal } from '@angular/core';
import { DIALOG_DATA, DIALOG_REF, DialogRef } from '../../../../../../core/services/dialog.service';
import { Button } from '../../../../../../shared/ui/button/button';
import { Badge } from '../../../../../../shared/ui/badge/badge';
import { LoadingSkeleton } from '../../../../../../shared/ui/loading-skeleton/loading-skeleton';
import { formatMoney, formatNumber } from '../../../../../../core/utils/format';
import { Product, ProductStockInfo } from '../../data/product.model';
import { ProductService } from '../../data/product.service';
import { CategoryService } from '../../../categories/data/category.service';
import { WarehouseService } from '../../../entrepots/data/warehouse.service';

export interface ProduitDetailData { product: Product; }

/**
 * Read-only product sheet opened from the eye icon. Shows the catalogue fields
 * plus the live per-warehouse stock (`GET /api/products/{id}/stock`), which is
 * exactly what a user wants before deciding to sell, transfer or re-order.
 */
@Component({
  selector: 'app-produit-detail',
  standalone: true,
  imports: [Button, Badge, LoadingSkeleton],
  template: `
    <div class="detail">
      <section class="detail__section">
        <p class="t-h3 detail__title">Fiche produit</p>
        <dl class="detail__grid">
          <div class="detail__field"><dt class="t-caption">SKU</dt><dd>{{ product.sku }}</dd></div>
          <div class="detail__field"><dt class="t-caption">Nom</dt><dd>{{ product.name }}</dd></div>
          <div class="detail__field"><dt class="t-caption">Type</dt><dd>{{ typeLabel(product.type) }}</dd></div>
          <div class="detail__field"><dt class="t-caption">Catégorie</dt><dd>{{ categoryName() }}</dd></div>
          <div class="detail__field"><dt class="t-caption">Unité</dt><dd>{{ product.unit }}</dd></div>
          <div class="detail__field"><dt class="t-caption">Statut</dt>
            <dd><app-badge [tone]="product.active ? 'success' : 'neutral'">{{ product.active ? 'Actif' : 'Inactif' }}</app-badge></dd>
          </div>
          <div class="detail__field"><dt class="t-caption">Prix d'achat</dt><dd>{{ money(product.unitPurchasePrice) }}</dd></div>
          <div class="detail__field"><dt class="t-caption">Prix de vente</dt><dd>{{ money(product.unitSalePrice) }}</dd></div>
          <div class="detail__field"><dt class="t-caption">Marge</dt><dd>{{ marginLabel() }}</dd></div>
        </dl>
        @if (product.description) {
          <p class="t-caption detail__desc">{{ product.description }}</p>
        }
      </section>

      <section class="detail__section">
        <p class="t-h3 detail__title">Stock par entrepôt</p>
        @if (loading()) {
          <app-loading-skeleton [count]="3" [rowHeight]="28" />
        } @else if (error()) {
          <p class="t-caption detail__muted">Stock indisponible pour le moment.</p>
        } @else if (stock().length === 0) {
          <p class="t-caption detail__muted">Aucun stock enregistré pour ce produit.</p>
        } @else {
          <div class="detail__table-wrap u-scroll">
            <table class="detail__table">
              <thead>
                <tr>
                  <th>Entrepôt</th>
                  <th class="detail__td--right">Total</th>
                  <th class="detail__td--right">Réservé</th>
                  <th class="detail__td--right">Disponible</th>
                  <th class="detail__td--right">Valeur</th>
                </tr>
              </thead>
              <tbody>
                @for (s of stock(); track s.warehouseId) {
                  <tr>
                    <td>{{ warehouseName(s.warehouseId) }}</td>
                    <td class="detail__td--right">{{ num(s.totalQuantity) }}</td>
                    <td class="detail__td--right">{{ num(s.reservedQuantity) }}</td>
                    <td class="detail__td--right">{{ num(s.availableQuantity) }}</td>
                    <td class="detail__td--right">{{ money(s.totalValue) }}</td>
                  </tr>
                }
                <tr class="detail__total">
                  <td>Total</td>
                  <td class="detail__td--right">{{ num(totalQty()) }}</td>
                  <td class="detail__td--right">{{ num(totalReserved()) }}</td>
                  <td class="detail__td--right">{{ num(totalAvailable()) }}</td>
                  <td class="detail__td--right">{{ money(totalValue()) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        }
      </section>

      <div class="form-actions">
        <app-button variant="secondary" (pressed)="ref.close()">Fermer</app-button>
      </div>
    </div>
  `,
  styleUrl: '../../../../../../shared/ui/detail-dialog/detail-dialog.css',
})
export class ProduitDetail {
  private readonly service = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly warehouseService = inject(WarehouseService);

  data = inject(DIALOG_DATA) as ProduitDetailData;
  ref = inject(DIALOG_REF) as DialogRef;
  product = this.data.product;

  loading = signal(true);
  error = signal(false);
  stock = signal<ProductStockInfo[]>([]);
  private warehouseNames = signal<Map<number, string>>(new Map());
  private categoryNames = signal<Map<number, string>>(new Map());

  totalQty = computed(() => this.stock().reduce((a, s) => a + (s.totalQuantity ?? 0), 0));
  totalReserved = computed(() => this.stock().reduce((a, s) => a + (s.reservedQuantity ?? 0), 0));
  totalAvailable = computed(() => this.stock().reduce((a, s) => a + (s.availableQuantity ?? 0), 0));
  totalValue = computed(() => this.stock().reduce((a, s) => a + (s.totalValue ?? 0), 0));

  categoryName = computed(() => this.categoryNames().get(this.product.categoryId) ?? '—');

  constructor() {
    this.service.stock(this.product.id).subscribe({
      next: (lines) => { this.stock.set(lines ?? []); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
    this.categoryService.list().subscribe((cats) => {
      this.categoryNames.set(new Map(cats.map((c) => [c.id, c.name])));
    });
    this.warehouseService.list().subscribe((list) => {
      this.warehouseNames.set(new Map(list.map((w) => [w.id, w.name])));
    });
  }

  money(v: number | null | undefined): string { return formatMoney(v); }
  num(v: number | null | undefined): string { return formatNumber(v, 0); }

  typeLabel(t: string): string {
    return t === 'SERVICE' ? 'Service' : t === 'CONSUMABLE' ? 'Consommable' : 'Stockable';
  }

  marginLabel(): string {
    const m = this.product.marginPercent;
    return m == null ? '—' : `${m.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
  }

  warehouseName(id: number): string {
    return this.warehouseNames().get(id) ?? `Entrepôt #${id}`;
  }
}
