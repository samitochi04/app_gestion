import { Component, OnInit, inject, signal } from '@angular/core';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { KpiCard } from '../../../../../shared/ui/kpi-card/kpi-card';
import { Card } from '../../../../../shared/ui/card/card';
import { Badge } from '../../../../../shared/ui/badge/badge';
import { BarChart, BarDatum } from '../../../../../shared/ui/chart/bar-chart';
import { LoadingSkeleton } from '../../../../../shared/ui/loading-skeleton/loading-skeleton';
import { ErrorState } from '../../../../../shared/ui/error-state/error-state';
import { DashboardService } from '../../../../dashboard/data/dashboard.service';
import { StockDashboard } from '../../../../dashboard/data/dashboard.model';
import { formatMoneyRounded } from '../../../../../core/utils/format';

@Component({
  selector: 'app-reporting-stock',
  standalone: true,
  imports: [PageHeader, KpiCard, Card, Badge, BarChart, LoadingSkeleton, ErrorState],
  templateUrl: './reporting-stock.html',
  styleUrl: './reporting-stock.css',
})
export class ReportingStock implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  loading = signal(true);
  error = signal(false);
  data = signal<StockDashboard | null>(null);
  receivedSeries = signal<BarDatum[]>([]);
  issuedSeries = signal<BarDatum[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.dashboardService.stock().subscribe({
      next: (d) => {
        this.data.set(d);
        this.receivedSeries.set((d.topReceivedProducts ?? []).map((p) => ({ name: p.name, value: p.value ?? 0 })));
        this.issuedSeries.set((d.topIssuedProducts ?? []).map((p) => ({ name: p.name, value: p.value ?? 0 })));
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.error.set(true); },
    });
  }

  currency(v: number | null | undefined): string {
    return formatMoneyRounded(v);
  }
}
