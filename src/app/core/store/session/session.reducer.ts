import { createFeature, createReducer, on } from '@ngrx/store';
import { SessionActions } from './session.actions';
import { initialSessionState } from './session.state';

/**
 * `createFeature` auto-exports selectors for each state field
 * (selectUser, selectPermissions, selectRoles, selectStatus, selectError)
 * plus selectSessionState. Derived selectors live in session.selectors.ts.
 */
export const sessionFeature = createFeature({
  name: 'session',
  reducer: createReducer(
    initialSessionState,

    on(SessionActions.login, SessionActions.register, (s) => ({
      ...s, status: 'loading' as const, error: null,
    })),

    on(
      SessionActions.loginSuccess,
      SessionActions.registerSuccess,
      SessionActions.refreshSuccess,
      (s, { response }) => ({
        ...s,
        user: response.user,
        roles: response.user?.roles ?? [],
        permissions: response.user?.permissions ?? [],
        status: 'authenticated' as const,
        error: null,
      }),
    ),

    on(SessionActions.loginFailure, SessionActions.registerFailure, (s, { message }) => ({
      ...s, status: 'error' as const, error: message,
    })),

    on(SessionActions.logout, SessionActions.refreshFailure, () => ({
      ...initialSessionState,
    })),

    on(SessionActions.clearError, (s) => ({ ...s, error: null })),
  ),
});
