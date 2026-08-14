import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { PageHeader } from '../../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../../shared/ui/card/card';
import { Button } from '../../../../../../shared/ui/button/button';
import { Icon } from '../../../../../../shared/ui/icon/icon';
import { SearchInput } from '../../../../../../shared/ui/search-input/search-input';
import { SegmentedTabs, TabOption } from '../../../../../../shared/ui/segmented-tabs/segmented-tabs';
import { DataTable, DataTableAction, DataTableColumn } from '../../../../../../shared/ui/data-table/data-table';
import { Paginator } from '../../../../../../shared/ui/paginator/paginator';
import { AlertBanner } from '../../../../../../shared/ui/alert-banner/alert-banner';
import { FormField } from '../../../../../../shared/ui/form-field/form-field';
import { DateInput } from '../../../../../../shared/ui/date-input/date-input';
import { KpiCard } from '../../../../../../shared/ui/kpi-card/kpi-card';
import { DialogService } from '../../../../../../core/services/dialog.service';
import { DetailDialog, DetailDialogData } from '../../../../../../shared/ui/detail-dialog/detail-dialog';
import { FilterDialog, FilterFieldConfig } from '../../../../../../shared/ui/filter-dialog/filter-dialog';
import { NotificationsService } from '../../../../../../core/services/notifications.service';
import { documentStatusMeta } from '../../../../../../core/models/status.model';
import { formatMoney } from '../../../../../../core/utils/format';
import { MovementActions } from '../../data/store/movement.actions';
import {
  selectAllMovements, selectMovementsLoading, selectMovementsPage,
  selectMovementsSize, selectMovementsTotalElements, selectMovementsTotalPages,
} from '../../data/store/movement.selectors';
import { CurrentStock, StockMovement, StockValuation, ValuationLine } from '../../data/movement.model';
import { MovementService } from '../../data/movement.service';
import { MouvementForm } from '../mouvement-form/mouvement-form';
import { StockLotsDialog } from '../stock-lots-dialog/stock-lots-dialog';
import { ProductService } from '../../../produits/data/product.service';
import { WarehouseService } from '../../../entrepots/data/warehouse.service';

const TABS: TabOption[] = [
  { value: 'mouvements', label: 'Mouvements' },
  { value: 'stock', label: 'Stock actuel' },
  { value: 'valorisation', label: 'Valorisation' },
];

/** Backend `MovementType` values, which differ from the form's verbs. */
const TYPE_LABELS: Record<string, string> = {
  IN: 'Entrée',
  OUT: 'Sortie',
  ADJUSTMENT: 'Ajustement',
  TRANSFER: 'Transfert',
};

const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));

@Component({
  selector: 'app-mouvements-list',
  standalone: true,
  imports: [
    FormsModule, PageHeader, Card, Button, Icon, SearchInput, SegmentedTabs,
    DataTable, Paginator, AlertBanner, FormField, DateInput, KpiCard,
  ],
  templateUrl: './mouvements-list.html',
  styleUrl: './mouvements-list.css',
})
export class MouvementsList implements OnInit {
  private readonly store = inject(Store);
  private readonly dialog = inject(DialogService);
  private readonly movementService = inject(MovementService);
  private readonly productService = inject(ProductService);
  private readonly warehouseService = inject(WarehouseService);
  private readonly notifications = inject(NotificationsService);

  tabs = TABS;
  activeTab = signal('mouvements');
  /** One search box serves whichever table is on screen. */
  search = signal('');
  activeFilterCount = signal(0);

  movements = toSignal(this.store.select(selectAllMovements), { initialValue: [] as StockMovement[] });
  loading = toSignal(this.store.select(selectMovementsLoading), { initialValue: false });
  page = toSignal(this.store.select(selectMovementsPage), { initialValue: 0 });
  size = toSignal(this.store.select(selectMovementsSize), { initialValue: 20 });
  totalElements = toSignal(this.store.select(selectMovementsTotalElements), { initialValue: 0 });
  totalPages = toSignal(this.store.select(selectMovementsTotalPages), { initialValue: 0 });

  currentStock = signal<CurrentStock[]>([]);
  stockLoading = signal(false);

  valuation = signal<StockValuation | null>(null);
  valuationLoading = signal(false);
  valuationDate = signal('');

  /** Ids are meaningless on screen; resolve them once and read from the maps. */
  private readonly productNames = signal<Map<number, string>>(new Map());
  private readonly warehouseNames = signal<Map<number, string>>(new Map());

  stockAlerts = computed(() => this.notifications.items().filter((n) => n.id.startsWith('stock-')));
  stockBannerTone = computed<'success' | 'warning' | 'danger'>(() => {
    const alerts = this.stockAlerts();
    if (alerts.some((a) => a.tone === 'danger')) return 'danger';
    if (alerts.length > 0) return 'warning';
    return 'success';
  });

  movementColumns: DataTableColumn<StockMovement>[] = [
    { key: 'reference', header: 'Référence', width: '160px' },
    { key: 'type', header: 'Type', cell: (r) => TYPE_LABELS[r.type] ?? r.type },
    { key: 'warehouseId', header: 'Entrepôt', cell: (r) => this.warehouseName(r.warehouseId) },
    { key: 'status', header: 'Statut', cell: (r) => documentStatusMeta(r.status).label },
    { key: 'totalValue', header: 'Valeur', align: 'right', cell: (r) => formatMoney(r.totalValue) },
    { key: 'operationDate', header: 'Date', cell: (r) => this.dateOf(r) },
  ];

  stockColumns: DataTableColumn<CurrentStock>[] = [
    { key: 'productId', header: 'Produit', cell: (r) => this.productName(r.productId) },
    { key: 'warehouseId', header: 'Entrepôt', cell: (r) => this.warehouseName(r.warehouseId) },
    { key: 'totalQuantity', header: 'Quantité', align: 'right' },
    { key: 'reservedQuantity', header: 'Réservé', align: 'right' },
    { key: 'availableQuantity', header: 'Disponible', align: 'right' },
    { key: 'stockValue', header: 'Valeur', align: 'right', cell: (r) => formatMoney(r.stockValue) },
  ];

  valuationColumns: DataTableColumn<ValuationLine>[] = [
    { key: 'productName', header: 'Produit' },
    { key: 'quantity', header: 'Quantité', align: 'right' },
    { key: 'unitPurchasePrice', header: 'PA unitaire', align: 'right', cell: (r) => formatMoney(r.unitPurchasePrice) },
    { key: 'stockValue', header: 'Valeur stock', align: 'right', cell: (r) => formatMoney(r.stockValue) },
    { key: 'saleValue', header: 'Valeur vente', align: 'right', cell: (r) => formatMoney(r.saleValue) },
    { key: 'potentialMargin', header: 'Marge potentielle', align: 'right', cell: (r) => formatMoney(r.potentialMargin) },
  ];

  stockActions: DataTableAction<CurrentStock>[] = [
    { icon: 'package', label: 'Voir les lots', run: (r) => this.openLots(r) },
  ];

  ngOnInit(): void {
    this.store.dispatch(MovementActions.loadPage({ page: 0 }));
    this.notifications.refresh();
    this.loadLookups();
  }

  money(v: number | null | undefined): string { return formatMoney(v); }

  selectTab(tab: string): void {
    this.activeTab.set(tab);
    if (tab === 'stock' && this.currentStock().length === 0) this.loadStock();
    if (tab === 'valorisation' && !this.valuation()) this.loadValuation();
  }

  onPageChange(page: number): void {
    this.store.dispatch(MovementActions.loadPage({ page }));
  }

  onValuationDate(date: string): void {
    this.valuationDate.set(date);
    this.loadValuation();
  }

  openFilters(): void {
    const fields: FilterFieldConfig[] = [
      { key: 'type', label: 'Type de mouvement', type: 'select', options: TYPE_OPTIONS },
      { key: 'from', label: 'Du', type: 'date' },
      { key: 'to', label: 'Au', type: 'date' },
    ];
    const ref = this.dialog.open<{ fields: FilterFieldConfig[] }, Record<string, string | number | null>>(
      FilterDialog,
      { title: 'Filtrer les mouvements', data: { fields } },
    );
    ref.closed$.subscribe((result) => {
      if (result === undefined) return;
      this.activeFilterCount.set(Object.keys(result).length);
      this.store.dispatch(MovementActions.loadPage({ page: 0, filters: result as Record<string, string | number> }));
    });
  }

  create(): void {
    const ref = this.dialog.open(MouvementForm, { title: 'Nouveau mouvement de stock', size: 'lg' });
    ref.closed$.subscribe(() => {
      this.store.dispatch(MovementActions.loadPage({ page: 0 }));
      if (this.currentStock().length) this.loadStock();
    });
  }

  private openLots(row: CurrentStock): void {
    this.dialog.open(StockLotsDialog, {
      title: `Lots — ${this.productName(row.productId)}`,
      size: 'lg',
      data: { productId: row.productId, productName: this.productName(row.productId) },
    });
  }

  /**
   * Read-only movement sheet, opened from the eye icon on the Mouvements tab.
   * Previously that tab had no working action (only the Stock tab's "Voir les
   * lots"), and a transfer's line prices/values had nowhere to be inspected —
   * this shows the header plus every line with its unit cost and line total.
   */
  viewMovement(m: StockMovement): void {
    const lines = m.lines ?? [];
    const header = [
      { label: 'Référence', value: m.reference || '—' },
      { label: 'Type', value: TYPE_LABELS[m.type] ?? m.type },
      { label: 'Statut', value: documentStatusMeta(m.status).label },
      { label: 'Entrepôt', value: this.warehouseName(m.warehouseId) },
    ];
    if (m.destWarehouseId != null) {
      header.push({ label: 'Entrepôt destination', value: this.warehouseName(m.destWarehouseId) });
    }
    header.push({ label: 'Date', value: this.dateOf(m) });
    header.push({ label: 'Valeur totale', value: formatMoney(m.totalValue) });

    const data: DetailDialogData = {
      sections: [
        { title: 'Mouvement', fields: header },
        {
          title: 'Lignes',
          table: {
            columns: [
              { header: 'Produit' },
              { header: 'Quantité', align: 'right' },
              { header: 'Coût unitaire', align: 'right' },
              { header: 'Total ligne', align: 'right' },
            ],
            rows: lines.map((l) => [
              { text: l.productName || this.productName(l.productId) },
              { text: String(l.quantity ?? 0), align: 'right' as const },
              { text: formatMoney(l.unitCost), align: 'right' as const },
              { text: formatMoney(l.lineTotal ?? (l.unitCost ?? 0) * (l.quantity ?? 0)), align: 'right' as const },
            ]),
            empty: 'Aucune ligne sur ce mouvement.',
          },
        },
      ],
    };
    this.dialog.open(DetailDialog, { title: `Mouvement ${m.reference || ''}`.trim(), size: 'lg', data });
  }

  private loadStock(): void {
    this.stockLoading.set(true);
    this.movementService.currentStock({ page: 0, size: 200 }).subscribe({
      next: (res) => { this.currentStock.set(res.content); this.stockLoading.set(false); },
      error: () => this.stockLoading.set(false),
    });
  }

  private loadValuation(): void {
    this.valuationLoading.set(true);
    this.movementService.valuation(this.valuationDate() || undefined).subscribe({
      next: (v) => { this.valuation.set(v); this.valuationLoading.set(false); },
      error: () => this.valuationLoading.set(false),
    });
  }

  private loadLookups(): void {
    this.productService.list({ page: 0, size: 500 }).subscribe((res) => {
      this.productNames.set(new Map(res.content.map((p) => [p.id, `${p.sku} — ${p.name}`])));
    });
    this.warehouseService.list().subscribe((list) => {
      this.warehouseNames.set(new Map(list.map((w) => [w.id, w.name])));
    });
  }

  private productName(id: number): string {
    return this.productNames().get(id) ?? `#${id}`;
  }

  private warehouseName(id: number | undefined): string {
    return id == null ? '—' : this.warehouseNames().get(id) ?? `#${id}`;
  }

  private dateOf(m: StockMovement): string {
    const raw = m.operationDate ?? m.confirmedAt ?? m.createdAt;
    return raw ? new Date(raw).toLocaleDateString('fr-FR') : '—';
  }
}
