import { Component, OnInit, input } from '@angular/core';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import { resolveChartColors } from './chart-colors';

export interface BarDatum { name: string; value: number; }

/**
 * Vertical bar chart wrapper (e.g. ventes par catégorie, stock par entrepôt).
 * `view` is intentionally NOT bound — see line-chart.ts for why.
 */
@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [NgxChartsModule],
  template: `
    <div class="chart-host" [style.height.px]="height()">
      <ngx-charts-bar-vertical
        [results]="data()"
        [scheme]="scheme"
        [xAxis]="true"
        [yAxis]="true"
        [roundEdges]="true"
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
export class BarChart implements OnInit {
  data = input.required<BarDatum[]>();
  height = input<number>(260);
  scheme: Color = { name: 'kit', selectable: true, group: ScaleType.Ordinal, domain: [] };

  ngOnInit(): void {
    this.scheme = { ...this.scheme, domain: resolveChartColors(4) };
  }
}
