import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateCustomerRequest,
  Customer,
  CustomerFilters,
  CustomerPage,
  UpdateCustomerRequest
} from '../models/business.model';
import { ApiResponse } from '../models/user.model';
import { buildParams, unwrapData } from '../utils/http.util';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private readonly apiUrl = `${environment.apiUrl}/customers`;

  constructor(private readonly http: HttpClient) {}

  getCustomers(filters: CustomerFilters): Observable<CustomerPage> {
    return this.http
      .get<ApiResponse<CustomerPage>>(this.apiUrl, {
        params: buildParams({
          page: filters.page ?? 0,
          size: filters.size ?? 20,
          query: filters.query,
          active: filters.active
        })
      })
      .pipe(unwrapData());
  }

  createCustomer(request: CreateCustomerRequest): Observable<Customer> {
    return this.http.post<ApiResponse<Customer>>(this.apiUrl, request).pipe(unwrapData());
  }

  updateCustomer(customerId: number, request: UpdateCustomerRequest): Observable<Customer> {
    return this.http.put<ApiResponse<Customer>>(`${this.apiUrl}/${customerId}`, request).pipe(unwrapData());
  }

  deleteCustomer(customerId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${customerId}`).pipe(unwrapData());
  }
}