import { Component, input } from '@angular/core';

/**
 * Minimal inline-SVG icon component. Avoids an external icon-font dependency.
 * `name` matches ModuleDescriptor.icon and feature-level usage.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="1.8"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path [attr.d]="path()" />
    </svg>
  `,
  styles: [`:host { display: inline-flex; line-height: 0; }`],
})
export class Icon {
  name = input.required<string>();
  size = input<number>(20);

  private readonly paths: Record<string, string> = {
    'layout-dashboard': 'M3 3h8v8H3zM13 3h8v5h-8zM13 12h8v9h-8zM3 15h8v6H3z',
    'boxes': 'M12 2 3 7l9 5 9-5-9-5ZM3 7v10l9 5V12M21 7v10l-9 5V12',
    'wallet': 'M3 7h15a3 3 0 0 1 3 3v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 0a2 2 0 0 1 2-2h11M16 13h2',
    'shield': 'M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z',
    'bar-chart': 'M4 20V10M12 20V4M20 20v-7',
    'user': 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
    'menu': 'M4 6h16M4 12h16M4 18h16',
    'chevron-left': 'M15 18l-6-6 6-6',
    'chevron-right': 'M9 18l6-6-6-6',
    'chevron-down': 'M6 9l6 6 6-6',
    'bell': 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9ZM13.7 21a2 2 0 0 1-3.4 0',
    'palette': 'M12 2a10 10 0 1 0 0 20 2 2 0 0 0 2-2 2 2 0 0 1 2-2h1a3 3 0 0 0 3-3 9 9 0 0 0-8-13Zm-4 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm4-3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm4 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm-8 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z',
    'search': 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-5.2-5.2',
    'plus': 'M12 5v14M5 12h14',
    'x': 'M18 6 6 18M6 6l12 12',
    'pencil': 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z',
    'trash': 'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0-1 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 6h12Z',
    'eye': 'M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Zm11 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    'filter': 'M4 4h16l-6 8v6l-4 2v-8L4 4Z',
    'logout': 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
    'alert-triangle': 'M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
    'check-circle': 'M22 11.1V12a10 10 0 1 1-6-9.2M22 4 12 14.01l-3-3',
    'inbox': 'M22 12h-6l-2 3h-4l-2-3H2M5.5 4h13l3.5 8v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8L5.5 4Z',
    'package': 'M21 8v8a2 2 0 0 1-1 1.7l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.7l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8ZM3.3 7 12 12l8.7-5M12 22V12',
    'shopping-cart': 'M2 3h2.5l2.2 11a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L21 7H6M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
    'download': 'M12 3v12m0 0 4-4m-4 4-4-4M4 19h16',
    'refresh': 'M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5',
    'file-text': 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6M8 13h8M8 17h5',
    'link': 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
  };

  path(): string {
    return this.paths[this.name()] ?? this.paths['inbox'];
  }
}
