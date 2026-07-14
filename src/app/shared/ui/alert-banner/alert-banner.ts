import { Component, input } from '@angular/core';
import { Icon } from '../icon/icon';
import { StatusTone } from '../../../core/models/status.model';

const TONE_ICON: Record<string, string> = { success: 'check-circle', warning: 'alert-triangle', danger: 'alert-triangle', info: 'inbox', neutral: 'inbox' };

/**
 * Inline, page-embedded alert banner — the "you're on this page, here's your
 * status" signal (e.g. "3 produits en rupture de stock"), distinct from the
 * topbar notification dropdown. Color follows StatusTone so meaning is
 * consistent with badges/status-pills everywhere else.
 */
@Component({
  selector: 'app-alert-banner',
  standalone: true,
  imports: [Icon],
  template: `
    <div class="alert-banner" [class]="'alert-banner--' + tone()">
      <app-icon [name]="icon()" [size]="18" />
      <div class="alert-banner__body">
        <p class="t-body-strong">{{ title() }}</p>
        @if (message()) { <p class="t-caption">{{ message() }}</p> }
      </div>
      <ng-content />
    </div>
  `,
  styleUrl: './alert-banner.css',
})
export class AlertBanner {
  tone = input<StatusTone>('info');
  title = input.required<string>();
  message = input<string>('');

  icon(): string {
    return TONE_ICON[this.tone()] ?? 'inbox';
  }
}
