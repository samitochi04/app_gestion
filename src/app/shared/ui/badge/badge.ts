import { Component, computed, input } from '@angular/core';
import { StatusTone } from '../../../core/models/status.model';

/** Tint-pill status badge — the ONLY place tone→color mapping happens. */
@Component({
  selector: 'app-badge',
  standalone: true,
  template: `<span class="badge" [class]="'badge--' + tone()"><ng-content /></span>`,
  styleUrl: './badge.css',
})
export class Badge {
  tone = input<StatusTone>('neutral');
  toneClass = computed(() => `badge--${this.tone()}`);
}
