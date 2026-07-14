import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { selectPermissions } from '../store/session/session.selectors';

/**
 * Route-level permission check. Attach required permissions via route data:
 *   { path: 'stock', canActivate: [permissionGuard],
 *     data: { permissions: [Permission.PRODUCT_READ] } }
 * User needs AT LEAST ONE listed permission. No list = allowed.
 */
export const permissionGuard: CanActivateFn = (route) => {
  const store = inject(Store);
  const router = inject(Router);
  const required = (route.data?.['permissions'] as string[] | undefined) ?? [];

  if (required.length === 0) return true;

  return store.select(selectPermissions).pipe(
    take(1),
    map((perms) =>
      required.some((p) => perms.includes(p))
        ? true
        : router.createUrlTree(['/menu']),
    ),
  );
};
