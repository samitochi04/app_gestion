import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../core/services/api.service';
import { PageQuery, PageResponse } from '../../../../../core/models/api-response.model';
import { CreateCreditNoteRequest, CreditNote } from './credit-note.model';

/**
 * Customer credit notes. Deliberately a two-step flow — create, then validate
 * — because validating a `RETURN` moves stock back in and reverses the COGS.
 * There is no edit and no delete.
 */
@Injectable({ providedIn: 'root' })
export class CreditNoteService {
  private readonly api = inject(ApiService);

  list(query?: PageQuery): Observable<PageResponse<CreditNote>> {
    return this.api.getPage<CreditNote>('/api/credit-notes', query);
  }

  create(body: CreateCreditNoteRequest): Observable<CreditNote> {
    return this.api.post<CreditNote>('/api/credit-notes', body);
  }

  /**
   * `warehouseId` says where returned goods land; the backend falls back to
   * its own default when omitted, so it only matters for `RETURN` avoirs.
   */
  validate(id: number, warehouseId?: number): Observable<CreditNote> {
    return this.api.post<CreditNote>(`/api/credit-notes/${id}/validate`, undefined, { warehouseId });
  }

  /** The recipient address is a required query parameter. */
  send(id: number, email: string): Observable<CreditNote> {
    return this.api.post<CreditNote>(`/api/credit-notes/${id}/send`, undefined, { email });
  }
}
