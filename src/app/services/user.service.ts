import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { User, ApiResponse, PageResponse } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private readonly http: HttpClient) {}

  getUsers(page = 0, size = 20): Observable<User[]> {
    return this.http.get<ApiResponse<PageResponse<User>>>(`${this.apiUrl}?page=${page}&size=${size}`).pipe(
      map(response => response.data.content)
    );
  }

  assignRole(userId: string, roleId: number): Observable<User> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/${userId}/roles/${roleId}`, null).pipe(
      map(response => response.data)
    );
  }
}
