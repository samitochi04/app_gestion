import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { KpiCard } from '../../../../../shared/ui/kpi-card/kpi-card';
import { Card } from '../../../../../shared/ui/card/card';
import { Badge } from '../../../../../shared/ui/badge/badge';
import { Button } from '../../../../../shared/ui/button/button';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { DateInput } from '../../../../../shared/ui/date-input/date-input';
import { Select, SelectOption } from '../../../../../shared/ui/select/select';
import { BarChart, BarDatum } from '../../../../../shared/ui/chart/bar-chart';
import { LoadingSkeleton } from '../../../../../shared/ui/loading-skeleton/loading-skeleton';
import { ErrorState } from '../../../../../shared/ui/error-state/error-state';
import { DashboardService } from '../../../../dashboard/data/dashboard.service';
import { StockDashboard } from '../../../../dashboard/data/dashboard.model';
import { WarehouseService } from '../../../../operations/stock/entrepots/data/warehouse.service';
import { ExportFormat, ReportingExportService } from '../../../../../core/services/reporting-export.service';
import { STOCK_STATUS, StatusTone } from '../../../../../core/models/status.model';
import { formatMoneyRounded } from '../../../../../core/utils/format';

const FORMAT_OPTIONS: SelectOption[] = [
  { value: 'PDF', label: 'PDF' },
  { value: 'EXCEL', label: 'Excel' },
  { value: 'CSV', label: 'CSV' },
];

@Component({
  selector: 'app-reporting-stock',
  standalone: true,
  imports: [
    FormsModule, PageHeader, KpiCard, Card, Badge, Button, FormField,
    DateInput, Select, BarChart, LoadingSkeleton, ErrorState,
  ],
  templateUrl: './reporting-stock.html',
  styleUrl: './reporting-stock.css',
})
export class ReportingStock implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly warehouseService = inject(WarehouseService);
  private readonly exports = inject(ReportingExportService);

  loading = signal(true);
  error = signal(false);
  data = signal<StockDashboard | null>(null);
  receivedSeries = signal<BarDatum[]>([]);
  issuedSeries = signal<BarDatum[]>([]);

  today = new Date().toISOString().slice(0, 10);
  firstOfYear = `${new Date().getFullYear()}-01-01`;
  from = signal(this.firstOfYear);
  to = signal(this.today);
  formatOptions = FORMAT_OPTIONS;
  format = signal<ExportFormat>('PDF');
  warehouseOptions = signal<SelectOption[]>([]);
  warehouseId = signal<number | null>(null);
  exporting = signal(false);

  ngOnInit(): void {
    this.load();
    this.warehouseService.list().subscribe((list) => {
      this.warehouseOptions.set(list.map((w) => ({ value: w.id, label: w.name })));
    });
  }

  /** Alert severity comes from the shared status system, never ad hoc colors. */
  alertTone(alertType: string): StatusTone {
    const t = (alertType || '').toUpperCase();
    if (t.includes('OUT') || t.includes('RUPTURE')) return STOCK_STATUS.OUT_OF_STOCK.tone;
    if (t.includes('EXPIR')) return STOCK_STATUS.EXPIRING.tone;
    return STOCK_STATUS.LOW.tone;
  }

  downloadStockReport(): void {
    this.exporting.set(true);
    this.exports
      .stock({ from: this.from(), to: this.to(), format: this.format() }, this.warehouseId() ?? undefined)
      .subscribe({
        next: () => this.exporting.set(false),
        error: () => this.exporting.set(false),
      });
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
