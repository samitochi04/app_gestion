import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { KpiCard } from '../../../../../shared/ui/kpi-card/kpi-card';
import { Card } from '../../../../../shared/ui/card/card';
import { Button } from '../../../../../shared/ui/button/button';
import { DateInput } from '../../../../../shared/ui/date-input/date-input';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { Select, SelectOption } from '../../../../../shared/ui/select/select';
import { LineChart, ChartSeries } from '../../../../../shared/ui/chart/line-chart';
import { LoadingSkeleton } from '../../../../../shared/ui/loading-skeleton/loading-skeleton';
import { ErrorState } from '../../../../../shared/ui/error-state/error-state';
import { DashboardService } from '../../../../dashboard/data/dashboard.service';
import { FinancialDashboard } from '../../../../dashboard/data/dashboard.model';
import {
  ACCOUNTING_EXPORTS, AccountingExport, ExportFormat, ReportingExportService,
} from '../../../../../core/services/reporting-export.service';
import { formatMoneyRounded } from '../../../../../core/utils/format';

const DOCUMENT_OPTIONS: SelectOption[] = Object.entries(ACCOUNTING_EXPORTS)
  .map(([value, label]) => ({ value, label }));

const FORMAT_OPTIONS: SelectOption[] = [
  { value: 'PDF', label: 'PDF' },
  { value: 'EXCEL', label: 'Excel' },
  { value: 'CSV', label: 'CSV' },
];

@Component({
  selector: 'app-reporting-finances',
  standalone: true,
  imports: [
    FormsModule, PageHeader, KpiCard, Card, Button, DateInput, FormField,
    Select, LineChart, LoadingSkeleton, ErrorState,
  ],
  templateUrl: './reporting-finances.html',
  styleUrl: './reporting-finances.css',
})
export class ReportingFinances implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly exports = inject(ReportingExportService);

  loading = signal(true);
  error = signal(false);
  data = signal<FinancialDashboard | null>(null);
  revenueSeries = signal<ChartSeries[]>([]);

  today = new Date().toISOString().slice(0, 10);
  firstOfYear = `${new Date().getFullYear()}-01-01`;
  from = signal(this.firstOfYear);
  to = signal(this.today);

  documentOptions = DOCUMENT_OPTIONS;
  formatOptions = FORMAT_OPTIONS;
  document = signal<AccountingExport>('bilan');
  format = signal<ExportFormat>('PDF');
  exporting = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.dashboardService.financial().subscribe({
      next: (d) => {
        this.data.set(d);
        const trend = d.trend ?? [];
        this.revenueSeries.set([
          { name: 'Chiffre d’affaires', series: trend.map((t) => ({ name: t.monthLabel, value: t.revenue ?? 0 })) },
          { name: 'Encaissé', series: trend.map((t) => ({ name: t.monthLabel, value: t.collected ?? 0 })) },
        ]);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.error.set(true); },
    });
  }

  currency(v: number | null | undefined): string {
    return formatMoneyRounded(v);
  }

  /** The nine OHADA statements share one window and one format selector. */
  downloadDocument(): void {
    this.exporting.set(true);
    this.exports
      .accounting(this.document(), { from: this.from(), to: this.to(), format: this.format() })
      .subscribe({
        next: () => this.exporting.set(false),
        error: () => this.exporting.set(false),
      });
  }
}
