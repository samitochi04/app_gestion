import { Component, ElementRef, OnDestroy, OnInit, computed, inject, input, signal } from '@angular/core';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import { resolveChartColors } from './chart-colors';

export interface ChartSeries { name: string; series: { name: string; value: number }[]; }

/**
 * Multi-series line chart wrapper (e.g. évolution du CA, entrées/sorties de
 * stock). Wraps ngx-charts so every chart shares one palette and config.
 *
 * `[view]` is bound to a measured `[width, height]`. Auto-sizing alone left
 * the chart blank ("white space") when it was first laid out inside a hidden
 * tab / a card that appears after data loads: ngx-charts measured a 0-width
 * container once and never re-measured. A ResizeObserver now feeds the real
 * width and re-renders on every resize.
 */
@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [NgxChartsModule],
  template: `
    <div class="chart-host" [style.height.px]="height()">
      <ngx-charts-line-chart
        [view]="view()"
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
export class LineChart implements OnInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);

  data = input.required<ChartSeries[]>();
  height = input<number>(260);
  scheme: Color = { name: 'kit', selectable: true, group: ScaleType.Ordinal, domain: [] };

  private readonly width = signal(600);
  view = computed<[number, number]>(() => [this.width(), this.height()]);
  private ro?: ResizeObserver;

  ngOnInit(): void {
    this.scheme = { ...this.scheme, domain: resolveChartColors(4) };
    const el = this.host.nativeElement.querySelector('.chart-host') as HTMLElement | null;
    if (!el) return;
    const measure = () => { const w = el.clientWidth; if (w > 0) this.width.set(w); };
    this.ro = new ResizeObserver(measure);
    this.ro.observe(el);
    queueMicrotask(measure);
  }

  ngOnDestroy(): void { this.ro?.disconnect(); }
}
