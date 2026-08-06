import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageQuery, PageResponse } from '../models/api-response.model';

/** Thrown when the envelope reports a business error (success === false). */
export class ApiError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Thin wrapper over HttpClient that unwraps the standard response envelope
 * (test-backend.md). Every service in the app calls through here so envelope
 * handling, base URL, and param serialization live in exactly one place.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  get<T>(path: string, query?: PageQuery): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(this.url(path), { params: this.toParams(query) })
      .pipe(map((r) => this.unwrap(r)), catchError(this.fail));
  }

  /** Convenience for paginated list endpoints returning PageResponse<T>. */
  getPage<T>(path: string, query?: PageQuery): Observable<PageResponse<T>> {
    return this.get<PageResponse<T>>(path, query);
  }

  /**
   * `query` matters more than it looks: several backend endpoints take their
   * arguments as query parameters rather than a body (e.g. creating a chart
   * account, sending an invoice, closing a period).
   */
  post<T>(path: string, body?: unknown, query?: PageQuery): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(this.url(path), body ?? {}, { params: this.toParams(query) })
      .pipe(map((r) => this.unwrap(r)), catchError(this.fail));
  }

  put<T>(path: string, body?: unknown, query?: PageQuery): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(this.url(path), body ?? {}, { params: this.toParams(query) })
      .pipe(map((r) => this.unwrap(r)), catchError(this.fail));
  }

  /** Multipart upload (CSV/Excel imports, company logo). */
  upload<T>(path: string, file: File, query?: PageQuery, field = 'file'): Observable<T> {
    const form = new FormData();
    form.append(field, file, file.name);
    return this.http
      .post<ApiResponse<T>>(this.url(path), form, { params: this.toParams(query) })
      .pipe(map((r) => this.unwrap(r)), catchError(this.fail));
  }

  delete<T>(path: string, query?: PageQuery): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(this.url(path), { params: this.toParams(query) })
      .pipe(map((r) => this.unwrap(r)), catchError(this.fail));
  }

  /** For endpoints that return a raw payload (e.g. base64 export arrays). */
  raw<T>(path: string, query?: PageQuery): Observable<T> {
    return this.http
      .get<T>(this.url(path), { params: this.toParams(query) })
      .pipe(catchError(this.fail));
  }

  private unwrap<T>(res: ApiResponse<T>): T {
    if (!res || res.success === false) {
      const e = res?.error;
      throw new ApiError(e?.code ?? 'UNKNOWN', e?.message ?? 'Une erreur est survenue.');
    }
    return res.data as T;
  }

  private fail = (err: unknown) => throwError(() => err);

  private url(path: string): string {
    return path.startsWith('http') ? path : `${this.base}${path}`;
  }

  private toParams(query?: PageQuery): HttpParams {
    let params = new HttpParams();
    if (!query) return params;
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }
}
