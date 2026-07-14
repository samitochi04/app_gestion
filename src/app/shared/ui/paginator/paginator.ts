import { Component, computed, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

/** Drives PageResponse<T> pagination (0-indexed `page`, matches backend). */
@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [Icon],
  template: `
    <div class="paginator">
      <p class="t-caption">
        {{ rangeStart() }}–{{ rangeEnd() }} sur {{ totalElements() }}
      </p>
      <div class="paginator__controls">
        <button type="button" class="paginator__btn" [disabled]="page() === 0"
                (click)="pageChange.emit(page() - 1)" aria-label="Page précédente">
          <app-icon name="chevron-left" [size]="16" />
        </button>
        <span class="t-caption">Page {{ page() + 1 }} / {{ totalPages() || 1 }}</span>
        <button type="button" class="paginator__btn" [disabled]="page() + 1 >= totalPages()"
                (click)="pageChange.emit(page() + 1)" aria-label="Page suivante">
          <app-icon name="chevron-right" [size]="16" />
        </button>
      </div>
    </div>
  `,
  styleUrl: './paginator.css',
})
export class Paginator {
  page = input.required<number>();
  size = input.required<number>();
  totalElements = input.required<number>();
  totalPages = input.required<number>();
  pageChange = output<number>();

  rangeStart = computed(() => (this.totalElements() === 0 ? 0 : this.page() * this.size() + 1));
  rangeEnd = computed(() => Math.min((this.page() + 1) * this.size(), this.totalElements()));
}
