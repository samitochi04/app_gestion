import { Component, ElementRef, OnDestroy, OnInit, computed, inject, input, signal } from '@angular/core';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import { resolveChartColors } from './chart-colors';

export interface BarDatum { name: string; value: number; }

/**
 * Vertical bar chart wrapper. `[view]` is bound to a measured `[width, height]`
 * via a ResizeObserver — see line-chart.ts for why auto-sizing alone rendered
 * blank inside tabs / late-appearing cards.
 */
@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [NgxChartsModule],
  template: `
    <div class="chart-host" [style.height.px]="height()">
      <ngx-charts-bar-vertical
        [view]="view()"
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
export class BarChart implements OnInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);

  data = input.required<BarDatum[]>();
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
