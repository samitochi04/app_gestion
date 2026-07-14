import { Component, input } from '@angular/core';
import { Icon } from '../icon/icon';

/** "An empty screen is an invitation to act" — used when a list has 0 rows. */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [Icon],
  template: `
    <div class="empty">
      <div class="empty__icon"><app-icon [name]="icon()" [size]="28" /></div>
      <p class="t-body-strong">{{ title() }}</p>
      @if (message()) { <p class="t-caption empty__message">{{ message() }}</p> }
      <ng-content />
    </div>
  `,
  styleUrl: './empty-state.css',
})
export class EmptyState {
  icon = input<string>('inbox');
  title = input.required<string>();
  message = input<string>('');
}
