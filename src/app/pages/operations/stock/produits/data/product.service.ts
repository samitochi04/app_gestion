import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../core/services/api.service';
import { PageQuery, PageResponse } from '../../../../../core/models/api-response.model';
import { CreateProductRequest, Product, ProductStockInfo, UpdateProductRequest } from './product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = inject(ApiService);

  list(query?: PageQuery): Observable<PageResponse<Product>> {
    return this.api.getPage<Product>('/api/products', query);
  }

  create(body: CreateProductRequest): Observable<Product> {
    return this.api.post<Product>('/api/products', body);
  }

  update(id: number, body: UpdateProductRequest): Observable<Product> {
    return this.api.put<Product>(`/api/products/${id}`, body);
  }

  delete(id: number): Observable<unknown> {
    return this.api.delete(`/api/products/${id}`);
  }

  stock(id: number): Observable<PageResponse<ProductStockInfo>> {
    return this.api.getPage<ProductStockInfo>(`/api/products/${id}/stock`);
  }
}
