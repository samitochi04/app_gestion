import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuditFilters, AuditLogPage } from '../models/commercial.model';
import { ApiResponse } from '../models/user.model';
import { buildParams, unwrapData } from '../utils/http.util';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private readonly apiUrl = `${environment.apiUrl}/audit`;

  constructor(private readonly http: HttpClient) {}

  getLogs(filters: AuditFilters): Observable<AuditLogPage> {
    return this.http
      .get<ApiResponse<AuditLogPage>>(this.apiUrl, {
        params: buildParams({
          page: filters.page ?? 0,
          size: filters.size ?? 20,
          module: filters.module,
          entityType: filters.entityType,
          entityId: filters.entityId,
          userId: filters.userId,
          action: filters.action
        })
      })
      .pipe(unwrapData());
  }
}