import { Injectable, computed, inject, signal } from '@angular/core';
import { CustomerService } from './customer.service';

/**
 * Customer id → name, shared by every screen that lists documents.
 *
 * Quotes, orders and deliveries all carry `customerId` and no name, and each
 * used to render a meaningless `#42`. One cached lookup serves them all
 * instead of three parallel fetches of the same list.
 */
@Injectable({ providedIn: 'root' })
export class CustomerLookupService {
  private readonly service = inject(CustomerService);
  private readonly byId = signal<ReadonlyMap<number, string>>(new Map());
  private loading = false;

  /** Read-only view, for components that prefer a signal over the method. */
  readonly names = computed(() => this.byId());

  /** Idempotent: the first caller fetches, the rest reuse the cache. */
  load(): void {
    if (this.loading || this.byId().size > 0) return;
    this.loading = true;
    this.service.list({ page: 0, size: 500 }).subscribe({
      next: (res) => {
        this.byId.set(new Map(res.content.map((c) => [c.id, c.name])));
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  /** Falls back to the raw id rather than hiding an unresolved reference. */
  name(id: number | null | undefined): string {
    if (id == null) return '—';
    return this.byId().get(id) ?? `#${id}`;
  }
}
