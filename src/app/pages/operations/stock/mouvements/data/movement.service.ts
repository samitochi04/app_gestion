import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../core/services/api.service';
import { FileDownloadService } from '../../../../../core/services/file-download.service';
import { PageQuery, PageResponse } from '../../../../../core/models/api-response.model';
import {
  AdjustRequest, CurrentStock, IssueRequest, ReceiveRequest, ReserveStockRequest,
  StockLot, StockMovement, StockReservation, StockValuation, TransferRequest,
} from './movement.model';

/** Import kinds sharing the template/preview/commit triad. */
export type StockImportKind = 'categories' | 'warehouses' | 'products';

export interface ImportRowError {
  row: number;
  column?: string;
  message: string;
}

export interface ImportSummary {
  dryRun: boolean;
  totalRows: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: ImportRowError[];
  preview?: unknown[];
}

@Injectable({ providedIn: 'root' })
export class MovementService {
  private readonly api = inject(ApiService);
  private readonly files = inject(FileDownloadService);

  list(query?: PageQuery): Observable<PageResponse<StockMovement>> {
    return this.api.getPage<StockMovement>('/api/stock/movements', query);
  }

  receive(body: ReceiveRequest): Observable<StockMovement> {
    return this.api.post<StockMovement>('/api/stock/movements/receive', body);
  }

  issue(body: IssueRequest): Observable<StockMovement> {
    return this.api.post<StockMovement>('/api/stock/movements/issue', body);
  }

  /** Lines carry `newQuantity` — the counted total, not a delta. */
  adjust(body: AdjustRequest): Observable<StockMovement> {
    return this.api.post<StockMovement>('/api/stock/movements/adjust', body);
  }

  transfer(body: TransferRequest): Observable<StockMovement> {
    return this.api.post<StockMovement>('/api/stock/movements/transfer', body);
  }

  currentStock(query?: PageQuery): Observable<PageResponse<CurrentStock>> {
    return this.api.getPage<CurrentStock>('/api/stock/current', query);
  }

  /** Valuation at a given date; the backend defaults to today when omitted. */
  valuation(date?: string): Observable<StockValuation> {
    return this.api.get<StockValuation>('/api/stock/valuation', { date });
  }

  lots(productId: number): Observable<StockLot[]> {
    return this.api.get<StockLot[]>(`/api/stock/lots/product/${productId}`);
  }

  // ---- Réservations ----

  reserve(body: ReserveStockRequest): Observable<StockReservation> {
    return this.api.post<StockReservation>('/api/stock/reservations', body);
  }

  releaseReservation(reservationId: number): Observable<unknown> {
    return this.api.delete(`/api/stock/reservations/${reservationId}`);
  }

  // ---- Imports CSV/Excel ----

  downloadImportTemplate(kind: StockImportKind): Observable<void> {
    return this.files.download(`/api/stock/import/${kind}/template`, `modele-${kind}.xlsx`);
  }

  /** Writes nothing — returns the row-by-row report so errors surface first. */
  previewImport(kind: StockImportKind, file: File, overwrite = false): Observable<ImportSummary> {
    return this.api.upload<ImportSummary>(`/api/stock/import/${kind}/preview`, file, { overwrite });
  }

  commitImport(kind: StockImportKind, file: File, overwrite = false): Observable<ImportSummary> {
    return this.api.upload<ImportSummary>(`/api/stock/import/${kind}`, file, { overwrite });
  }
}
