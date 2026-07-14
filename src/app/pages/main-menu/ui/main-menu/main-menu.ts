import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { Icon } from '../../../../shared/ui/icon/icon';
import { ThemeSwitcher } from '../../../../shared/layout/theme-switcher/theme-switcher';
import { selectAccessibleModules, selectUser } from '../../../../core/store/session/session.selectors';
import { SessionActions } from '../../../../core/store/session/session.actions';
import { ModuleDescriptor } from '../../../../core/models/permission.enum';
import { DialogService } from '../../../../core/services/dialog.service';
import { ConfirmDialog, ConfirmDialogData } from '../../../../shared/ui/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-main-menu',
  standalone: true,
  imports: [Icon, ThemeSwitcher],
  templateUrl: './main-menu.html',
  styleUrl: './main-menu.css',
})
export class MainMenu {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly dialog = inject(DialogService);

  user = toSignal(this.store.select(selectUser), { initialValue: null });
  modules = toSignal(this.store.select(selectAccessibleModules), { initialValue: [] as ModuleDescriptor[] });

  open(mod: ModuleDescriptor): void {
    this.router.navigateByUrl(mod.route);
  }

  logout(): void {
    const ref = this.dialog.open<ConfirmDialogData, boolean>(ConfirmDialog, {
      title: 'Se déconnecter ?',
      data: { message: 'Voulez-vous vraiment vous déconnecter ?', danger: true, confirmLabel: 'Se déconnecter' },
    });
    ref.closed$.subscribe((confirmed) => {
      if (confirmed) this.store.dispatch(SessionActions.logout());
    });
  }
}
