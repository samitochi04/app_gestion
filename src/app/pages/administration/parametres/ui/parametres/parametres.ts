import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../shared/ui/card/card';
import { Button } from '../../../../../shared/ui/button/button';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../shared/ui/text-input/text-input';
import { SegmentedTabs, TabOption } from '../../../../../shared/ui/segmented-tabs/segmented-tabs';
import { ToastService } from '../../../../../core/services/toast.service';
import { ApiError } from '../../../../../core/services/api.service';
import { THEME_OPTIONS, ThemeService } from '../../../../../core/services/theme.service';
import { CompanySettings } from '../../data/company.model';
import { CompanyService } from '../../data/company.service';

const TABS: TabOption[] = [
  { value: 'societe', label: 'Société' },
  { value: 'facturation', label: 'Facturation' },
  { value: 'apparence', label: 'Apparence' },
];

/**
 * Two kinds of setting live here: the company identity printed on documents,
 * which the backend stores, and the theme, which is personal and local.
 * Company updates are split by concern, mirroring the four backend commands —
 * saving contact details can never overwrite legal mentions with stale values.
 */
@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeader, Card, Button, FormField, TextInput, SegmentedTabs],
  templateUrl: './parametres.html',
  styleUrl: './parametres.css',
})
export class Parametres implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CompanyService);
  private readonly toast = inject(ToastService);

  themeService = inject(ThemeService);
  options = THEME_OPTIONS;

  tabs = TABS;
  activeTab = signal('societe');
  loading = signal(true);
  saving = signal(false);
  company = signal<CompanySettings | null>(null);

  identityForm = this.fb.group({ name: [''], legalForm: [''], slogan: [''] });
  contactForm = this.fb.group({
    address: [''], city: [''], postalCode: [''], country: [''],
    phone: [''], phone2: [''], email: [''], website: [''],
  });
  legalForm = this.fb.group({
    nui: [''], rccm: [''], niu: [''], taxRegime: [''], authorizedCapital: [null as number | null],
  });
  billingForm = this.fb.group({
    defaultVatRate: [null as number | null], invoiceFooter: [''], invoiceTerms: [''],
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.service.get().subscribe({
      next: (c) => { this.company.set(c); this.patch(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  saveIdentity(): void {
    const v = this.identityForm.getRawValue();
    this.persist(this.service.updateIdentity({
      name: v.name ?? undefined, legalForm: v.legalForm ?? undefined, slogan: v.slogan ?? undefined,
    }), 'Identité enregistrée.');
  }

  saveContact(): void {
    const v = this.contactForm.getRawValue();
    this.persist(this.service.updateContact({
      address: v.address ?? undefined, city: v.city ?? undefined, postalCode: v.postalCode ?? undefined,
      country: v.country ?? undefined, phone: v.phone ?? undefined, phone2: v.phone2 ?? undefined,
      email: v.email ?? undefined, website: v.website ?? undefined,
    }), 'Coordonnées enregistrées.');
  }

  saveLegal(): void {
    const v = this.legalForm.getRawValue();
    this.persist(this.service.updateLegal({
      nui: v.nui ?? undefined, rccm: v.rccm ?? undefined, niu: v.niu ?? undefined,
      taxRegime: v.taxRegime ?? undefined, authorizedCapital: v.authorizedCapital ?? undefined,
    }), 'Mentions légales enregistrées.');
  }

  saveBilling(): void {
    const v = this.billingForm.getRawValue();
    this.persist(this.service.updateBillingSettings({
      defaultVatRate: v.defaultVatRate ?? undefined,
      invoiceFooter: v.invoiceFooter ?? undefined,
      invoiceTerms: v.invoiceTerms ?? undefined,
    }), 'Paramètres de facturation enregistrés.');
  }

  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.persist(this.service.uploadLogo(file), 'Logo mis à jour.');
  }

  removeLogo(): void { this.persist(this.service.deleteLogo(), 'Logo supprimé.'); }

  onSignatureSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.persist(this.service.uploadSignature(file), 'Signature mise à jour.');
  }

  removeSignature(): void { this.persist(this.service.deleteSignature(), 'Signature supprimée.'); }

  private persist(request$: Observable<CompanySettings>, successMessage: string): void {
    this.saving.set(true);
    request$.subscribe({
      next: (c) => { this.company.set(c); this.patch(c); this.saving.set(false); this.toast.success(successMessage); },
      error: (e) => { this.saving.set(false); this.toast.error(e instanceof ApiError ? e.message : 'Enregistrement impossible.'); },
    });
  }

  private patch(c: CompanySettings): void {
    this.identityForm.patchValue({ name: c.name, legalForm: c.legalForm, slogan: c.slogan });
    this.contactForm.patchValue({
      address: c.address, city: c.city, postalCode: c.postalCode, country: c.country,
      phone: c.phone, phone2: c.phone2, email: c.email, website: c.website,
    });
    this.legalForm.patchValue({
      nui: c.nui, rccm: c.rccm, niu: c.niu, taxRegime: c.taxRegime, authorizedCapital: c.authorizedCapital,
    });
    this.billingForm.patchValue({
      defaultVatRate: c.defaultVatRate, invoiceFooter: c.invoiceFooter, invoiceTerms: c.invoiceTerms,
    });
  }
}
