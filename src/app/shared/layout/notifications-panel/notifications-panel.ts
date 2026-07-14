import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { Icon } from '../../ui/icon/icon';
import { EmptyState } from '../../ui/empty-state/empty-state';
import { LoadingSkeleton } from '../../ui/loading-skeleton/loading-skeleton';
import { NotificationsService } from '../../../core/services/notifications.service';

const TONE_ICON: Record<string, string> = { success: 'check-circle', warning: 'alert-triangle', danger: 'alert-triangle' };

/**
 * Topbar notification bell + dropdown panel, backed by NotificationsService
 * (real, derived from stock alerts + overdue/pending invoices — see that
 * service for details on why there's no backend endpoint yet).
 */
@Component({
  selector: 'app-notifications-panel',
  standalone: true,
  imports: [Icon, EmptyState, LoadingSkeleton],
  template: `
    <div class="notif">
      <button
        type="button"
        class="notif__trigger"
        [class.notif__trigger--open]="open()"
        (click)="toggle()"
        aria-label="Notifications"
        title="Notifications"
      >
        <app-icon name="bell" [size]="19" />
        @if (service.unreadCount() > 0) {
          <span class="notif__badge">{{ service.unreadCount() > 9 ? '9+' : service.unreadCount() }}</span>
        }
      </button>
      @if (open()) {
        <div class="notif__panel">
          <div class="notif__header">
            <p class="t-micro notif__title">Notifications</p>
            @if (service.unreadCount() > 0) {
              <button type="button" class="notif__mark-read" (click)="service.markAllRead()">Tout marquer lu</button>
            }
          </div>
          @if (service.loading()) {
            <div class="notif__loading"><app-loading-skeleton [count]="3" [rowHeight]="48" /></div>
          } @else if (service.items().length === 0) {
            <app-empty-state icon="inbox" title="Aucune notification" message="Vous êtes à jour." />
          } @else {
            <div class="notif__list u-scroll">
              @for (n of service.items(); track n.id) {
                <div class="notif__item" [class.notif__item--unread]="!n.read">
                  <span class="notif__item-icon" [class]="'notif__item-icon--' + n.tone">
                    <app-icon [name]="icon(n.tone)" [size]="15" />
                  </span>
                  <div class="notif__item-body">
                    <p class="t-body-strong">{{ n.title }}</p>
                    <p class="t-caption">{{ n.message }}</p>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './notifications-panel.css',
})
export class NotificationsPanel {
  service = inject(NotificationsService);
  private readonly hostRef = inject(ElementRef<HTMLElement>);
  open = signal(false);

  toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (next) this.service.refresh();
  }

  icon(tone: string): string {
    return TONE_ICON[tone] ?? 'inbox';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.hostRef.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
