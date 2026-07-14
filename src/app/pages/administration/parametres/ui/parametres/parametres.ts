import { Component, inject } from '@angular/core';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../shared/ui/card/card';
import { THEME_OPTIONS, ThemeService } from '../../../../../core/services/theme.service';

/**
 * Client-side preferences only — the backend has no /api/settings endpoint
 * (test-backend.md). Theme choice is already persisted by ThemeService;
 * this page just exposes it in Administration alongside a placeholder for
 * future org-level settings once that endpoint exists.
 */
@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [PageHeader, Card],
  templateUrl: './parametres.html',
  styleUrl: './parametres.css',
})
export class Parametres {
  themeService = inject(ThemeService);
  options = THEME_OPTIONS;
}
