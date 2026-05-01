import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
  Warehouse
} from '../models/business.model';
import { ApiResponse } from '../models/user.model';
import { buildParams, unwrapData } from '../utils/http.util';

@Injectable({
  providedIn: 'root'
})
export class WarehouseService {
  private readonly apiUrl = `${environment.apiUrl}/warehouses`;

  constructor(private readonly http: HttpClient) {}

  getWarehouses(activeOnly = true): Observable<Warehouse[]> {
    return this.http
      .get<ApiResponse<Warehouse[]>>(this.apiUrl, {
        params: buildParams({ activeOnly })
      })
      .pipe(unwrapData());
  }

  createWarehouse(request: CreateWarehouseRequest): Observable<Warehouse> {
    return this.http.post<ApiResponse<Warehouse>>(this.apiUrl, request).pipe(unwrapData());
  }

  updateWarehouse(warehouseId: number, request: UpdateWarehouseRequest): Observable<Warehouse> {
    return this.http
      .put<ApiResponse<Warehouse>>(`${this.apiUrl}/${warehouseId}`, request)
      .pipe(unwrapData());
  }

  deleteWarehouse(warehouseId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${warehouseId}`).pipe(unwrapData());
  }
}