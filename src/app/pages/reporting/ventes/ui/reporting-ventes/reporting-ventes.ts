import { Component, OnInit, inject, signal } from '@angular/core';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { KpiCard } from '../../../../../shared/ui/kpi-card/kpi-card';
import { Card } from '../../../../../shared/ui/card/card';
import { BarChart, BarDatum } from '../../../../../shared/ui/chart/bar-chart';
import { LineChart, ChartSeries } from '../../../../../shared/ui/chart/line-chart';
import { LoadingSkeleton } from '../../../../../shared/ui/loading-skeleton/loading-skeleton';
import { ErrorState } from '../../../../../shared/ui/error-state/error-state';
import { DashboardService } from '../../../../dashboard/data/dashboard.service';
import { SalesDashboard } from '../../../../dashboard/data/dashboard.model';
import { formatMoneyRounded } from '../../../../../core/utils/format';

@Component({
  selector: 'app-reporting-ventes',
  standalone: true,
  imports: [PageHeader, KpiCard, Card, BarChart, LineChart, LoadingSkeleton, ErrorState],
  templateUrl: './reporting-ventes.html',
  styleUrl: './reporting-ventes.css',
})
export class ReportingVentes implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  loading = signal(true);
  error = signal(false);
  data = signal<SalesDashboard | null>(null);
  topCustomers = signal<BarDatum[]>([]);
  topProducts = signal<BarDatum[]>([]);
  revenueSeries = signal<ChartSeries[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.dashboardService.sales().subscribe({
      next: (d) => {
        this.data.set(d);
        this.topCustomers.set((d.topCustomers ?? []).map((c) => ({ name: c.name, value: c.value ?? 0 })));
        this.topProducts.set((d.topProducts ?? []).map((p) => ({ name: p.name, value: p.value ?? 0 })));
        this.revenueSeries.set([{ name: 'Chiffre d’affaires', series: (d.monthlyRevenue ?? []).map((t) => ({ name: t.monthLabel, value: t.revenue ?? 0 })) }]);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.error.set(true); },
    });
  }

  currency(v: number | null | undefined): string {
    return formatMoneyRounded(v);
  }
}
