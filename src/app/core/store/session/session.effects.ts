import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY, of } from 'rxjs';
import { catchError, exhaustMap, map, switchMap, tap } from 'rxjs/operators';
import { ApiError } from '../../services/api.service';
import { TokenService } from '../../services/token.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from './auth.service';
import { SessionActions } from './session.actions';

const msg = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : fallback;

/** Log in, then persist tokens and route to the Menu Principal. */
export const loginEffect = createEffect(
  (actions$ = inject(Actions), auth = inject(AuthService)) =>
    actions$.pipe(
      ofType(SessionActions.login),
      exhaustMap(({ credentials }) =>
        auth.login(credentials).pipe(
          map((response) => SessionActions.loginSuccess({ response })),
          catchError((e) =>
            of(SessionActions.loginFailure({ message: msg(e, 'Identifiants invalides.') })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const registerEffect = createEffect(
  (actions$ = inject(Actions), auth = inject(AuthService)) =>
    actions$.pipe(
      ofType(SessionActions.register),
      exhaustMap(({ payload }) =>
        auth.register(payload).pipe(
          map((response) => SessionActions.registerSuccess({ response })),
          catchError((e) =>
            of(SessionActions.registerFailure({ message: msg(e, 'Inscription impossible.') })),
          ),
        ),
      ),
    ),
  { functional: true },
);

/** On login/register success: store tokens + go to the module menu. */
export const authSuccessEffect = createEffect(
  (
    actions$ = inject(Actions),
    tokens = inject(TokenService),
    router = inject(Router),
  ) =>
    actions$.pipe(
      ofType(SessionActions.loginSuccess, SessionActions.registerSuccess),
      tap(({ response }) => {
        tokens.save(response.accessToken, response.refreshToken);
        router.navigate(['/menu']);
      }),
    ),
  { functional: true, dispatch: false },
);

/** Startup rehydration: if a refresh token exists, restore the session. */
export const restoreSessionEffect = createEffect(
  (
    actions$ = inject(Actions),
    auth = inject(AuthService),
    tokens = inject(TokenService),
  ) =>
    actions$.pipe(
      ofType(SessionActions.restoreSession),
      switchMap(() => {
        const refreshToken = tokens.refreshToken;
        if (!refreshToken) return of(SessionActions.refreshFailure());
        return auth.refresh({ refreshToken }).pipe(
          map((response) => {
            tokens.save(response.accessToken, response.refreshToken);
            return SessionActions.refreshSuccess({ response });
          }),
          catchError(() => of(SessionActions.refreshFailure())),
        );
      }),
    ),
  { functional: true },
);

export const forgotPasswordEffect = createEffect(
  (actions$ = inject(Actions), auth = inject(AuthService), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(SessionActions.forgotPassword),
      exhaustMap(({ payload }) =>
        auth.forgotPassword(payload).pipe(
          tap(() => toast.success('Si un compte existe, un e-mail de réinitialisation a été envoyé.')),
          catchError((e) => { toast.error(msg(e, 'Envoi impossible.')); return EMPTY; }),
        ),
      ),
    ),
  { functional: true, dispatch: false },
);

export const resetPasswordEffect = createEffect(
  (
    actions$ = inject(Actions),
    auth = inject(AuthService),
    toast = inject(ToastService),
    router = inject(Router),
  ) =>
    actions$.pipe(
      ofType(SessionActions.resetPassword),
      exhaustMap(({ payload }) =>
        auth.resetPassword(payload).pipe(
          tap(() => {
            toast.success('Mot de passe réinitialisé. Vous pouvez vous connecter.');
            router.navigate(['/login']);
          }),
          catchError((e) => { toast.error(msg(e, 'Réinitialisation impossible.')); return EMPTY; }),
        ),
      ),
    ),
  { functional: true, dispatch: false },
);

/** Clear tokens and return to login. */
export const logoutEffect = createEffect(
  (actions$ = inject(Actions), tokens = inject(TokenService), router = inject(Router)) =>
    actions$.pipe(
      ofType(SessionActions.logout),
      tap(() => { tokens.clear(); router.navigate(['/login']); }),
    ),
  { functional: true, dispatch: false },
);
