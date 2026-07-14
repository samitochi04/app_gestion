import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../core/services/api.service';
import { PageQuery, PageResponse } from '../../../../../core/models/api-response.model';
import { CurrentStock, ReceiveIssueAdjustRequest, StockMovement, TransferRequest } from './movement.model';

@Injectable({ providedIn: 'root' })
export class MovementService {
  private readonly api = inject(ApiService);

  list(query?: PageQuery): Observable<PageResponse<StockMovement>> {
    return this.api.getPage<StockMovement>('/api/stock/movements', query);
  }

  receive(body: ReceiveIssueAdjustRequest): Observable<StockMovement> {
    return this.api.post<StockMovement>('/api/stock/movements/receive', body);
  }

  issue(body: ReceiveIssueAdjustRequest): Observable<StockMovement> {
    return this.api.post<StockMovement>('/api/stock/movements/issue', body);
  }

  adjust(body: ReceiveIssueAdjustRequest): Observable<StockMovement> {
    return this.api.post<StockMovement>('/api/stock/movements/adjust', body);
  }

  transfer(body: TransferRequest): Observable<StockMovement> {
    return this.api.post<StockMovement>('/api/stock/movements/transfer', body);
  }

  currentStock(query?: PageQuery): Observable<PageResponse<CurrentStock>> {
    return this.api.getPage<CurrentStock>('/api/stock/current', query);
  }
}
