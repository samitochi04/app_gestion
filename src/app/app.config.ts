import {
  ApplicationConfig, isDevMode, provideAppInitializer, inject,
  provideBrowserGlobalErrorListeners, provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideStore, provideState, Store } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { firstValueFrom, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { routes } from './app.routes';
import { ROOT_REDUCERS, metaReducers } from './store';
import { sessionFeature } from './core/store/session/session.reducer';
import * as sessionEffects from './core/store/session/session.effects';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { ThemeService } from './core/services/theme.service';
import { TokenService } from './core/services/token.service';
import { AuthService } from './core/store/session/auth.service';
import { SessionActions } from './core/store/session/session.actions';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimations(),

    // ---- NgRx ----
    provideStore(ROOT_REDUCERS, { metaReducers }),
    provideState(sessionFeature),
    provideEffects(sessionEffects),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),

    // ---- Startup: apply saved theme + rehydrate the session ----
    //
    // The refresh is *awaited* here, before the router runs its first
    // navigation. Previously it was fire-and-forget, which raced the page's
    // own data-load calls: a deep-link reload (e.g. /app/operations/stock/
    // produits) fired API requests with a possibly-stale access token; a 401
    // then triggered a global logout that bounced the user to /login and, on
    // re-login, to the Menu Principal — losing the page they were on. By
    // resolving the token refresh first, every page loads with a fresh token
    // and the router keeps the reloaded URL.
    provideAppInitializer(() => {
      inject(ThemeService).init();
      const store = inject(Store);
      const tokens = inject(TokenService);
      const auth = inject(AuthService);

      const refreshToken = tokens.refreshToken;
      if (!refreshToken) {
        store.dispatch(SessionActions.refreshFailure());
        return;
      }
      return firstValueFrom(
        auth.refresh({ refreshToken }).pipe(
          tap((response) => {
            tokens.save(response.accessToken, response.refreshToken);
            store.dispatch(SessionActions.refreshSuccess({ response }));
          }),
          catchError(() => {
            store.dispatch(SessionActions.refreshFailure());
            return of(null);
          }),
        ),
      );
    }),
  ],
};
