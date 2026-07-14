import { Component, computed, input } from '@angular/core';
import { Icon } from '../icon/icon';

/**
 * Small "+4.2% vs période précédente" indicator used inside KPI cards.
 * Positive is not always "good" (e.g. costs) — pass `invert` to flip coloring.
 */
@Component({
  selector: 'app-stat-delta',
  standalone: true,
  imports: [Icon],
  template: `
    <span class="delta" [class.delta--up]="isUp()" [class.delta--down]="!isUp()">
      <app-icon [name]="isUp() ? 'chevron-right' : 'chevron-right'"
                [size]="14" class="delta__arrow" [class.delta__arrow--down]="!isUp()" />
      {{ formatted() }}
      @if (label()) { <span class="delta__label t-caption">{{ label() }}</span> }
    </span>
  `,
  styleUrl: './stat-delta.css',
})
export class StatDelta {
  value = input.required<number>();     // e.g. 4.2 or -1.8
  label = input<string>('');            // e.g. "vs mois dernier"
  invert = input<boolean>(false);       // true when a decrease is the good outcome

  isUp = computed(() => {
    const v = this.value() ?? 0;
    return this.invert() ? v < 0 : v >= 0;
  });
  formatted = computed(() => {
    const v = this.value() ?? 0;
    const sign = v > 0 ? '+' : '';
    return `${sign}${v.toFixed(1)}%`;
  });
}
