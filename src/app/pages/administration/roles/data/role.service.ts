import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { PermissionDescriptor, Role, RoleRequest } from './role.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly api = inject(ApiService);

  list(): Observable<Role[]> {
    return this.api.get<Role[]>('/api/roles');
  }

  create(body: RoleRequest): Observable<Role> {
    return this.api.post<Role>('/api/roles', body);
  }

  update(id: number, body: RoleRequest): Observable<Role> {
    return this.api.put<Role>(`/api/roles/${id}`, body);
  }

  delete(id: number): Observable<unknown> {
    return this.api.delete(`/api/roles/${id}`);
  }

  permissionsCatalog(): Observable<PermissionDescriptor[]> {
    return this.api.get<PermissionDescriptor[]>('/api/roles/permissions');
  }
}
