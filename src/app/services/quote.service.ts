import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ConvertQuoteRequest,
  CreateQuoteRequest,
  Order,
  Quote,
  QuoteFilters,
  QuotePage,
  UpdateQuoteRequest
} from '../models/commercial.model';
import { ApiResponse } from '../models/user.model';
import { buildParams, unwrapData } from '../utils/http.util';

@Injectable({
  providedIn: 'root'
})
export class QuoteService {
  private readonly apiUrl = `${environment.apiUrl}/quotes`;

  constructor(private readonly http: HttpClient) {}

  getQuotes(filters: QuoteFilters): Observable<QuotePage> {
    return this.http
      .get<ApiResponse<QuotePage>>(this.apiUrl, {
        params: buildParams({
          page: filters.page ?? 0,
          size: filters.size ?? 20,
          status: filters.status,
          customerId: filters.customerId
        })
      })
      .pipe(unwrapData());
  }

  createQuote(request: CreateQuoteRequest): Observable<Quote> {
    return this.http.post<ApiResponse<Quote>>(this.apiUrl, request).pipe(unwrapData());
  }

  updateQuote(quoteId: number, request: UpdateQuoteRequest): Observable<Quote> {
    return this.http.put<ApiResponse<Quote>>(`${this.apiUrl}/${quoteId}`, request).pipe(unwrapData());
  }

  sendQuote(quoteId: number): Observable<Quote> {
    return this.http.post<ApiResponse<Quote>>(`${this.apiUrl}/${quoteId}/send`, null).pipe(unwrapData());
  }

  convertQuote(quoteId: number, request: ConvertQuoteRequest): Observable<Order> {
    return this.http
      .post<ApiResponse<Order>>(`${this.apiUrl}/${quoteId}/convert`, request)
      .pipe(unwrapData());
  }
}