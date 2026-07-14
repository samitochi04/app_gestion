import { createSelector } from '@ngrx/store';
import { MODULES, canAccessModule } from '../../models/permission.enum';
import { sessionFeature } from './session.reducer';

// Re-export the auto-generated feature selectors for a single import surface.
export const {
  selectSessionState,
  selectUser,
  selectRoles,
  selectPermissions,
  selectStatus,
  selectError,
} = sessionFeature;

export const selectIsAuthenticated = createSelector(
  selectStatus,
  selectUser,
  (status, user) => status === 'authenticated' || !!user,
);

export const selectIsLoading = createSelector(
  selectStatus,
  (status) => status === 'loading',
);

/** Curried permission check for use in guards/components. */
export const selectHasPermission = (permission: string) =>
  createSelector(selectPermissions, (perms) => perms.includes(permission));

export const selectHasAnyPermission = (permissions: string[]) =>
  createSelector(selectPermissions, (perms) =>
    permissions.length === 0 || permissions.some((p) => perms.includes(p)),
  );

/** Modules the current user may see on the Menu Principal / sidebar. */
export const selectAccessibleModules = createSelector(
  selectPermissions,
  (perms) => MODULES.filter((m) => canAccessModule(perms, m)),
);
