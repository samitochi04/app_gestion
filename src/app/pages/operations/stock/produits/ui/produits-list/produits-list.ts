import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PageHeader } from '../../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../../shared/ui/card/card';
import { Button } from '../../../../../../shared/ui/button/button';
import { Icon } from '../../../../../../shared/ui/icon/icon';
import { Badge } from '../../../../../../shared/ui/badge/badge';
import { SearchInput } from '../../../../../../shared/ui/search-input/search-input';
import { DataTable, DataTableColumn } from '../../../../../../shared/ui/data-table/data-table';
import { Paginator } from '../../../../../../shared/ui/paginator/paginator';
import { AlertBanner } from '../../../../../../shared/ui/alert-banner/alert-banner';
import { DialogService } from '../../../../../../core/services/dialog.service';
import { ConfirmDialog } from '../../../../../../shared/ui/confirm-dialog/confirm-dialog';
import { FilterDialog, FilterFieldConfig } from '../../../../../../shared/ui/filter-dialog/filter-dialog';
import { NotificationsService } from '../../../../../../core/services/notifications.service';
import { ProductActions } from '../../data/store/product.actions';
import {
  selectAllProducts, selectProductsLoading, selectProductsPage,
  selectProductsSize, selectProductsTotalElements, selectProductsTotalPages,
} from '../../data/store/product.selectors';
import { Product, ProductStockInfo } from '../../data/product.model';
import { ProductService } from '../../data/product.service';
import { ProduitForm } from '../produit-form/produit-form';
import { ProduitDetail } from '../produit-detail/produit-detail';
import { CategoryService } from '../../../categories/data/category.service';
import { formatMoney } from '../../../../../../core/utils/format';

/** Stock status label and color for display. */
interface StockStatus {
  label: string;
  tone: 'success' | 'warning' | 'danger' | 'neutral';
}

@Component({
  selector: 'app-produits-list',
  standalone: true,
  imports: [PageHeader, Card, Button, Icon, Badge, SearchInput, DataTable, Paginator, AlertBanner],
  templateUrl: './produits-list.html',
})
export class ProduitsList implements OnInit {
  private readonly store = inject(Store);
  private readonly actions = inject(Actions);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(DialogService);
  private readonly categoryService = inject(CategoryService);
  private readonly productService = inject(ProductService);
  private readonly notifications = inject(NotificationsService);

  products = toSignal(this.store.select(selectAllProducts), { initialValue: [] as Product[] });
  loading = toSignal(this.store.select(selectProductsLoading), { initialValue: false });
  page = toSignal(this.store.select(selectProductsPage), { initialValue: 0 });
  size = toSignal(this.store.select(selectProductsSize), { initialValue: 20 });
  totalElements = toSignal(this.store.select(selectProductsTotalElements), { initialValue: 0 });
  totalPages = toSignal(this.store.select(selectProductsTotalPages), { initialValue: 0 });

  flashId = signal<number | null>(null);

  /** Per-product stock status: productId → stock info. */
  stockByProduct = signal<Map<number, StockStatus>>(new Map());

  constructor() {
    this.actions.pipe(ofType(ProductActions.createSuccess), takeUntilDestroyed(this.destroyRef))
      .subscribe(({ product }) => this.flashRow(product.id));
  }

  searchTerm = signal('');
  activeFilters = signal<Record<string, string | number | null>>({});
  activeFilterCount = computed(() => Object.keys(this.activeFilters()).length);

  stockAlerts = computed(() => this.notifications.items().filter((n) => n.id.startsWith('stock-')));
  stockBannerTone = computed<'success' | 'warning' | 'danger'>(() => {
    const alerts = this.stockAlerts();
    if (alerts.some((a) => a.tone === 'danger')) return 'danger';
    if (alerts.length > 0) return 'warning';
    return 'success';
  });

  /** Count of out-of-stock products. */
  outOfStockCount = computed(() => {
    const map = this.stockByProduct();
    let count = 0;
    map.forEach((s) => { if (s.tone === 'danger') count++; });
    return count;
  });

  columns: DataTableColumn<Product>[] = [
    { key: 'sku', header: 'SKU', width: '120px' },
    { key: 'name', header: 'Nom' },
    { key: 'unit', header: 'Unité', width: '80px' },
    { key: 'unitPurchasePrice', header: 'Prix d\'achat', align: 'right',
      cell: (r) => formatMoney(r.unitPurchasePrice) },
    { key: 'unitSalePrice', header: 'Prix de vente', align: 'right',
      cell: (r) => formatMoney(r.unitSalePrice) },
    { key: 'stockStatus', header: 'Stock', align: 'center',
      cell: (r) => this.getStockLabel(r.id) },
    { key: 'active', header: 'Statut', align: 'center', cell: (r) => (r.active ? 'Actif' : 'Inactif') },
  ];

  ngOnInit(): void {
    this.store.dispatch(ProductActions.loadPage({ page: 0 }));
    this.notifications.refresh();
    this.loadStockStatuses();
  }

  /** Fetch stock info for each product and compute status labels. */
  private loadStockStatuses(): void {
    this.productService.list({ page: 0, size: 500 }).subscribe((res) => {
      if (res.content.length === 0) return;
      const requests = res.content.map((p) =>
        this.productService.stock(p.id).pipe(catchError(() => of([] as ProductStockInfo[]))),
      );
      forkJoin(requests).subscribe((results) => {
        const map = new Map<number, StockStatus>();
        results.forEach((stockList, idx) => {
          const product = res.content[idx];
          const totalAvailable = stockList.reduce((sum, s) => sum + (s.availableQuantity ?? 0), 0);
          const totalQuantity = stockList.reduce((sum, s) => sum + (s.totalQuantity ?? 0), 0);

          if (totalQuantity <= 0) {
            map.set(product.id, { label: 'Rupture', tone: 'danger' });
          } else if (totalAvailable <= 0) {
            map.set(product.id, { label: 'Tout réservé', tone: 'warning' });
          } else if (totalAvailable <= 5) {
            map.set(product.id, { label: `Stock bas (${totalAvailable})`, tone: 'warning' });
          } else {
            map.set(product.id, { label: `${totalAvailable}`, tone: 'success' });
          }
        });
        this.stockByProduct.set(map);
      });
    });
  }

  getStockLabel(productId: number): string {
    const status = this.stockByProduct().get(productId);
    return status?.label ?? '—';
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  onPageChange(page: number): void {
    this.store.dispatch(ProductActions.loadPage({ page }));
  }

  openFilters(): void {
    this.categoryService.list().subscribe((categories) => {
      const fields: FilterFieldConfig[] = [
        { key: 'categoryId', label: 'Catégorie', type: 'select',
          options: categories.map((c) => ({ value: c.id, label: c.name })) },
        { key: 'active', label: 'Statut', type: 'select',
          options: [{ value: 'true', label: 'Actif' }, { value: 'false', label: 'Inactif' }] },
      ];
      const ref = this.dialog.open<{ fields: FilterFieldConfig[]; initial: Record<string, string | number | null> }, Record<string, string | number | null>>(
        FilterDialog,
        { title: 'Filtrer les produits', data: { fields, initial: this.activeFilters() } },
      );
      ref.closed$.subscribe((result) => {
        if (result === undefined) return;
        this.activeFilters.set(result);
        this.store.dispatch(ProductActions.loadPage({ page: 0, filters: result as Record<string, string | number> }));
      });
    });
  }

  create(): void {
    this.dialog.open(ProduitForm, { title: 'Nouveau produit', size: 'lg' });
  }

  view(product: Product): void {
    this.dialog.open(ProduitDetail, { title: `Produit — ${product.name}`, size: 'lg', data: { product } });
  }

  edit(product: Product): void {
    this.dialog.open(ProduitForm, { title: 'Modifier le produit', size: 'lg', data: { product } });
  }

  private flashRow(id: number): void {
    this.flashId.set(id);
    setTimeout(() => {
      document.querySelector(`[data-row-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
    setTimeout(() => this.flashId.set(null), 2200);
  }

  remove(product: Product): void {
    const ref = this.dialog.open<{ message: string; danger: boolean }, boolean>(ConfirmDialog, {
      title: 'Supprimer le produit ?',
      data: { message: `Supprimer définitivement « ${product.name} » ?`, danger: true },
    });
    ref.closed$.subscribe((confirmed) => {
      if (confirmed) this.store.dispatch(ProductActions.delete({ id: product.id }));
    });
  }
}
