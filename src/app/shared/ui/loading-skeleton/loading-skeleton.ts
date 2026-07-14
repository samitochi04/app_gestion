import { Component, input } from '@angular/core';

/** Shimmering placeholder blocks — designed loading state, no ad-hoc spinners. */
@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  template: `
    <div class="skeleton-group">
      @for (r of rows(); track $index) {
        <div class="skeleton" [style.height.px]="rowHeight()"></div>
      }
    </div>
  `,
  styleUrl: './loading-skeleton.css',
})
export class LoadingSkeleton {
  count = input<number>(4);
  rowHeight = input<number>(44);
  rows(): number[] { return Array.from({ length: this.count() }); }
}
