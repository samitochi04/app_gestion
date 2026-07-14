import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { KpiCard } from '../../../../shared/ui/kpi-card/kpi-card';
import { Card } from '../../../../shared/ui/card/card';
import { Badge } from '../../../../shared/ui/badge/badge';
import { SegmentedTabs, TabOption } from '../../../../shared/ui/segmented-tabs/segmented-tabs';
import { LineChart, ChartSeries } from '../../../../shared/ui/chart/line-chart';
import { BarChart, BarDatum } from '../../../../shared/ui/chart/bar-chart';
import { LoadingSkeleton } from '../../../../shared/ui/loading-skeleton/loading-skeleton';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { ErrorState } from '../../../../shared/ui/error-state/error-state';
import { DashboardService } from '../../data/dashboard.service';
import { FinancialDashboard, SalesDashboard, StockDashboard } from '../../data/dashboard.model';
import { selectPermissions } from '../../../../core/store/session/session.selectors';
import { Permission } from '../../../../core/models/permission.enum';
import { formatMoneyRounded } from '../../../../core/utils/format';

type DashboardCategory = 'sales' | 'finance' | 'stock';

const CATEGORY_TABS: TabOption[] = [
  { value: 'sales', label: 'Ventes' },
  { value: 'finance', label: 'Finances' },
  { value: 'stock', label: 'Stock' },
];

/**
 * KPI home. Fetches all 3 dashboards once (each independently error-isolated
 * — a 500 on one never blanks the others), then displays ONE category at a
 * time via the top-right filter, defaulting to Ventes. Finances includes a
 * profitability read: résultat net + a "Rentable/Déficitaire" signal, since
 * the backend only exposes a single net-result aggregate (no per-month
 * charges breakdown to chart revenue-vs-charges over time).
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [PageHeader, KpiCard, Card, Badge, SegmentedTabs, LineChart, BarChart, LoadingSkeleton, EmptyState, ErrorState],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly store = inject(Store);
  private readonly dashboardService = inject(DashboardService);

  permissions = toSignal(this.store.select(selectPermissions), { initialValue: [] as string[] });

  loading = signal(true);
  financial = signal<FinancialDashboard | null>(null);
  sales = signal<SalesDashboard | null>(null);
  stock = signal<StockDashboard | null>(null);

  financialError = signal(false);
  salesError = signal(false);
  stockError = signal(false);

  category = signal<DashboardCategory>('sales');

  private wantFinance = false;
  private wantSales = false;
  private wantStock = false;

  availableTabs = computed(() =>
    CATEGORY_TABS.filter((t) =>
      (t.value === 'sales' && this.wantSales) ||
      (t.value === 'finance' && this.wantFinance) ||
      (t.value === 'stock' && this.wantStock),
    ),
  );

  salesRevenueSeries = computed<ChartSeries[]>(() => {
    const trend = this.sales()?.monthlyRevenue ?? [];
    return [{ name: 'Chiffre d’affaires', series: trend.map((t) => ({ name: t.monthLabel, value: t.revenue ?? 0 })) }];
  });

  financeTrendSeries = computed<ChartSeries[]>(() => {
    const trend = this.financial()?.trend ?? [];
    return [
      { name: 'Facturé', series: trend.map((t) => ({ name: t.monthLabel, value: t.invoiced ?? 0 })) },
      { name: 'Encaissé', series: trend.map((t) => ({ name: t.monthLabel, value: t.collected ?? 0 })) },
    ];
  });

  stockTopSeries = computed<BarDatum[]>(() => {
    const alerts = this.stock()?.alerts ?? [];
    return alerts.slice(0, 8).map((a) => ({ name: a.productName, value: a.currentQuantity ?? 0 }));
  });

  isProfitable = computed(() => (this.financial()?.netResult ?? 0) >= 0);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const perms = this.permissions();
    this.wantFinance = perms.includes(Permission.INVOICE_READ) || perms.includes(Permission.PAYMENT_READ);
    this.wantSales = perms.includes(Permission.ORDER_READ) || perms.includes(Permission.QUOTE_READ) || perms.includes(Permission.CUSTOMER_READ);
    this.wantStock = perms.includes(Permission.PRODUCT_READ) || perms.includes(Permission.MOVEMENT_READ) || perms.includes(Permission.WAREHOUSE_READ);

    // Default to Ventes; fall back to the first category the user can actually see.
    if (!this.wantSales) {
      this.category.set(this.wantFinance ? 'finance' : this.wantStock ? 'stock' : 'sales');
    }

    this.loading.set(true);
    this.financialError.set(false);
    this.salesError.set(false);
    this.stockError.set(false);

    forkJoin({
      financial: this.wantFinance
        ? this.dashboardService.financial().pipe(catchError(() => { this.financialError.set(true); return of(null); }))
        : of(null),
      sales: this.wantSales
        ? this.dashboardService.sales().pipe(catchError(() => { this.salesError.set(true); return of(null); }))
        : of(null),
      stock: this.wantStock
        ? this.dashboardService.stock().pipe(catchError(() => { this.stockError.set(true); return of(null); }))
        : of(null),
    }).subscribe({
      next: (res) => {
        this.financial.set(res.financial);
        this.sales.set(res.sales);
        this.stock.set(res.stock);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  selectCategory(cat: string): void {
    this.category.set(cat as DashboardCategory);
  }

  currency(v: number | null | undefined): string {
    return formatMoneyRounded(v);
  }
}
