import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../services/api.service';
import {
  ChangePasswordRequest, ForgotPasswordRequest, LoginRequest,
  RefreshRequest, RegisterRequest, ResetPasswordRequest, TokenResponse,
} from '../../models/auth.model';

/** HTTP calls for the authentication module (test-backend.md §1). */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);

  login(body: LoginRequest): Observable<TokenResponse> {
    return this.api.post<TokenResponse>('/api/auth/login', body);
  }

  register(body: RegisterRequest): Observable<TokenResponse> {
    return this.api.post<TokenResponse>('/api/auth/register', body);
  }

  refresh(body: RefreshRequest): Observable<TokenResponse> {
    return this.api.post<TokenResponse>('/api/auth/refresh', body);
  }

  forgotPassword(body: ForgotPasswordRequest): Observable<unknown> {
    return this.api.post('/api/auth/forgot-password', body);
  }

  resetPassword(body: ResetPasswordRequest): Observable<unknown> {
    return this.api.post('/api/auth/reset-password', body);
  }

  changePassword(body: ChangePasswordRequest): Observable<unknown> {
    return this.api.put('/api/auth/change-password', body);
  }
}
