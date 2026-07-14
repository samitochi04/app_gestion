import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../../ui/icon/icon';

/** One sidebar link. Collapses to icon-only when the sidebar is closed. */
@Component({
  selector: 'app-sidebar-item',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, Icon],
  template: `
    <a
      [routerLink]="route()"
      routerLinkActive="sidebar-item--active"
      class="sidebar-item"
      [class.sidebar-item--collapsed]="collapsed()"
      [title]="collapsed() ? label() : ''"
    >
      <app-icon [name]="icon()" [size]="19" />
      @if (!collapsed()) { <span class="sidebar-item__label t-body">{{ label() }}</span> }
    </a>
  `,
  styleUrl: './sidebar-item.css',
})
export class SidebarItem {
  icon = input.required<string>();
  label = input.required<string>();
  route = input.required<string>();
  collapsed = input<boolean>(false);
}
