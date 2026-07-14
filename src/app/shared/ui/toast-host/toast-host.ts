import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { Icon } from '../icon/icon';

const ICONS: Record<string, string> = {
  success: 'check-circle', info: 'inbox', warning: 'alert-triangle', danger: 'alert-triangle',
};

/** Renders the live toast stack, bottom-right. Mounted once in app.html. */
@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [Icon],
  template: `
    <div class="toasts">
      @for (t of toasts(); track t.id) {
        <div class="toast" [class]="'toast--' + t.tone">
          <app-icon [name]="icon(t.tone)" [size]="18" />
          <div class="toast__body">
            @if (t.title) { <p class="toast__title">{{ t.title }}</p> }
            <p class="toast__message">{{ t.message }}</p>
          </div>
          <button class="toast__close" type="button" aria-label="Fermer" (click)="toastService.dismiss(t.id)">
            <app-icon name="x" [size]="14" />
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './toast-host.css',
})
export class ToastHost {
  toastService = inject(ToastService);
  toasts = this.toastService.toasts;
  icon(tone: string): string { return ICONS[tone] ?? 'inbox'; }
}
