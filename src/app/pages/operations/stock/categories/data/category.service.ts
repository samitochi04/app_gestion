import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../core/services/api.service';
import { Category, CategoryRequest } from './category.model';

/** Categories are a flat lookup list (not paginated) per the backend spec. */
@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly api = inject(ApiService);

  list(): Observable<Category[]> {
    return this.api.get<Category[]>('/api/categories');
  }

  create(body: CategoryRequest): Observable<Category> {
    return this.api.post<Category>('/api/categories', body);
  }

  update(id: number, body: CategoryRequest): Observable<Category> {
    return this.api.put<Category>(`/api/categories/${id}`, body);
  }

  delete(id: number): Observable<unknown> {
    return this.api.delete(`/api/categories/${id}`);
  }
}
