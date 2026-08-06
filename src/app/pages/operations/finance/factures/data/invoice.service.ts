import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../core/services/api.service';
import { FileDownloadService } from '../../../../../core/services/file-download.service';
import { PageQuery, PageResponse } from '../../../../../core/models/api-response.model';
import {
  CreateScheduleRequest, Invoice, InvoicePayment, PaymentSchedule,
  RecordInstallmentRequest, RecordPaymentRequest, RefundPaymentRequest, UpdateInvoiceRequest,
} from './invoice.model';

/**
 * Sales invoices. Note the absence of a `create()`: `POST /api/invoices` does
 * not exist. An invoice appears when an order is shipped, or when a pro forma
 * is converted — never from free-form entry, which is what keeps invoices
 * consistent with what was actually sold.
 */
@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly api = inject(ApiService);
  private readonly files = inject(FileDownloadService);

  list(query?: PageQuery): Observable<PageResponse<Invoice>> {
    return this.api.getPage<Invoice>('/api/invoices', query);
  }

  get(id: number): Observable<Invoice> {
    return this.api.get<Invoice>(`/api/invoices/${id}`);
  }

  /** Drafts only. The backend accepts due date, notes and lines. */
  update(id: number, body: UpdateInvoiceRequest): Observable<Invoice> {
    return this.api.put<Invoice>(`/api/invoices/${id}`, body);
  }

  validate(id: number): Observable<Invoice> {
    return this.api.post<Invoice>(`/api/invoices/${id}/validate`);
  }

  /** The recipient address is a required query parameter. */
  send(id: number, email: string): Observable<Invoice> {
    return this.api.post<Invoice>(`/api/invoices/${id}/send`, undefined, { email });
  }

  /** Drafts only — a validated invoice is corrected by a credit note. */
  cancel(id: number, reason?: string): Observable<Invoice> {
    return this.api.post<Invoice>(`/api/invoices/${id}/cancel`, undefined, { reason });
  }

  downloadPdf(id: number, reference: string): Observable<void> {
    return this.files.download(`/api/invoices/${id}/pdf`, `facture-${reference}.pdf`);
  }

  // ---- Encaissements ----

  payments(id: number): Observable<InvoicePayment[]> {
    return this.api.get<InvoicePayment[]>(`/api/invoices/${id}/payments`);
  }

  recordPayment(body: RecordPaymentRequest): Observable<InvoicePayment> {
    return this.api.post<InvoicePayment>('/api/invoices/payments', body);
  }

  refundPayment(body: RefundPaymentRequest): Observable<InvoicePayment> {
    return this.api.post<InvoicePayment>('/api/invoices/payments/refund', body);
  }

  // ---- Échéanciers ----

  schedule(id: number): Observable<PaymentSchedule> {
    return this.api.get<PaymentSchedule>(`/api/invoices/${id}/schedule`);
  }

  createSchedule(body: CreateScheduleRequest): Observable<PaymentSchedule> {
    return this.api.post<PaymentSchedule>('/api/invoices/schedules', body);
  }

  recordInstallment(body: RecordInstallmentRequest): Observable<InvoicePayment> {
    return this.api.post<InvoicePayment>('/api/invoices/schedules/installments', body);
  }
}
