import { Injectable } from '@angular/core';

const ACCESS_KEY = 'kit.accessToken';
const REFRESH_KEY = 'kit.refreshToken';

/**
 * Token storage. Tokens live in localStorage (not NgRx) so a page refresh
 * survives, while user/permission state is rehydrated into the session slice
 * via a refresh call on startup.
 */
@Injectable({ providedIn: 'root' })
export class TokenService {
  get accessToken(): string | null {
    return this.read(ACCESS_KEY);
  }

  get refreshToken(): string | null {
    return this.read(REFRESH_KEY);
  }

  get hasToken(): boolean {
    return !!this.accessToken;
  }

  save(accessToken: string, refreshToken: string): void {
    this.write(ACCESS_KEY, accessToken);
    this.write(REFRESH_KEY, refreshToken);
  }

  clear(): void {
    this.remove(ACCESS_KEY);
    this.remove(REFRESH_KEY);
  }

  /** Best-effort JWT expiry check; returns true if expired or unparseable. */
  isExpired(token = this.accessToken): boolean {
    if (!token) return true;
    try {
      const [, payload] = token.split('.');
      const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      if (!claims.exp) return false;
      return claims.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }

  private read(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  private write(key: string, value: string): void {
    try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
  }
  private remove(key: string): void {
    try { localStorage.removeItem(key); } catch { /* noop */ }
  }
}
