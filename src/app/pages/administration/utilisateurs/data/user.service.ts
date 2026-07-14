import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { PageQuery, PageResponse } from '../../../../core/models/api-response.model';
import { AppUser } from './user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiService);

  list(query?: PageQuery): Observable<PageResponse<AppUser>> {
    return this.api.getPage<AppUser>('/api/users', query);
  }

  assignRole(userId: string, roleId: number): Observable<unknown> {
    return this.api.post(`/api/users/${userId}/roles/${roleId}`);
  }
}
