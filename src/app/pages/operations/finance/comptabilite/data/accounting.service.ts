import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../../../core/services/api.service';
import { PageQuery, PageResponse } from '../../../../../core/models/api-response.model';
import {
  AccountingMapping, AccountingPeriod, Balance, ChartAccount, CreateChartAccountRequest,
  CreatePeriodRequest, GrandLivre, InboxEvent, InboxSummary, JournalEntry, Lettering,
  OdEntryRequest, RetryResult, UpsertMappingRequest,
} from './accounting.model';

/**
 * erp-accounting. Watch the argument style: several write endpoints here take
 * **query parameters** rather than a JSON body (`POST /chart`, `PUT /chart/{id}`,
 * `POST /periods`, `letter/auto`). Sending a body to those returns 400.
 */
@Injectable({ providedIn: 'root' })
export class AccountingService {
  private readonly api = inject(ApiService);

  // ---- Plan comptable ----

  chartList(query?: PageQuery): Observable<PageResponse<ChartAccount>> {
    return this.api.getPage<ChartAccount>('/api/accounting/chart', query);
  }

  chartGet(id: number): Observable<ChartAccount> {
    return this.api.get<ChartAccount>(`/api/accounting/chart/${id}`);
  }

  chartCreate(body: CreateChartAccountRequest): Observable<ChartAccount> {
    return this.api.post<ChartAccount>('/api/accounting/chart', undefined, { ...body });
  }

  /** Only the label is mutable — the code identifies the account. */
  chartUpdate(id: number, label: string): Observable<ChartAccount> {
    return this.api.put<ChartAccount>(`/api/accounting/chart/${id}`, undefined, { label });
  }

  chartActivate(id: number): Observable<ChartAccount> {
    return this.api.post<ChartAccount>(`/api/accounting/chart/${id}/activate`);
  }

  chartDeactivate(id: number): Observable<ChartAccount> {
    return this.api.post<ChartAccount>(`/api/accounting/chart/${id}/deactivate`);
  }

  chartImport(file: File, overwrite = false): Observable<unknown> {
    return this.api.upload('/api/accounting/chart/import', file, { overwrite });
  }

  // ---- Journal ----

  journalList(query?: PageQuery): Observable<PageResponse<JournalEntry>> {
    return this.api.getPage<JournalEntry>('/api/accounting/journal', query);
  }

  journalGet(id: number): Observable<JournalEntry> {
    return this.api.get<JournalEntry>(`/api/accounting/journal/${id}`);
  }

  journalCreateOd(body: OdEntryRequest): Observable<JournalEntry> {
    return this.api.post<JournalEntry>('/api/accounting/journal/od', body);
  }

  journalReverse(id: number): Observable<JournalEntry> {
    return this.api.post<JournalEntry>(`/api/accounting/journal/${id}/reverse`);
  }

  // ---- Lettrage ----

  letterings(accountCode: string): Observable<Lettering[]> {
    return this.api.get<Lettering[]>('/api/accounting/journal/letterings', { accountCode });
  }

  /**
   * Matches exact debit/credit pairs first, then balancing combinations.
   * The endpoint answers a single lettering or a list depending on how many it
   * matched, so the shape is normalised here rather than at every call site.
   */
  letterAuto(accountCode: string, from: string, to: string): Observable<Lettering[]> {
    return this.api
      .post<Lettering | Lettering[] | null>('/api/accounting/journal/letter/auto', undefined, { accountCode, from, to })
      .pipe(map((result) => (Array.isArray(result) ? result : result ? [result] : [])));
  }

  letterManual(lineIds: number[]): Observable<Lettering> {
    return this.api.post<Lettering>('/api/accounting/journal/letter/manual', { lineIds });
  }

  unletter(letteringId: number): Observable<unknown> {
    return this.api.delete(`/api/accounting/journal/letter/${letteringId}`);
  }

  // ---- Balance / Grand livre ----

  balance(from: string, to: string): Observable<Balance> {
    return this.api.get<Balance>('/api/accounting/balance', { from, to });
  }

  grandLivre(from: string, to: string, accountCode?: string): Observable<GrandLivre> {
    return this.api.get<GrandLivre>('/api/accounting/grand-livre', { from, to, accountCode });
  }

  // ---- Périodes ----

  /** `year` is mandatory — the endpoint returns one exercise at a time. */
  periods(year: number): Observable<AccountingPeriod[]> {
    return this.api.get<AccountingPeriod[]>('/api/accounting/periods', { year });
  }

  createPeriod(body: CreatePeriodRequest): Observable<AccountingPeriod> {
    return this.api.post<AccountingPeriod>('/api/accounting/periods', undefined, { ...body });
  }

  closePeriod(id: number): Observable<AccountingPeriod> {
    return this.api.post<AccountingPeriod>(`/api/accounting/periods/${id}/close`);
  }

  reopenPeriod(id: number): Observable<AccountingPeriod> {
    return this.api.post<AccountingPeriod>(`/api/accounting/periods/${id}/reopen`);
  }

  // ---- Correspondances de comptes ----

  mappings(entityType?: string): Observable<AccountingMapping[]> {
    return this.api.get<AccountingMapping[]>('/api/accounting/mappings', { entityType });
  }

  /** Falls back: precise mapping → default mapping → hard-coded, else `471`. */
  resolveMapping(entityType: string, accountType: string, entityId?: string): Observable<AccountingMapping> {
    return this.api.get<AccountingMapping>('/api/accounting/mappings/resolve', { entityType, accountType, entityId });
  }

  upsertMapping(body: UpsertMappingRequest): Observable<AccountingMapping> {
    return this.api.put<AccountingMapping>('/api/accounting/mappings', body);
  }

  deleteMapping(id: number): Observable<unknown> {
    return this.api.delete(`/api/accounting/mappings/${id}`);
  }

  // ---- Inbox comptable ----

  inbox(query?: PageQuery): Observable<PageResponse<InboxEvent>> {
    return this.api.getPage<InboxEvent>('/api/accounting/inbox', query);
  }

  inboxSummary(): Observable<InboxSummary> {
    return this.api.get<InboxSummary>('/api/accounting/inbox/summary');
  }

  retryInboxEvent(id: number): Observable<unknown> {
    return this.api.post(`/api/accounting/inbox/${id}/retry`);
  }

  retryFailedInbox(): Observable<RetryResult> {
    return this.api.post<RetryResult>('/api/accounting/inbox/retry-failed');
  }
}
