import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

/**
 * Blocks routes that require an authenticated session. Uses the persisted
 * token as the source of truth so a page refresh (before the store rehydrates)
 * still passes. Redirects to /login, preserving the attempted URL.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const tokens = inject(TokenService);
  const router = inject(Router);

  if (tokens.hasToken && !tokens.isExpired()) return true;

  return router.createUrlTree(['/login'], {
    queryParams: { redirect: state.url },
  });
};
