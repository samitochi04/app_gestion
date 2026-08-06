import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../core/services/api.service';
import { CreateWarehouseRequest, UpdateWarehouseRequest, Warehouse } from './warehouse.model';

@Injectable({ providedIn: 'root' })
export class WarehouseService {
  private readonly api = inject(ApiService);

  /** Flat lookup list, not paginated. */
  list(activeOnly?: boolean): Observable<Warehouse[]> {
    return this.api.get<Warehouse[]>('/api/warehouses', activeOnly ? { activeOnly: true } : undefined);
  }

  create(body: CreateWarehouseRequest): Observable<Warehouse> {
    return this.api.post<Warehouse>('/api/warehouses', body);
  }

  update(id: number, body: UpdateWarehouseRequest): Observable<Warehouse> {
    return this.api.put<Warehouse>(`/api/warehouses/${id}`, body);
  }

  delete(id: number): Observable<unknown> {
    return this.api.delete(`/api/warehouses/${id}`);
  }

  /** Designate the warehouse that receives supplier deliveries. */
  markPurchaseDefault(id: number): Observable<Warehouse> {
    return this.api.post<Warehouse>(`/api/warehouses/${id}/purchase-default`);
  }

  /** Designate the warehouse that receives damaged goods on reception. */
  markDamagedDefault(id: number): Observable<Warehouse> {
    return this.api.post<Warehouse>(`/api/warehouses/${id}/damaged-default`);
  }
}
