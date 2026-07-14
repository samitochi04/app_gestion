import { Component, OnInit, input } from '@angular/core';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import { resolveChartColors } from './chart-colors';

export interface DonutDatum { name: string; value: number; }

/**
 * Donut chart wrapper (e.g. répartition du stock par statut).
 * `view` is intentionally NOT bound — see line-chart.ts for why.
 */
@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [NgxChartsModule],
  template: `
    <div class="chart-host" [style.height.px]="height()">
      <ngx-charts-pie-chart
        [results]="data()"
        [scheme]="scheme"
        [doughnut]="true"
        [arcWidth]="0.35"
        [labels]="true"
        [animations]="false"
      />
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .chart-host { width: 100%; }
    ::ng-deep .ngx-charts text { fill: var(--color-text-secondary); font-family: var(--font-sans); font-size: 11px; }
  `],
})
export class DonutChart implements OnInit {
  data = input.required<DonutDatum[]>();
  height = input<number>(260);
  scheme: Color = { name: 'kit', selectable: true, group: ScaleType.Ordinal, domain: [] };

  ngOnInit(): void {
    this.scheme = { ...this.scheme, domain: resolveChartColors(4) };
  }
}
