import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Role, Permission, CreateRoleRequest, UpdateRoleRequest, ApiResponse } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly apiUrl = `${environment.apiUrl}/roles`;

  constructor(private readonly http: HttpClient) {}

  getRoles(): Observable<Role[]> {
    return this.http.get<ApiResponse<Role[]>>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  createRole(request: CreateRoleRequest): Observable<Role> {
    return this.http.post<ApiResponse<Role>>(this.apiUrl, request).pipe(
      map(response => response.data)
    );
  }

  updateRole(roleId: number, request: UpdateRoleRequest): Observable<Role> {
    return this.http.put<ApiResponse<Role>>(`${this.apiUrl}/${roleId}`, request).pipe(
      map(response => response.data)
    );
  }

  deleteRole(roleId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${roleId}`).pipe(
      map(() => void 0)
    );
  }

  getPermissions(): Observable<Permission[]> {
    return this.http.get<ApiResponse<Permission[]>>(`${this.apiUrl}/permissions`).pipe(
      map(response => response.data)
    );
  }
}
