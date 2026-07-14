import { Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';
import { Button } from '../button/button';

/** Shown when a page/section fails to load. Explains what happened + retry. */
@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [Icon, Button],
  template: `
    <div class="error">
      <div class="error__icon"><app-icon name="alert-triangle" [size]="26" /></div>
      <p class="t-body-strong">{{ title() }}</p>
      <p class="t-caption error__message">{{ message() }}</p>
      <app-button variant="secondary" size="sm" (pressed)="retry.emit()">Réessayer</app-button>
    </div>
  `,
  styleUrl: './error-state.css',
})
export class ErrorState {
  title = input<string>('Une erreur est survenue');
  message = input<string>('Impossible de charger les données.');
  retry = output<void>();
}
