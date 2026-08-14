import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { PageQuery, PageResponse } from '../../../../core/models/api-response.model';
import { CreatePurchaseOrderRequest, PurchaseOrder } from './purchase-order.model';

/** `/api/purchase-orders` — see MODULES.md § erp-supplier. */
@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private readonly api = inject(ApiService);

  list(query?: PageQuery): Observable<PageResponse<PurchaseOrder>> {
    return this.api.getPage<PurchaseOrder>('/api/purchase-orders', query);
  }

  get(id: number): Observable<PurchaseOrder> {
    return this.api.get<PurchaseOrder>(`/api/purchase-orders/${id}`);
  }

  create(body: CreatePurchaseOrderRequest): Observable<PurchaseOrder> {
    return this.api.post<PurchaseOrder>('/api/purchase-orders', body);
  }

  confirm(id: number): Observable<PurchaseOrder> {
    return this.api.post<PurchaseOrder>(`/api/purchase-orders/${id}/confirm`);
  }

  cancel(id: number): Observable<PurchaseOrder> {
    return this.api.post<PurchaseOrder>(`/api/purchase-orders/${id}/cancel`);
  }

  /**
   * Pre-fills a supplier invoice from what was actually received — the path
   * that keeps invoices from needing corrections (MODULES.md).
   */
  invoice(id: number): Observable<unknown> {
    return this.api.post(`/api/purchase-orders/${id}/invoice`);
  }
}
