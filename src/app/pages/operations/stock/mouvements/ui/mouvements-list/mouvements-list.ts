import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { PageHeader } from '../../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../../shared/ui/card/card';
import { Button } from '../../../../../../shared/ui/button/button';
import { Icon } from '../../../../../../shared/ui/icon/icon';
import { SearchInput } from '../../../../../../shared/ui/search-input/search-input';
import { SegmentedTabs, TabOption } from '../../../../../../shared/ui/segmented-tabs/segmented-tabs';
import { DataTable, DataTableColumn } from '../../../../../../shared/ui/data-table/data-table';
import { Paginator } from '../../../../../../shared/ui/paginator/paginator';
import { AlertBanner } from '../../../../../../shared/ui/alert-banner/alert-banner';
import { DialogService } from '../../../../../../core/services/dialog.service';
import { FilterDialog, FilterFieldConfig } from '../../../../../../shared/ui/filter-dialog/filter-dialog';
import { NotificationsService } from '../../../../../../core/services/notifications.service';
import { MovementActions } from '../../data/store/movement.actions';
import {
  selectAllMovements, selectMovementsLoading, selectMovementsPage,
  selectMovementsSize, selectMovementsTotalElements, selectMovementsTotalPages,
} from '../../data/store/movement.selectors';
import { CurrentStock, StockMovement } from '../../data/movement.model';
import { MovementService } from '../../data/movement.service';
import { MouvementForm } from '../mouvement-form/mouvement-form';
import { formatMoney } from '../../../../../../core/utils/format';

const TABS: TabOption[] = [
  { value: 'mouvements', label: 'Mouvements' },
  { value: 'stock', label: 'Stock actuel' },
];

const TYPE_LABELS: Record<string, string> = {
  RECEIVE: 'Entrée', ISSUE: 'Sortie', ADJUST: 'Ajustement', TRANSFER: 'Transfert',
};

const TYPE_OPTIONS = [
  { value: 'RECEIVE', label: 'Entrée' },
  { value: 'ISSUE', label: 'Sortie' },
  { value: 'ADJUST', label: 'Ajustement' },
  { value: 'TRANSFER', label: 'Transfert' },
];

@Component({
  selector: 'app-mouvements-list',
  standalone: true,
  imports: [PageHeader, Card, Button, Icon, SearchInput, SegmentedTabs, DataTable, Paginator, AlertBanner],
  templateUrl: './mouvements-list.html',
  styleUrl: './mouvements-list.css',
})
export class MouvementsList implements OnInit {
  private readonly store = inject(Store);
  private readonly dialog = inject(DialogService);
  private readonly movementService = inject(MovementService);
  private readonly notifications = inject(NotificationsService);

  tabs = TABS;
  activeTab = signal('mouvements');

  movements = toSignal(this.store.select(selectAllMovements), { initialValue: [] as StockMovement[] });
  loading = toSignal(this.store.select(selectMovementsLoading), { initialValue: false });
  page = toSignal(this.store.select(selectMovementsPage), { initialValue: 0 });
  size = toSignal(this.store.select(selectMovementsSize), { initialValue: 20 });
  totalElements = toSignal(this.store.select(selectMovementsTotalElements), { initialValue: 0 });
  totalPages = toSignal(this.store.select(selectMovementsTotalPages), { initialValue: 0 });

  currentStock = signal<CurrentStock[]>([]);
  stockLoading = signal(false);

  movementsSearch = signal('');
  stockSearch = signal('');
  activeFilterCount = signal(0);

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
    { key: 'status', header: 'Statut' },
    { key: 'totalValue', header: 'Valeur', align: 'right', cell: (r) => formatMoney(r.totalValue) },
    { key: 'createdAt', header: 'Date', cell: (r) => new Date(r.createdAt).toLocaleDateString('fr-FR') },
  ];

  stockColumns: DataTableColumn<CurrentStock>[] = [
    { key: 'productId', header: 'Produit', cell: (r) => `#${r.productId}` },
    { key: 'warehouseId', header: 'Entrepôt', cell: (r) => `#${r.warehouseId}` },
    { key: 'totalQuantity', header: 'Quantité', align: 'right' },
    { key: 'availableQuantity', header: 'Disponible', align: 'right' },
    { key: 'totalValue', header: 'Valeur', align: 'right', cell: (r) => formatMoney(r.totalValue) },
  ];

  ngOnInit(): void {
    this.store.dispatch(MovementActions.loadPage({ page: 0 }));
    this.notifications.refresh();
  }

  selectTab(tab: string): void {
    this.activeTab.set(tab);
    if (tab === 'stock' && this.currentStock().length === 0) this.loadStock();
  }

  loadStock(): void {
    this.stockLoading.set(true);
    this.movementService.currentStock({ page: 0, size: 100 }).subscribe({
      next: (res) => { this.currentStock.set(res.content); this.stockLoading.set(false); },
      error: () => this.stockLoading.set(false),
    });
  }

  onPageChange(page: number): void {
    this.store.dispatch(MovementActions.loadPage({ page }));
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

  statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
    if (status === 'CONFIRMED') return 'success';
    if (status === 'CANCELLED') return 'danger';
    if (status === 'DRAFT') return 'neutral';
    return 'neutral';
  }

  create(): void {
    this.dialog.open(MouvementForm, { title: 'Nouveau mouvement de stock', size: 'lg' });
  }
}
