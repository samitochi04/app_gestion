import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { THEME_OPTIONS, ThemeService } from '../../../core/services/theme.service';
import { Icon } from '../../ui/icon/icon';

/** Topbar "thème" button — dropdown with the 5 swatches (light/dark/blue/red/orange). */
@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [Icon],
  template: `
    <div class="theme-switch">
      <button
        type="button"
        class="theme-switch__trigger"
        [class.theme-switch__trigger--open]="open()"
        (click)="toggle()"
        aria-label="Changer de thème"
        title="Thème"
      >
        <app-icon name="palette" [size]="19" />
      </button>
      @if (open()) {
        <div class="theme-switch__panel">
          <p class="t-micro theme-switch__title">Thème</p>
          <div class="theme-switch__grid">
            @for (opt of options; track opt.name) {
              <button
                type="button"
                class="theme-switch__option"
                [class.theme-switch__option--active]="opt.name === themeService.current()"
                (click)="select(opt.name)"
              >
                <span class="theme-switch__swatch" [style.background]="opt.swatch"></span>
                <span class="theme-switch__option-label">{{ opt.label }}</span>
                @if (opt.name === themeService.current()) {
                  <app-icon name="check-circle" [size]="14" class="theme-switch__check" />
                }
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './theme-switcher.css',
})
export class ThemeSwitcher {
  themeService = inject(ThemeService);
  private readonly hostRef = inject(ElementRef<HTMLElement>);
  options = THEME_OPTIONS;
  open = signal(false);

  toggle(): void {
    this.open.set(!this.open());
  }

  select(name: (typeof THEME_OPTIONS)[number]['name']): void {
    this.themeService.setTheme(name);
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.hostRef.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
