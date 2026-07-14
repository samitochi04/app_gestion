import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../core/services/api.service';
import { PageQuery, PageResponse } from '../../../../../core/models/api-response.model';
import { Order, OrderRequest } from './order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly api = inject(ApiService);

  list(query?: PageQuery): Observable<PageResponse<Order>> {
    return this.api.getPage<Order>('/api/orders', query);
  }

  create(body: OrderRequest): Observable<Order> {
    return this.api.post<Order>('/api/orders', body);
  }

  update(id: number, body: OrderRequest): Observable<Order> {
    return this.api.put<Order>(`/api/orders/${id}`, body);
  }

  confirm(id: number): Observable<Order> { return this.api.post<Order>(`/api/orders/${id}/confirm`); }
  prepare(id: number): Observable<Order> { return this.api.post<Order>(`/api/orders/${id}/prepare`); }
  ship(id: number): Observable<Order> { return this.api.post<Order>(`/api/orders/${id}/ship`); }
  deliver(id: number): Observable<Order> { return this.api.post<Order>(`/api/orders/${id}/deliver`); }
  cancel(id: number): Observable<Order> { return this.api.post<Order>(`/api/orders/${id}/cancel`); }
}
