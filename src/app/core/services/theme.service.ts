import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export const THEMES = ['light', 'dark', 'blue', 'red', 'orange'] as const;
export type ThemeName = (typeof THEMES)[number];

export interface ThemeOption {
  name: ThemeName;
  /** French label for the theme switcher (Batch 2 topbar). */
  label: string;
  /** Swatch color used in the picker (pure display). */
  swatch: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { name: 'light',  label: 'Clair',  swatch: '#4f46e5' },
  { name: 'dark',   label: 'Sombre', swatch: '#0f1420' },
  { name: 'blue',   label: 'Bleu',   swatch: '#2563eb' },
  { name: 'red',    label: 'Rouge',  swatch: '#dc2626' },
  { name: 'orange', label: 'Orange', swatch: '#ea580c' },
];

const STORAGE_KEY = 'kit.theme';

/** Applies <html data-theme="..."> and persists the choice. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly current = signal<ThemeName>(environment.defaultTheme);

  /** Called once at startup (APP_INITIALIZER in app.config). */
  init(): void {
    const saved = this.readSaved();
    this.setTheme(saved ?? environment.defaultTheme);
  }

  setTheme(theme: ThemeName): void {
    this.current.set(theme);
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* noop */ }
  }

  private readSaved(): ThemeName | null {
    try {
      const v = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
      return v && (THEMES as readonly string[]).includes(v) ? v : null;
    } catch {
      return null;
    }
  }
}
