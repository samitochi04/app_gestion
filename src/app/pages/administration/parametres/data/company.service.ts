import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api.service';
import {
  BillingSettingsRequest, CompanyContactRequest, CompanyIdentityRequest,
  CompanyLegalRequest, CompanySettings,
} from './company.model';

/**
 * Company settings (`/api/company`). Updates are split by concern rather than
 * one big PUT, so saving contact details can never overwrite legal mentions
 * with stale values from another screen.
 */
@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly api = inject(ApiService);

  get(): Observable<CompanySettings> {
    return this.api.get<CompanySettings>('/api/company');
  }

  updateIdentity(body: CompanyIdentityRequest): Observable<CompanySettings> {
    return this.api.put<CompanySettings>('/api/company/identity', body);
  }

  updateContact(body: CompanyContactRequest): Observable<CompanySettings> {
    return this.api.put<CompanySettings>('/api/company/contact', body);
  }

  updateLegal(body: CompanyLegalRequest): Observable<CompanySettings> {
    return this.api.put<CompanySettings>('/api/company/legal', body);
  }

  updateBillingSettings(body: BillingSettingsRequest): Observable<CompanySettings> {
    return this.api.put<CompanySettings>('/api/company/billing-settings', body);
  }

  uploadLogo(file: File): Observable<CompanySettings> {
    return this.api.upload<CompanySettings>('/api/company/logo', file);
  }

  uploadSignature(file: File, label?: string): Observable<CompanySettings> {
    return this.api.upload<CompanySettings>('/api/company/signature', file, { label });
  }

  /**
   * The two deletions answer `Void`, not the updated settings, so they chain a
   * re-read to keep every caller on the same "returns the fresh state" contract.
   */
  deleteLogo(): Observable<CompanySettings> {
    return this.api.delete<void>('/api/company/logo').pipe(switchMap(() => this.get()));
  }

  deleteSignature(): Observable<CompanySettings> {
    return this.api.delete<void>('/api/company/signature').pipe(switchMap(() => this.get()));
  }
}
