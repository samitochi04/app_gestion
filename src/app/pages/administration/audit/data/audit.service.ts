import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { PageQuery, PageResponse } from '../../../../core/models/api-response.model';
import { AuditEntry } from './audit.model';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly api = inject(ApiService);

  list(query?: PageQuery): Observable<PageResponse<AuditEntry>> {
    return this.api.getPage<AuditEntry>('/api/audit', query);
  }
}
