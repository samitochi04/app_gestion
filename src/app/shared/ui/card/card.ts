import { Component, input } from '@angular/core';

/** Base surface for all panels/sections (design.md: shadow-first elevation). */
@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <div class="card" [class.card--flat]="flat()" [class.card--padded]="padded()">
      <ng-content />
    </div>
  `,
  styleUrl: './card.css',
})
export class Card {
  /** Removes shadow — for cards nested inside another card. */
  flat = input<boolean>(false);
  padded = input<boolean>(true);
}
