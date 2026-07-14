import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';

/** Endpoints that must NOT carry a bearer token (they issue/refresh it). */
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/refresh',
];

/** Attaches `Authorization: Bearer <token>` to every non-public request. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenService);
  const isPublic = PUBLIC_PATHS.some((p) => req.url.includes(p));
  const token = tokens.accessToken;

  if (isPublic || !token) return next(req);

  return next(
    req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }),
  );
};
