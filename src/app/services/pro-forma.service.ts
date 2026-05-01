import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateProFormaRequest,
  Invoice,
  ProForma,
  ProFormaFilters,
  ProFormaPage,
  UpdateProFormaRequest
} from '../models/commercial.model';
import { ApiResponse } from '../models/user.model';
import { buildParams, unwrapData } from '../utils/http.util';

@Injectable({
  providedIn: 'root'
})
export class ProFormaService {
  private readonly apiUrl = `${environment.apiUrl}/pro-formas`;

  constructor(private readonly http: HttpClient) {}

  getProFormas(filters: ProFormaFilters): Observable<ProFormaPage> {
    return this.http
      .get<ApiResponse<ProFormaPage>>(this.apiUrl, {
        params: buildParams({
          page: filters.page ?? 0,
          size: filters.size ?? 20,
          customerId: filters.customerId
        })
      })
      .pipe(unwrapData());
  }

  createProForma(request: CreateProFormaRequest): Observable<ProForma> {
    return this.http.post<ApiResponse<ProForma>>(this.apiUrl, request).pipe(unwrapData());
  }

  updateProForma(id: number, request: UpdateProFormaRequest): Observable<ProForma> {
    return this.http.put<ApiResponse<ProForma>>(`${this.apiUrl}/${id}`, request).pipe(unwrapData());
  }

  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }

  sendProForma(id: number, email: string): Observable<ProForma> {
    return this.http
      .post<ApiResponse<ProForma>>(`${this.apiUrl}/${id}/send`, null, {
        params: buildParams({ email })
      })
      .pipe(unwrapData());
  }

  convertProForma(id: number, dueDate: string | null): Observable<Invoice> {
    return this.http
      .post<ApiResponse<Invoice>>(`${this.apiUrl}/${id}/convert`, null, {
        params: buildParams({ dueDate })
      })
      .pipe(unwrapData());
  }
}