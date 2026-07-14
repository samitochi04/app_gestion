import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SessionActions } from '../store/session/session.actions';
import { ToastService } from '../services/toast.service';

/**
 * Surfaces HTTP transport failures as toasts and logs the user out on 401.
 * (Business errors arrive as 200 + success:false and are thrown as ApiError
 * by ApiService, handled at the call site — see effects.)
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const store = inject(Store);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthCall = req.url.includes('/api/auth/');

      if (error.status === 401 && !isAuthCall) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        store.dispatch(SessionActions.logout());
      } else if (error.status === 0) {
        toast.error('Serveur injoignable. Vérifiez votre connexion.');
      } else if (error.status >= 500) {
        toast.error('Erreur serveur. Réessayez plus tard.');
      } else if (error.status === 403) {
        toast.error('Accès refusé.');
      }
      return throwError(() => error);
    }),
  );
};
