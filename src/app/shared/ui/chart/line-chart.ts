import { Component, OnInit, input } from '@angular/core';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import { resolveChartColors } from './chart-colors';

export interface ChartSeries { name: string; series: { name: string; value: number }[]; }

/**
 * Multi-series line chart wrapper (e.g. évolution du CA, entrées/sorties de
 * stock). Wraps ngx-charts so every chart in the app shares one design-system
 * palette and config — no raw ngx-charts usage in feature pages.
 *
 * `view` is intentionally NOT bound: ngx-charts expects a concrete
 * `[number, number]` tuple, not `[undefined, number]`. Instead the chart
 * auto-sizes to its host container (100% width, explicit height via style).
 */
@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [NgxChartsModule],
  template: `
    <div class="chart-host" [style.height.px]="height()">
      <ngx-charts-line-chart
        [results]="data()"
        [scheme]="scheme"
        [xAxis]="true"
        [yAxis]="true"
        [timeline]="false"
        [animations]="false"
        [autoScale]="true"
      />
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .chart-host { width: 100%; }
    ::ng-deep .ngx-charts text { fill: var(--color-text-secondary); font-family: var(--font-sans); font-size: 11px; }
  `],
})
export class LineChart implements OnInit {
  data = input.required<ChartSeries[]>();
  height = input<number>(260);
  scheme: Color = { name: 'kit', selectable: true, group: ScaleType.Ordinal, domain: [] };

  ngOnInit(): void {
    this.scheme = { ...this.scheme, domain: resolveChartColors(4) };
  }
}
