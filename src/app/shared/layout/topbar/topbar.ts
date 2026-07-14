import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Breadcrumb } from '../../ui/breadcrumb/breadcrumb';
import { Icon } from '../../ui/icon/icon';
import { ThemeSwitcher } from '../theme-switcher/theme-switcher';
import { NotificationsPanel } from '../notifications-panel/notifications-panel';
import { SessionActions } from '../../../core/store/session/session.actions';
import { DialogService } from '../../../core/services/dialog.service';
import { ConfirmDialog, ConfirmDialogData } from '../../ui/confirm-dialog/confirm-dialog';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';

/**
 * Top bar: breadcrumb (left, route-driven, clickable) + notifications,
 * theme switcher, and a direct logout button (right) — no user-profile
 * dropdown; that lives on the dedicated Profil page instead.
 */
@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [Breadcrumb, Icon, ThemeSwitcher, NotificationsPanel],
  template: `
    <header class="topbar">
      <app-breadcrumb [items]="breadcrumbService.crumbs()" />
      <div class="topbar__actions">
        <app-notifications-panel />
        <app-theme-switcher />
        <button type="button" class="topbar__icon-btn topbar__logout-btn" (click)="confirmLogout()" aria-label="Déconnexion" title="Déconnexion">
          <app-icon name="logout" [size]="19" />
        </button>
      </div>
    </header>
  `,
  styleUrl: './topbar.css',
})
export class Topbar {
  private readonly store = inject(Store);
  private readonly dialog = inject(DialogService);
  breadcrumbService = inject(BreadcrumbService);

  confirmLogout(): void {
    const ref = this.dialog.open<ConfirmDialogData, boolean>(ConfirmDialog, {
      title: 'Se déconnecter ?',
      data: { message: 'Voulez-vous vraiment vous déconnecter ?', danger: true, confirmLabel: 'Se déconnecter' },
    });
    ref.closed$.subscribe((confirmed) => {
      if (confirmed) this.store.dispatch(SessionActions.logout());
    });
  }
}
