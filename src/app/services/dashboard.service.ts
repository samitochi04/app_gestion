import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/user.model';
import { FinancialDashboard, SalesDashboard, StockDashboard } from '../models/dashboard.model';
import { unwrapData } from '../utils/http.util';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiUrl = `${environment.apiUrl}/reporting/dashboard`;

  constructor(private readonly http: HttpClient) {}

  getStockDashboard(): Observable<StockDashboard> {
    return this.http.get<ApiResponse<StockDashboard>>(`${this.apiUrl}/stock`).pipe(unwrapData());
  }

  getSalesDashboard(): Observable<SalesDashboard> {
    return this.http.get<ApiResponse<SalesDashboard>>(`${this.apiUrl}/sales`).pipe(unwrapData());
  }

  getFinancialDashboard(): Observable<FinancialDashboard> {
    return this.http.get<ApiResponse<FinancialDashboard>>(`${this.apiUrl}/financial`).pipe(unwrapData());
  }
}