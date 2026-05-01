import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateInvoiceRequest,
  CreateScheduleRequest,
  Invoice,
  InvoiceDetail,
  InvoiceFilters,
  InvoicePage,
  Payment,
  RecordInstallmentRequest,
  RecordPaymentRequest,
  Schedule,
  UpdateInvoiceRequest
} from '../models/commercial.model';
import { ApiResponse } from '../models/user.model';
import { buildParams, unwrapData } from '../utils/http.util';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private readonly apiUrl = `${environment.apiUrl}/invoices`;

  constructor(private readonly http: HttpClient) {}

  getInvoices(filters: InvoiceFilters): Observable<InvoicePage> {
    return this.http
      .get<ApiResponse<InvoicePage>>(this.apiUrl, {
        params: buildParams({
          page: filters.page ?? 0,
          size: filters.size ?? 20,
          status: filters.status,
          customerId: filters.customerId
        })
      })
      .pipe(unwrapData());
  }

  createInvoice(request: CreateInvoiceRequest): Observable<Invoice> {
    return this.http.post<ApiResponse<Invoice>>(this.apiUrl, request).pipe(unwrapData());
  }

  updateInvoice(id: number, request: UpdateInvoiceRequest): Observable<Invoice> {
    return this.http.put<ApiResponse<Invoice>>(`${this.apiUrl}/${id}`, request).pipe(unwrapData());
  }

  getInvoiceDetail(id: number): Observable<InvoiceDetail> {
    return this.http.get<ApiResponse<InvoiceDetail>>(`${this.apiUrl}/${id}`).pipe(unwrapData());
  }

  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }

  validateInvoice(id: number): Observable<Invoice> {
    return this.http.post<ApiResponse<Invoice>>(`${this.apiUrl}/${id}/validate`, null).pipe(unwrapData());
  }

  sendInvoice(id: number, email: string): Observable<Invoice> {
    return this.http
      .post<ApiResponse<Invoice>>(`${this.apiUrl}/${id}/send`, null, {
        params: buildParams({ email })
      })
      .pipe(unwrapData());
  }

  cancelInvoice(id: number, reason: string | null): Observable<Invoice> {
    return this.http
      .post<ApiResponse<Invoice>>(`${this.apiUrl}/${id}/cancel`, null, {
        params: buildParams({ reason })
      })
      .pipe(unwrapData());
  }

  recordPayment(request: RecordPaymentRequest): Observable<Payment> {
    return this.http
      .post<ApiResponse<Payment>>(`${this.apiUrl}/payments`, request)
      .pipe(unwrapData());
  }

  getPayments(id: number): Observable<Payment[]> {
    return this.http.get<ApiResponse<Payment[]>>(`${this.apiUrl}/${id}/payments`).pipe(unwrapData());
  }

  createSchedule(request: CreateScheduleRequest): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/schedules`, request).pipe(unwrapData());
  }

  getSchedule(id: number): Observable<Schedule> {
    return this.http.get<ApiResponse<Schedule>>(`${this.apiUrl}/${id}/schedule`).pipe(unwrapData());
  }

  recordInstallment(request: RecordInstallmentRequest): Observable<Schedule> {
    return this.http
      .post<ApiResponse<Schedule>>(`${this.apiUrl}/schedules/installments`, request)
      .pipe(unwrapData());
  }
}