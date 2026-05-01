import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map } from 'rxjs';
import {
  User,
  StoredSession,
  UserSummary,
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  TokenResponse,
  ApiResponse
} from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly defaultTokenType = 'Bearer';

  private readonly currentUser = signal<UserSummary | null>(null);
  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUser() && !!this.getAccessToken());
  readonly hasBackofficeAccess = computed(() => {
    const user = this.currentUser();
    return !!user && (user.roles.length > 0 || user.permissions.length > 0);
  });

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {
    this.loadUserFromStorage();
  }

  register(request: RegisterRequest): Observable<User> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/register`, request).pipe(
      map(response => response.data)
    );
  }

  login(request: LoginRequest): Observable<TokenResponse> {
    this.clearSession();

    return this.http.post<ApiResponse<TokenResponse>>(`${this.apiUrl}/login`, request).pipe(
      map(response => response.data),
      tap(data => {
        this.storeSession(data);
      })
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/change-password`, request).pipe(
      map(() => void 0)
    );
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/forgot-password`, request).pipe(
      map(() => void 0)
    );
  }

  resetPassword(request: ResetPasswordRequest): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/reset-password`, request).pipe(
      map(() => void 0)
    );
  }

  refreshToken(): Observable<TokenResponse> {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      this.clearSession();
      return new Observable<TokenResponse>((subscriber) => {
        subscriber.error(new Error('Missing refresh token'));
      });
    }

    return this.http.post<ApiResponse<TokenResponse>>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      map(response => response.data),
      tap(data => {
        this.storeSession(data);
      })
    );
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getAuthorizationHeaderValue(): string | null {
    const accessToken = this.getAccessToken();

    if (!accessToken) {
      return null;
    }

    return this.buildAuthorizationHeader(this.getTokenType(), accessToken);
  }

  getSessionDiagnostics(): {
    tokenType: string;
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    authorizationHeaderPreview: string | null;
    user: UserSummary | null;
    accessTokenClaims: Record<string, unknown> | null;
  } {
    const accessToken = this.getAccessToken();
    const authorizationHeader = accessToken
      ? this.buildAuthorizationHeader(this.getTokenType(), accessToken)
      : null;

    return {
      tokenType: this.getTokenType(),
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!localStorage.getItem('refreshToken'),
      authorizationHeaderPreview: authorizationHeader
        ? this.maskAuthorizationHeader(authorizationHeader)
        : null,
      user: this.currentUser(),
      accessTokenClaims: accessToken ? this.decodeJwtPayload(accessToken) : null
    };
  }

  buildAuthenticatedHeader(accessToken: string, tokenType?: string | null): string {
    return this.buildAuthorizationHeader(tokenType || this.defaultTokenType, accessToken);
  }

  hasPermission(permission: string): boolean {
    return this.currentUser()?.permissions?.includes(permission) ?? false;
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission));
  }

  hasRole(role: string): boolean {
    return this.currentUser()?.roles?.includes(role) ?? false;
  }

  hasRoleOrPermission(role: string, permissions: string[]): boolean {
    return this.hasRole(role) || this.hasAnyPermission(permissions);
  }

  private getTokenType(): string {
    return localStorage.getItem('tokenType') || this.defaultTokenType;
  }

  private buildAuthorizationHeader(tokenType: string, accessToken: string): string {
    const normalizedType = tokenType.trim();

    if (!normalizedType) {
      return `${this.defaultTokenType} ${accessToken}`;
    }

    if (normalizedType.toLowerCase().startsWith('bearer ')) {
      return normalizedType;
    }

    return `${normalizedType} ${accessToken}`;
  }

  private decodeJwtPayload(token: string): Record<string, unknown> | null {
    const parts = token.split('.');

    if (parts.length < 2) {
      return null;
    }

    try {
      const payload = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      const paddedPayload = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
      return JSON.parse(atob(paddedPayload)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private maskAuthorizationHeader(header: string): string {
    if (header.length <= 24) {
      return header;
    }

    return `${header.slice(0, 20)}...${header.slice(-8)}`;
  }

  private storeSession(response: TokenResponse): void {
    const user = response.user ?? this.currentUser();

    if (!user) {
      this.clearSession();
      return;
    }

    const session: StoredSession = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      tokenType: response.tokenType || this.defaultTokenType,
      user
    };

    localStorage.setItem('accessToken', session.accessToken);
    localStorage.setItem('refreshToken', session.refreshToken);
    localStorage.setItem('tokenType', session.tokenType);
    localStorage.setItem('user', JSON.stringify(session.user));
    this.currentUser.set(session.user);
  }

  private clearSession(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenType');
    localStorage.removeItem('user');
    this.currentUser.set(null);
  }

  private loadUserFromStorage(): void {
    const accessToken = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');

    if (!accessToken) {
      this.clearSession();
      return;
    }

    if (userData) {
      try {
        this.currentUser.set(JSON.parse(userData));
      } catch {
        this.clearSession();
      }
    }
  }
}
