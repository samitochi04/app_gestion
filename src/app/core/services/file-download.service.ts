import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PageQuery } from '../models/api-response.model';
import { ToastService } from './toast.service';

/**
 * Binary downloads (PDF/Excel/CSV exports, invoice documents, import
 * templates). These bypass the `ApiResponse` envelope, so they cannot go
 * through `ApiService`. Every caller needs the same three things — bearer
 * token, filename, object-URL cleanup — so they live here once.
 *
 * Requests still pass through the HTTP interceptors, which is what attaches
 * the bearer token.
 */
@Injectable({ providedIn: 'root' })
export class FileDownloadService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);

  /**
   * Fetch and save. `fallbackName` is used only when the server sends no
   * `Content-Disposition` filename.
   */
  download(path: string, fallbackName: string, query?: PageQuery): Observable<void> {
    return this.http
      .get(`${environment.apiBaseUrl}${path}`, {
        params: this.toParams(query),
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        map((res) => this.save(res, fallbackName)),
        catchError((err) => {
          this.toast.error('Téléchargement impossible.');
          return throwError(() => err);
        }),
      );
  }

  private save(res: HttpResponse<Blob>, fallbackName: string): void {
    const blob = res.body;
    if (!blob) throw new Error('Réponse vide');

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = this.filenameFrom(res) ?? fallbackName;
    link.click();
    // Revoking synchronously can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  /** `Content-Disposition: attachment; filename="balance-2026.pdf"` */
  private filenameFrom(res: HttpResponse<Blob>): string | null {
    const header = res.headers.get('Content-Disposition');
    if (!header) return null;
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
    return match ? decodeURIComponent(match[1].trim()) : null;
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
