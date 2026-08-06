import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { PageQuery, PageResponse } from '../../../../core/models/api-response.model';
import { AppUser, CreateUserRequest, ResetPasswordRequest } from './user.model';

/**
 * User accounts are never deleted — only deactivated — because audit entries
 * and documents reference them.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiService);

  list(query?: PageQuery): Observable<PageResponse<AppUser>> {
    return this.api.getPage<AppUser>('/api/users', query);
  }

  create(body: CreateUserRequest): Observable<AppUser> {
    return this.api.post<AppUser>('/api/users', body);
  }

  /** Forces a provisional password; the holder must change it at next sign-in. */
  resetPassword(userId: string, body: ResetPasswordRequest): Observable<unknown> {
    return this.api.post(`/api/users/${userId}/reset-password`, body);
  }

  /** Refused for the signed-in administrator's own account. */
  deactivate(userId: string): Observable<AppUser> {
    return this.api.post<AppUser>(`/api/users/${userId}/deactivate`);
  }

  activate(userId: string): Observable<AppUser> {
    return this.api.post<AppUser>(`/api/users/${userId}/activate`);
  }

  assignRole(userId: string, roleId: number): Observable<unknown> {
    return this.api.post(`/api/users/${userId}/roles/${roleId}`);
  }
}
