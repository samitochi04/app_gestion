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

import { routes } from './app.routes';
import { ROOT_REDUCERS, metaReducers } from './store';
import { sessionFeature } from './core/store/session/session.reducer';
import * as sessionEffects from './core/store/session/session.effects';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { ThemeService } from './core/services/theme.service';
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
    provideAppInitializer(() => {
      inject(ThemeService).init();
      inject(Store).dispatch(SessionActions.restoreSession());
    }),
  ],
};
