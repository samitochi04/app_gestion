import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../icon/icon';

export interface Crumb { label: string; route?: string; accent?: string; }

/** "menu principale > dashboard > stock > produits" — from your mockup.
 * Module-group crumbs (e.g. "Opérations") render in that module's accent
 * color when provided, for at-a-glance orientation (see BreadcrumbService). */
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink, Icon],
  template: `
    <nav class="breadcrumb" aria-label="Fil d’Ariane">
      @for (crumb of items(); track $index; let last = $last) {
        @if (crumb.route && !last) {
          <a [routerLink]="crumb.route" class="breadcrumb__link" [style.color]="crumb.accent || null">{{ crumb.label }}</a>
        } @else {
          <span class="breadcrumb__current">{{ crumb.label }}</span>
        }
        @if (!last) { <app-icon name="chevron-right" [size]="14" class="breadcrumb__sep" /> }
      }
    </nav>
  `,
  styleUrl: './breadcrumb.css',
})
export class Breadcrumb {
  items = input.required<Crumb[]>();
}
