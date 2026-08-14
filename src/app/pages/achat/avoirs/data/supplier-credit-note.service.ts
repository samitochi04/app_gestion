import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { PageQuery, PageResponse } from '../../../../core/models/api-response.model';
import { CreateSupplierCreditNoteRequest, SupplierCreditNote } from './supplier-credit-note.model';

/** `/api/supplier-credit-notes` — see MODULES.md § erp-supplier. */
@Injectable({ providedIn: 'root' })
export class SupplierCreditNoteService {
  private readonly api = inject(ApiService);

  list(query?: PageQuery): Observable<PageResponse<SupplierCreditNote>> {
    return this.api.getPage<SupplierCreditNote>('/api/supplier-credit-notes', query);
  }

  create(body: CreateSupplierCreditNoteRequest): Observable<SupplierCreditNote> {
    return this.api.post<SupplierCreditNote>('/api/supplier-credit-notes', body);
  }

  /** Validation is what moves returned goods out of the damaged warehouse. */
  validate(id: number): Observable<SupplierCreditNote> {
    return this.api.post<SupplierCreditNote>(`/api/supplier-credit-notes/${id}/validate`);
  }
}
