import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateOrderRequest,
  Order,
  OrderFilters,
  OrderPage,
  UpdateOrderRequest
} from '../models/commercial.model';
import { ApiResponse } from '../models/user.model';
import { buildParams, unwrapData } from '../utils/http.util';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = `${environment.apiUrl}/orders`;

  constructor(private readonly http: HttpClient) {}

  getOrders(filters: OrderFilters): Observable<OrderPage> {
    return this.http
      .get<ApiResponse<OrderPage>>(this.apiUrl, {
        params: buildParams({
          page: filters.page ?? 0,
          size: filters.size ?? 20,
          status: filters.status,
          customerId: filters.customerId
        })
      })
      .pipe(unwrapData());
  }

  createOrder(request: CreateOrderRequest): Observable<Order> {
    return this.http.post<ApiResponse<Order>>(this.apiUrl, request).pipe(unwrapData());
  }

  updateOrder(orderId: number, request: UpdateOrderRequest): Observable<Order> {
    return this.http.put<ApiResponse<Order>>(`${this.apiUrl}/${orderId}`, request).pipe(unwrapData());
  }

  confirmOrder(orderId: number): Observable<Order> {
    return this.http.post<ApiResponse<Order>>(`${this.apiUrl}/${orderId}/confirm`, null).pipe(unwrapData());
  }

  prepareOrder(orderId: number): Observable<Order> {
    return this.http.post<ApiResponse<Order>>(`${this.apiUrl}/${orderId}/prepare`, null).pipe(unwrapData());
  }

  shipOrder(orderId: number): Observable<Order> {
    return this.http.post<ApiResponse<Order>>(`${this.apiUrl}/${orderId}/ship`, null).pipe(unwrapData());
  }

  deliverOrder(orderId: number): Observable<Order> {
    return this.http.post<ApiResponse<Order>>(`${this.apiUrl}/${orderId}/deliver`, null).pipe(unwrapData());
  }

  cancelOrder(orderId: number): Observable<Order> {
    return this.http.post<ApiResponse<Order>>(`${this.apiUrl}/${orderId}/cancel`, null).pipe(unwrapData());
  }
}