import { Component, input, output } from '@angular/core';

export interface TabOption { value: string; label: string; }

/** Small pill tab-switcher (e.g. Ventes/Achats views, table/chart toggles). */
@Component({
  selector: 'app-segmented-tabs',
  standalone: true,
  template: `
    <div class="tabs" role="tablist">
      @for (opt of options(); track opt.value) {
        <button
          type="button"
          role="tab"
          class="tabs__item"
          [class.tabs__item--active]="opt.value === active()"
          [attr.aria-selected]="opt.value === active()"
          (click)="selected.emit(opt.value)"
        >
          {{ opt.label }}
        </button>
      }
    </div>
  `,
  styleUrl: './segmented-tabs.css',
})
export class SegmentedTabs {
  options = input.required<TabOption[]>();
  active = input.required<string>();
  selected = output<string>();
}
