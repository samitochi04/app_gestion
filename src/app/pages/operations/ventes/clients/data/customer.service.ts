import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../core/services/api.service';
import { PageQuery, PageResponse } from '../../../../../core/models/api-response.model';
import { Customer, CustomerRequest } from './customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly api = inject(ApiService);

  list(query?: PageQuery): Observable<PageResponse<Customer>> {
    return this.api.getPage<Customer>('/api/customers', query);
  }

  create(body: CustomerRequest): Observable<Customer> {
    return this.api.post<Customer>('/api/customers', body);
  }

  update(id: number, body: CustomerRequest): Observable<Customer> {
    return this.api.put<Customer>(`/api/customers/${id}`, body);
  }

  delete(id: number): Observable<unknown> {
    return this.api.delete(`/api/customers/${id}`);
  }
}
