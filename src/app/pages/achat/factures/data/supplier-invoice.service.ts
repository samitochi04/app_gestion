import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { PageQuery, PageResponse } from '../../../../core/models/api-response.model';
import {
  CreateSupplierInvoiceRequest, RecordSupplierPaymentRequest, SupplierInvoice,
} from './supplier-invoice.model';

/** `/api/supplier-invoices` — see MODULES.md § erp-supplier. */
@Injectable({ providedIn: 'root' })
export class SupplierInvoiceService {
  private readonly api = inject(ApiService);

  list(query?: PageQuery): Observable<PageResponse<SupplierInvoice>> {
    return this.api.getPage<SupplierInvoice>('/api/supplier-invoices', query);
  }

  get(id: number): Observable<SupplierInvoice> {
    return this.api.get<SupplierInvoice>(`/api/supplier-invoices/${id}`);
  }

  /** Direct entry — the by-purchase-order path is the one that avoids corrections. */
  create(body: CreateSupplierInvoiceRequest): Observable<SupplierInvoice> {
    return this.api.post<SupplierInvoice>('/api/supplier-invoices', body);
  }

  validate(id: number): Observable<SupplierInvoice> {
    return this.api.post<SupplierInvoice>(`/api/supplier-invoices/${id}/validate`);
  }

  /** cancel() is reserved to DRAFT — a validated invoice is corrected by a credit note. */
  cancel(id: number): Observable<SupplierInvoice> {
    return this.api.post<SupplierInvoice>(`/api/supplier-invoices/${id}/cancel`);
  }

  recordPayment(body: RecordSupplierPaymentRequest): Observable<unknown> {
    return this.api.post('/api/supplier-invoices/payments', body);
  }

  payments(id: number): Observable<unknown[]> {
    return this.api.get<unknown[]>(`/api/supplier-invoices/${id}/payments`);
  }
}
