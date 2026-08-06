import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../core/services/api.service';
import { FileDownloadService } from '../../../../../core/services/file-download.service';
import { PageQuery, PageResponse } from '../../../../../core/models/api-response.model';
import { Invoice } from '../../factures/data/invoice.model';
import { CreateProFormaRequest, ProForma, UpdateProFormaRequest } from './pro-forma.model';

@Injectable({ providedIn: 'root' })
export class ProFormaService {
  private readonly api = inject(ApiService);
  private readonly files = inject(FileDownloadService);

  list(query?: PageQuery): Observable<PageResponse<ProForma>> {
    return this.api.getPage<ProForma>('/api/pro-formas', query);
  }

  create(body: CreateProFormaRequest): Observable<ProForma> {
    return this.api.post<ProForma>('/api/pro-formas', body);
  }

  update(id: number, body: UpdateProFormaRequest): Observable<ProForma> {
    return this.api.put<ProForma>(`/api/pro-formas/${id}`, body);
  }

  /** The recipient address is a required query parameter. */
  send(id: number, email: string): Observable<ProForma> {
    return this.api.post<ProForma>(`/api/pro-formas/${id}/send`, undefined, { email });
  }

  /** Produces the draft sales invoice. `dueDate` is optional. */
  convert(id: number, dueDate?: string): Observable<Invoice> {
    return this.api.post<Invoice>(`/api/pro-formas/${id}/convert`, undefined, { dueDate });
  }

  downloadPdf(id: number, reference: string): Observable<void> {
    return this.files.download(`/api/pro-formas/${id}/pdf`, `pro-forma-${reference}.pdf`);
  }
}
