import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { PageQuery, PageResponse } from '../../../../core/models/api-response.model';
import { Supplier, SupplierRequest } from './supplier.model';

/** `/api/suppliers` — see MODULES.md § erp-supplier. */
@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly api = inject(ApiService);

  list(query?: PageQuery): Observable<PageResponse<Supplier>> {
    return this.api.getPage<Supplier>('/api/suppliers', query);
  }

  get(id: number): Observable<Supplier> {
    return this.api.get<Supplier>(`/api/suppliers/${id}`);
  }

  create(body: SupplierRequest): Observable<Supplier> {
    return this.api.post<Supplier>('/api/suppliers', body);
  }

  update(id: number, body: SupplierRequest): Observable<Supplier> {
    return this.api.put<Supplier>(`/api/suppliers/${id}`, body);
  }

  /** Suppliers are deactivated, never deleted (referenced by accounting). */
  deactivate(id: number): Observable<Supplier> {
    return this.api.post<Supplier>(`/api/suppliers/${id}/deactivate`);
  }
}
