import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { Icon } from '../../ui/icon/icon';
import { SidebarItem } from '../sidebar-item/sidebar-item';
import { selectPermissions } from '../../../core/store/session/session.selectors';
import { NAV_DASHBOARD, NAV_PROFILE, NavSection, visibleSections } from './sidebar.nav';

/**
 * Three-level navigation: section → group → link, as declared in
 * `sidebar.nav.ts`. The section holding the current route opens on load, so a
 * refresh or a deep link never lands on a collapsed tree.
 */
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

      <nav class="sidebar__nav u-scroll" aria-label="Navigation principale">
        <app-sidebar-item icon="layout-dashboard" [label]="dashboard.label"
                          [route]="dashboard.route" [collapsed]="collapsed()" />

        @for (section of sections(); track section.key) {
          <div class="sidebar__section">
            <button
              type="button"
              class="sidebar__section-header"
              [class.sidebar__section-header--collapsed]="collapsed()"
              [style.--group-accent]="section.accent"
              [attr.aria-expanded]="isOpen(section.key)"
              (click)="toggleNode(section.key)"
              [title]="collapsed() ? section.label : ''"
            >
              <app-icon [name]="section.icon" [size]="19" [style.color]="section.accent" />
              @if (!collapsed()) {
                <span class="t-body sidebar__section-label">{{ section.label }}</span>
                <app-icon name="chevron-down" [size]="14" class="sidebar__chevron"
                          [class.sidebar__chevron--open]="isOpen(section.key)" />
              }
            </button>

            @if (!collapsed() && isOpen(section.key)) {
              <div class="sidebar__children" [style.border-left-color]="section.accent">
                @for (group of section.groups ?? []; track group.key) {
                  <button
                    type="button"
                    class="sidebar__group-header"
                    [attr.aria-expanded]="isOpen(group.key)"
                    (click)="toggleNode(group.key)"
                  >
                    <app-icon [name]="group.icon" [size]="15" />
                    <span class="t-caption sidebar__group-label">{{ group.label }}</span>
                    <app-icon name="chevron-down" [size]="12" class="sidebar__chevron"
                              [class.sidebar__chevron--open]="isOpen(group.key)" />
                  </button>
                  @if (isOpen(group.key)) {
                    <div class="sidebar__grandchildren">
                      @for (link of group.links; track link.route) {
                        <a [routerLink]="link.route" routerLinkActive="sidebar__child--active"
                           class="sidebar__child t-caption">{{ link.label }}</a>
                      }
                    </div>
                  }
                }

                @for (link of section.links ?? []; track link.route) {
                  <a [routerLink]="link.route" routerLinkActive="sidebar__child--active"
                     class="sidebar__child t-caption">{{ link.label }}</a>
                }
              </div>
            }
          </div>
        }

        <app-sidebar-item icon="user" [label]="profile.label"
                          [route]="profile.route" [collapsed]="collapsed()" />
      </nav>
    </aside>
  `,
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  collapsed = input<boolean>(false);
  toggle = output<void>();

  readonly dashboard = NAV_DASHBOARD;
  readonly profile = NAV_PROFILE;

  private readonly permissions = toSignal(this.store.select(selectPermissions), { initialValue: [] as string[] });

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly sections = computed<NavSection[]>(() => visibleSections(this.permissions()));

  private readonly openNodes = signal<ReadonlySet<string>>(new Set(['operations', 'operations.stocks']));

  constructor() {
    // Reveal whatever branch the current URL belongs to, without ever closing
    // a branch the person opened by hand.
    effect(() => {
      const keys = this.branchFor(this.url());
      if (keys.length) {
        this.openNodes.update((open) => new Set([...open, ...keys]));
      }
    });
  }

  isOpen(key: string): boolean {
    return this.openNodes().has(key);
  }

  toggleNode(key: string): void {
    this.openNodes.update((open) => {
      const next = new Set(open);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }

  /** Section (and group) keys that contain `url`. */
  private branchFor(url: string): string[] {
    for (const section of this.sections()) {
      for (const group of section.groups ?? []) {
        if (group.links.some((l) => url.startsWith(l.route))) return [section.key, group.key];
      }
      if ((section.links ?? []).some((l) => url.startsWith(l.route))) return [section.key];
    }
    return [];
  }
}
