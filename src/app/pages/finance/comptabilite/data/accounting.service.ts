import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { PageQuery, PageResponse } from '../../../../core/models/api-response.model';
import { environment } from '../../../../../environments/environment';
import {
  AccountingPeriod, AccountingPeriodRequest, Balance, ChartAccount, ChartAccountRequest,
  GrandLivre, JournalEntry, OdEntryRequest,
} from './accounting.model';

@Injectable({ providedIn: 'root' })
export class AccountingService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  // --- Plan comptable ---
  chartList(query?: PageQuery): Observable<PageResponse<ChartAccount>> {
    return this.api.getPage<ChartAccount>('/api/accounting/chart', query);
  }
  chartCreate(body: ChartAccountRequest): Observable<ChartAccount> {
    return this.api.post<ChartAccount>('/api/accounting/chart', body);
  }
  chartUpdate(id: number, body: ChartAccountRequest): Observable<ChartAccount> {
    return this.api.put<ChartAccount>(`/api/accounting/chart/${id}`, body);
  }
  chartActivate(id: number): Observable<ChartAccount> { return this.api.post<ChartAccount>(`/api/accounting/chart/${id}/activate`); }
  chartDeactivate(id: number): Observable<ChartAccount> { return this.api.post<ChartAccount>(`/api/accounting/chart/${id}/deactivate`); }

  // --- Journal ---
  journalList(query?: PageQuery): Observable<PageResponse<JournalEntry>> {
    return this.api.getPage<JournalEntry>('/api/accounting/journal', query);
  }
  journalCreateOd(body: OdEntryRequest): Observable<JournalEntry> {
    return this.api.post<JournalEntry>('/api/accounting/journal/od', body);
  }
  journalReverse(id: number): Observable<JournalEntry> {
    return this.api.post<JournalEntry>(`/api/accounting/journal/${id}/reverse`);
  }

  // --- Balance / Grand livre ---
  balance(from: string, to: string): Observable<Balance> {
    return this.api.get<Balance>('/api/accounting/balance', { from, to });
  }
  grandLivre(from: string, to: string): Observable<GrandLivre> {
    return this.api.get<GrandLivre>('/api/accounting/grand-livre', { from, to });
  }

  // --- Périodes ---
  periods(): Observable<AccountingPeriod[]> {
    return this.api.get<AccountingPeriod[]>('/api/accounting/periods');
  }
  createPeriod(body: AccountingPeriodRequest): Observable<AccountingPeriod> {
    return this.api.post<AccountingPeriod>('/api/accounting/periods', body);
  }
  closePeriod(id: number): Observable<AccountingPeriod> { return this.api.post<AccountingPeriod>(`/api/accounting/periods/${id}/close`); }
  reopenPeriod(id: number): Observable<AccountingPeriod> { return this.api.post<AccountingPeriod>(`/api/accounting/periods/${id}/reopen`); }

  // --- Exports (binary downloads, bypass the JSON envelope) ---
  private downloadExport(path: string, filename: string, params: Record<string, string>): void {
    const url = new URL(`${environment.apiBaseUrl}${path}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    this.http.get(url.toString(), { responseType: 'blob' }).subscribe((blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    });
  }

  exportBalance(from: string, to: string): void { this.downloadExport('/api/reporting/export/balance', 'balance.xlsx', { from, to }); }
  exportGrandLivre(from: string, to: string): void { this.downloadExport('/api/reporting/export/grand-livre', 'grand-livre.xlsx', { from, to }); }
  exportJournal(from: string, to: string): void { this.downloadExport('/api/reporting/export/journal', 'journal.xlsx', { from, to }); }
  exportBilan(from: string, to: string): void { this.downloadExport('/api/reporting/export/bilan', 'bilan.xlsx', { from, to }); }
  exportCompteResultat(from: string, to: string): void { this.downloadExport('/api/reporting/export/compte-resultat', 'compte-resultat.xlsx', { from, to }); }
}
