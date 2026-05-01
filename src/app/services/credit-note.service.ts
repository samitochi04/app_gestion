import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateCreditNoteRequest,
  CreditNote,
  CreditNoteFilters,
  CreditNotePage
} from '../models/commercial.model';
import { ApiResponse } from '../models/user.model';
import { buildParams, unwrapData } from '../utils/http.util';

@Injectable({
  providedIn: 'root'
})
export class CreditNoteService {
  private readonly apiUrl = `${environment.apiUrl}/credit-notes`;

  constructor(private readonly http: HttpClient) {}

  getCreditNotes(filters: CreditNoteFilters): Observable<CreditNotePage> {
    return this.http
      .get<ApiResponse<CreditNotePage>>(this.apiUrl, {
        params: buildParams({
          page: filters.page ?? 0,
          size: filters.size ?? 20,
          invoiceId: filters.invoiceId
        })
      })
      .pipe(unwrapData());
  }

  createCreditNote(request: CreateCreditNoteRequest): Observable<CreditNote> {
    return this.http.post<ApiResponse<CreditNote>>(this.apiUrl, request).pipe(unwrapData());
  }

  sendCreditNote(id: number, email: string): Observable<CreditNote> {
    return this.http
      .post<ApiResponse<CreditNote>>(`${this.apiUrl}/${id}/send`, null, {
        params: buildParams({ email })
      })
      .pipe(unwrapData());
  }
}