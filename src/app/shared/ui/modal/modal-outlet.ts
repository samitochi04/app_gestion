import { Component, EnvironmentInjector, Injector, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { DialogService, DIALOG_DATA, DIALOG_REF, OpenDialog } from '../../../core/services/dialog.service';
import { Icon } from '../icon/icon';

/**
 * Renders every dialog opened via DialogService as a centered modal, on top
 * of the current page. Mounted once in app.html. Supports stacking (rare,
 * e.g. a confirm-dialog opened from within a form dialog).
 *
 * Each dialog's content component gets its own child injector so it can
 * `inject(DIALOG_DATA)` / `inject(DIALOG_REF)` to read its input and close itself.
 */
@Component({
  selector: 'app-modal-outlet',
  standalone: true,
  imports: [NgComponentOutlet, Icon],
  template: `
    @for (dlg of dialogs(); track dlg.id) {
      <div class="overlay" (click)="onBackdrop(dlg)">
        <div
          class="modal"
          [class]="'modal--' + (dlg.config.size ?? 'md')"
          role="dialog"
          aria-modal="true"
          (click)="$event.stopPropagation()"
        >
          @if (dlg.config.title) {
            <header class="modal__header">
              <h2 class="t-h2">{{ dlg.config.title }}</h2>
              @if (dlg.config.dismissable) {
                <button class="modal__close" type="button" aria-label="Fermer"
                        (click)="dlg.ref.close()">
                  <app-icon name="x" [size]="18" />
                </button>
              }
            </header>
          }
          <div class="modal__body">
            <ng-container
              [ngComponentOutlet]="dlg.component"
              [ngComponentOutletInjector]="childInjector(dlg)"
            />
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './modal-outlet.css',
})
export class ModalOutlet {
  private readonly dialogService = inject(DialogService);
  private readonly parentInjector = inject(EnvironmentInjector);
  private readonly cache = new Map<number, Injector>();

  dialogs = this.dialogService.dialogs;

  /** One child injector per open dialog, memoized by dialog id. */
  childInjector(dlg: OpenDialog): Injector {
    let injector = this.cache.get(dlg.id);
    if (!injector) {
      injector = Injector.create({
        parent: this.parentInjector,
        providers: [
          { provide: DIALOG_DATA, useValue: dlg.config.data },
          { provide: DIALOG_REF, useValue: dlg.ref },
        ],
      });
      this.cache.set(dlg.id, injector);
    }
    return injector;
  }

  onBackdrop(dlg: OpenDialog): void {
    if (dlg.config.dismissable) dlg.ref.close();
  }
}
