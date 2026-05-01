import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AdjustStockRequest,
  IssueStockRequest,
  ReceiveStockRequest,
  Reservation,
  ReserveStockRequest,
  StockCurrentPage,
  StockLot,
  StockMovement,
  StockMovementFilters,
  StockMovementPage,
  TransferStockRequest
} from '../models/business.model';
import { ApiResponse } from '../models/user.model';
import { buildParams, unwrapData } from '../utils/http.util';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private readonly apiUrl = `${environment.apiUrl}/stock`;

  constructor(private readonly http: HttpClient) {}

  getCurrent(page = 0, size = 20): Observable<StockCurrentPage> {
    return this.http
      .get<ApiResponse<StockCurrentPage>>(`${this.apiUrl}/current`, {
        params: buildParams({ page, size })
      })
      .pipe(unwrapData());
  }

  getMovements(filters: StockMovementFilters): Observable<StockMovementPage> {
    return this.http
      .get<ApiResponse<StockMovementPage>>(`${this.apiUrl}/movements`, {
        params: buildParams({
          page: filters.page ?? 0,
          size: filters.size ?? 20,
          type: filters.type,
          warehouseId: filters.warehouseId
        })
      })
      .pipe(unwrapData());
  }

  getLots(productId: number): Observable<StockLot[]> {
    return this.http
      .get<ApiResponse<StockLot[]>>(`${this.apiUrl}/lots/product/${productId}`)
      .pipe(unwrapData());
  }

  receive(request: ReceiveStockRequest): Observable<StockMovement> {
    return this.http
      .post<ApiResponse<StockMovement>>(`${this.apiUrl}/movements/receive`, request)
      .pipe(unwrapData());
  }

  issue(request: IssueStockRequest): Observable<StockMovement> {
    return this.http
      .post<ApiResponse<StockMovement>>(`${this.apiUrl}/movements/issue`, request)
      .pipe(unwrapData());
  }

  adjust(request: AdjustStockRequest): Observable<StockMovement> {
    return this.http
      .post<ApiResponse<StockMovement>>(`${this.apiUrl}/movements/adjust`, request)
      .pipe(unwrapData());
  }

  transfer(request: TransferStockRequest): Observable<StockMovement> {
    return this.http
      .post<ApiResponse<StockMovement>>(`${this.apiUrl}/movements/transfer`, request)
      .pipe(unwrapData());
  }

  reserve(request: ReserveStockRequest): Observable<Reservation> {
    return this.http.post<ApiResponse<Reservation>>(`${this.apiUrl}/reservations`, request).pipe(unwrapData());
  }

  release(reservationId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/reservations/${reservationId}`).pipe(unwrapData());
  }
}