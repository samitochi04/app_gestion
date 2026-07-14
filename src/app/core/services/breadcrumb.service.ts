import { Injectable, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MODULES } from '../models/permission.enum';
import { Crumb } from '../../shared/ui/breadcrumb/breadcrumb';

export type { Crumb };

/** Maps a route's group label (from its `data.breadcrumb` array) to that
 * module's default landing page and accent color, so intermediate crumbs
 * like "Opérations" are clickable, color-coded, and land somewhere sensible. */
const GROUP_ROUTES: Record<string, string> = Object.fromEntries(
  MODULES.map((m) => [m.label, m.route]),
);
const GROUP_ACCENTS: Record<string, string> = Object.fromEntries(
  MODULES.filter((m) => m.accentVar).map((m) => [m.label, `var(${m.accentVar})`]),
);

/**
 * Builds "Menu principal > Opérations > Produits"-style breadcrumbs directly
 * from the active route's `data.breadcrumb: string[]` — no per-page wiring
 * needed. Every crumb except the last (current page) is clickable.
 */
@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly router = inject(Router);
  private readonly trail = signal<string[]>([]);

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.trail.set(this.readDeepestBreadcrumb());
    });
    // Populate once immediately (first load may fire before this subscription is set up).
    this.trail.set(this.readDeepestBreadcrumb());
  }

  private readDeepestBreadcrumb(): string[] {
    let route = this.router.routerState.snapshot.root;
    let deepest = route;
    while (route.firstChild) {
      route = route.firstChild;
      if (route.data?.['breadcrumb']) deepest = route;
    }
    return (deepest.data?.['breadcrumb'] as string[] | undefined) ?? [];
  }

  crumbs = computed<Crumb[]>(() => {
    const trail = this.trail();
    const items: Crumb[] = [{ label: 'Menu principal', route: '/menu' }];
    trail.forEach((label, i) => {
      const isLast = i === trail.length - 1;
      items.push({ label, route: isLast ? undefined : GROUP_ROUTES[label], accent: GROUP_ACCENTS[label] });
    });
    return items;
  });
}
