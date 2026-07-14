import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { FinancialDashboard, SalesDashboard, StockDashboard } from './dashboard.model';

/** Reporting dashboard endpoints (test-backend.md §Reporting). */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  financial(): Observable<FinancialDashboard> {
    return this.api.get<FinancialDashboard>('/api/reporting/dashboard/financial');
  }

  sales(): Observable<SalesDashboard> {
    return this.api.get<SalesDashboard>('/api/reporting/dashboard/sales');
  }

  stock(): Observable<StockDashboard> {
    return this.api.get<StockDashboard>('/api/reporting/dashboard/stock');
  }
}
