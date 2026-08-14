import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { PageHeader } from '../../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../../shared/ui/card/card';
import { Button } from '../../../../../../shared/ui/button/button';
import { Icon } from '../../../../../../shared/ui/icon/icon';
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
import { Product } from '../../data/product.model';
import { ProduitForm } from '../produit-form/produit-form';
import { ProduitDetail } from '../produit-detail/produit-detail';
import { CategoryService } from '../../../categories/data/category.service';
import { formatMoney } from '../../../../../../core/utils/format';

@Component({
  selector: 'app-produits-list',
  standalone: true,
  imports: [PageHeader, Card, Button, Icon, SearchInput, DataTable, Paginator, AlertBanner],
  templateUrl: './produits-list.html',
})
export class ProduitsList implements OnInit {
  private readonly store = inject(Store);
  private readonly actions = inject(Actions);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(DialogService);
  private readonly categoryService = inject(CategoryService);
  private readonly notifications = inject(NotificationsService);

  products = toSignal(this.store.select(selectAllProducts), { initialValue: [] as Product[] });
  loading = toSignal(this.store.select(selectProductsLoading), { initialValue: false });
  page = toSignal(this.store.select(selectProductsPage), { initialValue: 0 });
  size = toSignal(this.store.select(selectProductsSize), { initialValue: 20 });
  totalElements = toSignal(this.store.select(selectProductsTotalElements), { initialValue: 0 });
  totalPages = toSignal(this.store.select(selectProductsTotalPages), { initialValue: 0 });

  /** Id of the row to pulse right after a create, so the eye lands on it. */
  flashId = signal<number | null>(null);

  constructor() {
    // When a create finishes, the reducer appends the product to the current
    // page. Flash that row and scroll it into view so the user is taken to it.
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

  columns: DataTableColumn<Product>[] = [
    { key: 'sku', header: 'SKU', width: '120px' },
    { key: 'name', header: 'Nom' },
    { key: 'unit', header: 'Unité', width: '80px' },
    { key: 'unitPurchasePrice', header: 'Prix d’achat', align: 'right',
      cell: (r) => formatMoney(r.unitPurchasePrice) },
    { key: 'unitSalePrice', header: 'Prix de vente', align: 'right',
      cell: (r) => formatMoney(r.unitSalePrice) },
    { key: 'active', header: 'Statut', align: 'center', cell: (r) => (r.active ? 'Actif' : 'Inactif') },
  ];

  ngOnInit(): void {
    this.store.dispatch(ProductActions.loadPage({ page: 0 }));
    this.notifications.refresh();
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

  /** Pulse the freshly created row and bring it into view. */
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
