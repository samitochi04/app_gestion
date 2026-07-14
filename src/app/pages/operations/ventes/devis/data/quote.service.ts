import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../core/services/api.service';
import { PageQuery, PageResponse } from '../../../../../core/models/api-response.model';
import { Quote, QuoteRequest } from './quote.model';

@Injectable({ providedIn: 'root' })
export class QuoteService {
  private readonly api = inject(ApiService);

  list(query?: PageQuery): Observable<PageResponse<Quote>> {
    return this.api.getPage<Quote>('/api/quotes', query);
  }

  create(body: QuoteRequest): Observable<Quote> {
    return this.api.post<Quote>('/api/quotes', body);
  }

  update(id: number, body: QuoteRequest): Observable<Quote> {
    return this.api.put<Quote>(`/api/quotes/${id}`, body);
  }

  send(id: number): Observable<Quote> {
    return this.api.post<Quote>(`/api/quotes/${id}/send`);
  }

  convert(id: number): Observable<unknown> {
    return this.api.post(`/api/quotes/${id}/convert`);
  }
}
