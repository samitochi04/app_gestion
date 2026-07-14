import { Component, inject } from '@angular/core';
import { DIALOG_DATA, DIALOG_REF, DialogRef } from '../../../core/services/dialog.service';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';

export interface ConfirmDialogData {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

/**
 * Generic yes/no confirmation, used for every delete action.
 * Open with: dialogService.open<ConfirmDialogData, boolean>(ConfirmDialog,
 *   { title: 'Supprimer ?', data: { message: '...', danger: true } })
 * ref.closed$ emits `true` if confirmed.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [Button, Icon],
  template: `
    <div class="confirm">
      @if (data.danger) {
        <div class="confirm__icon confirm__icon--danger"><app-icon name="alert-triangle" [size]="22" /></div>
      }
      <p class="t-body">{{ data.message }}</p>
      <div class="confirm__actions">
        <app-button variant="secondary" (pressed)="ref.close(false)">
          {{ data.cancelLabel ?? 'Annuler' }}
        </app-button>
        <app-button [variant]="data.danger ? 'danger' : 'primary'" (pressed)="ref.close(true)">
          {{ data.confirmLabel ?? 'Confirmer' }}
        </app-button>
      </div>
    </div>
  `,
  styleUrl: './confirm-dialog.css',
})
export class ConfirmDialog {
  data = inject(DIALOG_DATA) as ConfirmDialogData;
  ref = inject(DIALOG_REF) as DialogRef<boolean>;
}
