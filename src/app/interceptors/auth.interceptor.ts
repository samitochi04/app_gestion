import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

function serializeApiError(payload: unknown): string {
  if (typeof payload === 'string') {
    return payload;
  }

  if (payload === null || payload === undefined) {
    return '';
  }

  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const authorizationHeader = authService.getAuthorizationHeaderValue();

  let authReq = req;
  if (authorizationHeader && !req.url.includes('/auth/login') && !req.url.includes('/auth/register') && !req.url.includes('/auth/refresh')) {
    authReq = req.clone({
      setHeaders: {
        Authorization: authorizationHeader
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status >= 400) {
        const diagnostics = authService.getSessionDiagnostics();
        const serializedError = serializeApiError(error.error);

        console.error('API request failed', {
          url: req.url,
          method: req.method,
          status: error.status,
          error: error.error,
          errorText: serializedError,
          authorizationHeaderPreview: diagnostics.authorizationHeaderPreview,
          tokenType: diagnostics.tokenType,
          user: diagnostics.user,
          accessTokenClaims: diagnostics.accessTokenClaims
        });
        console.error('API error payload', serializedError);
      }

      if (error.status === 401 && !req.url.includes('/auth/refresh') && !req.url.includes('/auth/login')) {
        return authService.refreshToken().pipe(
          switchMap(response => {
            const newReq = req.clone({
              setHeaders: {
                Authorization: authService.buildAuthenticatedHeader(
                  response.accessToken,
                  response.tokenType
                )
              }
            });
            return next(newReq);
          }),
          catchError(() => {
            authService.logout();
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
