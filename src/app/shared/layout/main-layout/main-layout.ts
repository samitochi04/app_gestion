import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';
import { NotificationsService } from '../../../core/services/notifications.service';

/**
 * Dashboard shell: collapsible sidebar (logo top-left, toggle top-right) +
 * topbar + routed page content. Mounted at the 'app' parent route (Batch 3+);
 * all module pages render inside <router-outlet> here.
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar, Topbar],
  template: `
    <div class="layout">
      <app-sidebar [collapsed]="sidebarCollapsed()" (toggle)="sidebarCollapsed.set(!sidebarCollapsed())" />
      <div class="layout__main">
        <app-topbar />
        <main class="layout__content u-scroll">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styleUrl: './main-layout.css',
})
export class MainLayout {
  sidebarCollapsed = signal(false);

  constructor() {
    inject(NotificationsService).refresh();
  }
}
