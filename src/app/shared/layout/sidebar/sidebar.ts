import { Component, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { Icon } from '../../ui/icon/icon';
import { SidebarItem } from '../sidebar-item/sidebar-item';
import { selectPermissions } from '../../../core/store/session/session.selectors';
import { Permission } from '../../../core/models/permission.enum';
import { toSignal } from '@angular/core/rxjs-interop';

interface NavChild { label: string; route: string; }
interface NavGroup { key: string; label: string; icon: string; accent: string; anyOf: string[]; children: NavChild[]; }

/**
 * Sidebar navigation groups, matching the requested structure exactly:
 * Dashboard · Opérations(Stock/Ventes) · Finances · Administration · Reporting · Profil.
 * Each group only renders if the user holds at least one of `anyOf`'s permissions.
 * `accent` is a per-module branding color (themes.css) — visual differentiation
 * only, never used for status/semantic meaning.
 */
const NAV_GROUPS: NavGroup[] = [
  {
    key: 'operations', label: 'Opérations', icon: 'boxes', accent: 'var(--module-operations)',
    anyOf: [
      Permission.PRODUCT_READ, Permission.CATEGORY_READ, Permission.WAREHOUSE_READ,
      Permission.MOVEMENT_READ, Permission.CUSTOMER_READ, Permission.QUOTE_READ,
      Permission.ORDER_READ, Permission.DELIVERY_READ,
    ],
    children: [
      { label: 'Produits', route: '/app/operations/stock/produits' },
      { label: 'Catégories', route: '/app/operations/stock/categories' },
      { label: 'Mouvements', route: '/app/operations/stock/mouvements' },
      { label: 'Entrepôts', route: '/app/operations/stock/entrepots' },
      { label: 'Clients', route: '/app/operations/ventes/clients' },
      { label: 'Devis', route: '/app/operations/ventes/devis' },
      { label: 'Commandes', route: '/app/operations/ventes/commandes' },
      { label: 'Livraisons', route: '/app/operations/ventes/livraisons' },
    ],
  },
  {
    key: 'finance', label: 'Finances', icon: 'wallet', accent: 'var(--module-finance)',
    anyOf: [Permission.INVOICE_READ, Permission.PAYMENT_READ],
    children: [
      { label: 'Factures', route: '/app/finance/factures' },
      { label: 'Avoirs', route: '/app/finance/avoirs' },
      { label: 'Paiements', route: '/app/finance/paiements' },
      { label: 'Comptabilité', route: '/app/finance/comptabilite' },
    ],
  },
  {
    key: 'administration', label: 'Administration', icon: 'shield', accent: 'var(--module-administration)',
    anyOf: [Permission.USER_READ, Permission.ROLE_READ, Permission.PERMISSION_READ],
    children: [
      { label: 'Utilisateurs', route: '/app/administration/utilisateurs' },
      { label: 'Rôles', route: '/app/administration/roles' },
      { label: 'Audit', route: '/app/administration/audit' },
      { label: 'Paramètres', route: '/app/administration/parametres' },
    ],
  },
  {
    key: 'reporting', label: 'Reporting', icon: 'bar-chart', accent: 'var(--module-reporting)',
    anyOf: [
      Permission.PRODUCT_READ, Permission.MOVEMENT_READ, Permission.INVOICE_READ,
      Permission.ORDER_READ, Permission.QUOTE_READ,
    ],
    children: [
      { label: 'Finances', route: '/app/reporting/finances' },
      { label: 'Stock', route: '/app/reporting/stock' },
      { label: 'Ventes', route: '/app/reporting/ventes' },
    ],
  },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, Icon, SidebarItem],
  template: `
    <aside class="sidebar" [class.sidebar--collapsed]="collapsed()">
      <div class="sidebar__header">
        @if (!collapsed()) {
          <a routerLink="/menu" class="sidebar__logo">
            <span class="sidebar__logo-mark">K</span>
            <span class="t-h3">KIT · Gestion</span>
          </a>
        } @else {
          <span class="sidebar__logo-mark sidebar__logo-mark--centered">K</span>
        }
        <button type="button" class="sidebar__toggle" (click)="toggle.emit()"
                [attr.aria-label]="collapsed() ? 'Ouvrir le menu' : 'Réduire le menu'">
          <app-icon [name]="collapsed() ? 'chevron-right' : 'chevron-left'" [size]="16" />
        </button>
      </div>

      <nav class="sidebar__nav u-scroll">
        <app-sidebar-item icon="layout-dashboard" label="Tableau de bord"
                           route="/app/dashboard" [collapsed]="collapsed()" />

        @for (group of visibleGroups(); track group.key) {
          <div class="sidebar__group">
            <button
              type="button"
              class="sidebar__group-header"
              [class.sidebar__group-header--collapsed]="collapsed()"
              [style.--group-accent]="group.accent"
              (click)="toggleGroup(group.key)"
              [title]="collapsed() ? group.label : ''"
            >
              <app-icon [name]="group.icon" [size]="19" [style.color]="group.accent" />
              @if (!collapsed()) {
                <span class="t-body sidebar__group-label">{{ group.label }}</span>
                <app-icon name="chevron-down" [size]="14"
                          class="sidebar__chevron"
                          [class.sidebar__chevron--open]="isOpen(group.key)" />
              }
            </button>
            @if (!collapsed() && isOpen(group.key)) {
              <div class="sidebar__children" [style.border-left-color]="group.accent">
                @for (child of group.children; track child.route) {
                  <a [routerLink]="child.route" routerLinkActive="sidebar__child--active" class="sidebar__child t-caption">
                    {{ child.label }}
                  </a>
                }
              </div>
            }
          </div>
        }

        <app-sidebar-item icon="user" label="Profil"
                           route="/app/profile" [collapsed]="collapsed()" />
      </nav>
    </aside>
  `,
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private readonly store = inject(Store);
  collapsed = input<boolean>(false);
  toggle = output<void>();

  private readonly permissions = toSignal(this.store.select(selectPermissions), { initialValue: [] as string[] });
  private readonly openGroups = signal<Set<string>>(new Set(['operations']));

  visibleGroups = computed(() => {
    const perms = this.permissions();
    return NAV_GROUPS.filter((g) => g.anyOf.length === 0 || g.anyOf.some((p) => perms.includes(p)));
  });

  isOpen(key: string): boolean {
    return this.openGroups().has(key);
  }

  toggleGroup(key: string): void {
    this.openGroups.update((set) => {
      const next = new Set(set);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }
}
