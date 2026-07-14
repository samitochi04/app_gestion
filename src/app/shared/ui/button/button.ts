import { Component, input, output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

/** The one button component — every action in the app renders through this. */
@Component({
  selector: 'app-button',
  standalone: true,
  template: `
    <button
      class="btn"
      [class]="'btn--' + variant() + ' btn--' + size()"
      [attr.type]="type()"
      [disabled]="disabled() || loading()"
      (click)="pressed.emit($event)"
    >
      @if (loading()) { <span class="btn__spinner" aria-hidden="true"></span> }
      <ng-content />
    </button>
  `,
  styleUrl: './button.css',
})
export class Button {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  type = input<'button' | 'submit'>('button');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  pressed = output<MouseEvent>();
}
