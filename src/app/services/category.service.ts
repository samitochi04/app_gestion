import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest
} from '../models/business.model';
import { ApiResponse } from '../models/user.model';
import { unwrapData } from '../utils/http.util';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  constructor(private readonly http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<ApiResponse<Category[]>>(this.apiUrl).pipe(unwrapData());
  }

  createCategory(request: CreateCategoryRequest): Observable<Category> {
    return this.http.post<ApiResponse<Category>>(this.apiUrl, request).pipe(unwrapData());
  }

  updateCategory(categoryId: number, request: UpdateCategoryRequest): Observable<Category> {
    return this.http.put<ApiResponse<Category>>(`${this.apiUrl}/${categoryId}`, request).pipe(unwrapData());
  }

  deleteCategory(categoryId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${categoryId}`).pipe(unwrapData());
  }
}