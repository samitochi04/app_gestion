import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateProductRequest,
  Product,
  ProductFilters,
  ProductPage,
  StockCurrent,
  UpdateProductRequest
} from '../models/business.model';
import { ApiResponse } from '../models/user.model';
import { buildParams, unwrapData } from '../utils/http.util';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = `${environment.apiUrl}/products`;

  constructor(private readonly http: HttpClient) {}

  getProducts(filters: ProductFilters): Observable<ProductPage> {
    return this.http
      .get<ApiResponse<ProductPage>>(this.apiUrl, {
        params: buildParams({
          page: filters.page ?? 0,
          size: filters.size ?? 10,
          query: filters.query,
          categoryId: filters.categoryId,
          active: filters.active
        })
      })
      .pipe(unwrapData());
  }

  createProduct(request: CreateProductRequest): Observable<Product> {
    return this.http.post<ApiResponse<Product>>(this.apiUrl, request).pipe(unwrapData());
  }

  updateProduct(productId: number, request: UpdateProductRequest): Observable<Product> {
    return this.http.put<ApiResponse<Product>>(`${this.apiUrl}/${productId}`, request).pipe(unwrapData());
  }

  deleteProduct(productId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${productId}`).pipe(unwrapData());
  }

  getProductStock(productId: number): Observable<StockCurrent[]> {
    return this.http.get<ApiResponse<StockCurrent[]>>(`${this.apiUrl}/${productId}/stock`).pipe(unwrapData());
  }
}