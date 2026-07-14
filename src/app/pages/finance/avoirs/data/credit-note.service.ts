import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { PageQuery, PageResponse } from '../../../../core/models/api-response.model';
import { CreditNote, CreditNoteRequest } from './credit-note.model';

/** Credit notes only support create/list/send in the backend — no edit or delete. */
@Injectable({ providedIn: 'root' })
export class CreditNoteService {
  private readonly api = inject(ApiService);

  list(query?: PageQuery): Observable<PageResponse<CreditNote>> {
    return this.api.getPage<CreditNote>('/api/credit-notes', query);
  }

  create(body: CreditNoteRequest): Observable<CreditNote> {
    return this.api.post<CreditNote>('/api/credit-notes', body);
  }

  send(id: number): Observable<CreditNote> {
    return this.api.post<CreditNote>(`/api/credit-notes/${id}/send`);
  }
}
