import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FileDownloadService } from './file-download.service';

export type ExportFormat = 'PDF' | 'EXCEL' | 'CSV';

/** Every accounting export takes the same `from`/`to`/`format` triad. */
export interface ExportWindow {
  from: string;
  to: string;
  format?: ExportFormat;
}

/** The eleven documents erp-reporting renders, keyed by their endpoint slug. */
export const ACCOUNTING_EXPORTS = {
  'grand-livre': 'Grand livre',
  'balance': 'Balance générale',
  'balance-6-colonnes': 'Balance 6 colonnes',
  'balance-tiers': 'Balance des tiers',
  'balance-agee': 'Balance âgée',
  'journal': 'Journal',
  'bilan': 'Bilan',
  'compte-resultat': 'Compte de résultat',
  'livre-tresorerie': 'Livre de trésorerie',
} as const;

export type AccountingExport = keyof typeof ACCOUNTING_EXPORTS;

const EXTENSION: Record<ExportFormat, string> = { PDF: 'pdf', EXCEL: 'xlsx', CSV: 'csv' };

/**
 * Documentary exports (`/api/reporting/export/**`). They return a binary
 * stream, not the JSON envelope, so they go through `FileDownloadService`.
 */
@Injectable({ providedIn: 'root' })
export class ReportingExportService {
  private readonly files = inject(FileDownloadService);

  accounting(
    document: AccountingExport,
    window: ExportWindow,
    extra: Record<string, string | number | undefined> = {},
  ): Observable<void> {
    const format = window.format ?? 'PDF';
    return this.files.download(
      `/api/reporting/export/${document}`,
      `${document}-${window.from}_${window.to}.${EXTENSION[format]}`,
      { from: window.from, to: window.to, format, ...extra },
    );
  }

  stock(window: ExportWindow, warehouseId?: number): Observable<void> {
    const format = window.format ?? 'PDF';
    return this.files.download(
      '/api/reporting/export/stock',
      `etat-stock-${window.to}.${EXTENSION[format]}`,
      { from: window.from, to: window.to, format, warehouseId },
    );
  }

  product(productId: number, window: ExportWindow): Observable<void> {
    const format = window.format ?? 'PDF';
    return this.files.download(
      '/api/reporting/export/produit',
      `fiche-produit-${productId}.${EXTENSION[format]}`,
      { productId, from: window.from, to: window.to, format },
    );
  }
}
