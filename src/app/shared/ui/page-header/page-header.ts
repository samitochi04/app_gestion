import { Component, input } from '@angular/core';

/** Title + description + right-aligned actions (e.g. "Nouveau" button). */
@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <div class="page-header">
      <div>
        <h1 class="t-h1">{{ title() }}</h1>
        @if (description()) { <p class="t-caption page-header__desc">{{ description() }}</p> }
      </div>
      <div class="page-header__actions">
        <ng-content />
      </div>
    </div>
  `,
  styleUrl: './page-header.css',
})
export class PageHeader {
  title = input.required<string>();
  description = input<string>('');
}
