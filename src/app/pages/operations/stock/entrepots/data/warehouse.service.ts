import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../core/services/api.service';
import { Warehouse, WarehouseRequest } from './warehouse.model';

@Injectable({ providedIn: 'root' })
export class WarehouseService {
  private readonly api = inject(ApiService);

  list(): Observable<Warehouse[]> {
    return this.api.get<Warehouse[]>('/api/warehouses');
  }

  create(body: WarehouseRequest): Observable<Warehouse> {
    return this.api.post<Warehouse>('/api/warehouses', body);
  }

  update(id: number, body: WarehouseRequest): Observable<Warehouse> {
    return this.api.put<Warehouse>(`/api/warehouses/${id}`, body);
  }

  delete(id: number): Observable<unknown> {
    return this.api.delete(`/api/warehouses/${id}`);
  }
}
