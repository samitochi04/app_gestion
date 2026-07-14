import { Component, input } from '@angular/core';
import { Card } from '../card/card';
import { StatDelta } from '../stat-delta/stat-delta';

/**
 * KPI = label -> number -> delta (design.md KPI rule). Used on the dashboard
 * and reporting pages. Keep the grid sparse — do not over-saturate a screen.
 */
@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [Card, StatDelta],
  template: `
    <app-card class="kpi">
      <p class="t-micro kpi__label">{{ label() }}</p>
      <p class="t-display u-tabular kpi__value">{{ value() }}</p>
      @if (delta() !== undefined) {
        <app-stat-delta [value]="delta()!" [label]="deltaLabel()" [invert]="invert()" />
      }
    </app-card>
  `,
  styleUrl: './kpi-card.css',
})
export class KpiCard {
  label = input.required<string>();
  value = input.required<string>();
  delta = input<number>();
  deltaLabel = input<string>('vs période précédente');
  invert = input<boolean>(false);
}
