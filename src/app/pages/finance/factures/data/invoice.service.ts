import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { PageQuery, PageResponse } from '../../../../core/models/api-response.model';
import { Invoice, InvoicePayment, InvoiceRequest, RecordPaymentRequest } from './invoice.model';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly api = inject(ApiService);

  list(query?: PageQuery): Observable<PageResponse<Invoice>> {
    return this.api.getPage<Invoice>('/api/invoices', query);
  }

  get(id: number): Observable<Invoice> {
    return this.api.get<Invoice>(`/api/invoices/${id}`);
  }

  create(body: InvoiceRequest): Observable<Invoice> {
    return this.api.post<Invoice>('/api/invoices', body);
  }

  update(id: number, body: InvoiceRequest): Observable<Invoice> {
    return this.api.put<Invoice>(`/api/invoices/${id}`, body);
  }

  validate(id: number): Observable<Invoice> { return this.api.post<Invoice>(`/api/invoices/${id}/validate`); }
  send(id: number): Observable<Invoice> { return this.api.post<Invoice>(`/api/invoices/${id}/send`); }
  cancel(id: number): Observable<Invoice> { return this.api.post<Invoice>(`/api/invoices/${id}/cancel`); }

  payments(id: number): Observable<InvoicePayment[]> {
    return this.api.get<InvoicePayment[]>(`/api/invoices/${id}/payments`);
  }

  recordPayment(body: RecordPaymentRequest): Observable<InvoicePayment> {
    return this.api.post<InvoicePayment>('/api/invoices/payments', body);
  }
}
