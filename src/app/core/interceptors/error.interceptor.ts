import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SessionActions } from '../store/session/session.actions';
import { ToastService } from '../services/toast.service';

/**
 * Surfaces HTTP transport failures as toasts and logs the user out on 401.
 * (Business errors arrive as 200 + success:false and are thrown as ApiError
 * by ApiService, handled at the call site — see effects.)
 *
 * Handles the special case of 403 PASSWORD_CHANGE_REQUIRED: the backend
 * returns this when a user with `mustChangePassword` tries to access any
 * endpoint other than change-password or logout. We redirect to the profile
 * page where the user can change their password.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const store = inject(Store);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthCall = req.url.includes('/api/auth/');

      if (error.status === 401 && !isAuthCall) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        store.dispatch(SessionActions.logout());
      } else if (error.status === 403) {
        // Check if this is a PASSWORD_CHANGE_REQUIRED response
        const body = error.error;
        const errorCode = body?.error?.code ?? body?.code;
        if (errorCode === 'PASSWORD_CHANGE_REQUIRED') {
          toast.info('Vous devez changer votre mot de passe avant de continuer.');
          router.navigate(['/app/profile']);
        } else if (!isAuthCall) {
          toast.error('Accès refusé.');
        }
      } else if (error.status === 0) {
        toast.error('Serveur injoignable. Vérifiez votre connexion.');
      } else if (error.status >= 500) {
        toast.error('Erreur serveur. Réessayez plus tard.');
      }
      return throwError(() => error);
    }),
  );
};
