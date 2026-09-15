import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../shared/ui/card/card';
import { Button } from '../../../../../shared/ui/button/button';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { TextInput } from '../../../../../shared/ui/text-input/text-input';
import { Select, SelectOption } from '../../../../../shared/ui/select/select';
import { SegmentedTabs, TabOption } from '../../../../../shared/ui/segmented-tabs/segmented-tabs';
import { ToastService } from '../../../../../core/services/toast.service';
import { ApiError, ApiService } from '../../../../../core/services/api.service';
import { THEME_OPTIONS, ThemeService } from '../../../../../core/services/theme.service';
import { CompanySettings } from '../../data/company.model';
import { CompanyService } from '../../data/company.service';
import { WarehouseService } from '../../../../operations/stock/entrepots/data/warehouse.service';
import { Warehouse } from '../../../../operations/stock/entrepots/data/warehouse.model';
import { AccountingService } from '../../../../operations/finance/comptabilite/data/accounting.service';

const TABS: TabOption[] = [
  { value: 'societe', label: 'Société' },
  { value: 'facturation', label: 'Facturation' },
  { value: 'stocks', label: 'Stocks' },
  { value: 'apparence', label: 'Apparence' },
];

const IMPORT_TYPES: SelectOption[] = [
  { value: 'categories', label: 'Catégories' },
  { value: 'warehouses', label: 'Entrepôts' },
  { value: 'products', label: 'Produits' },
];

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, PageHeader, Card, Button, FormField, TextInput, Select, SegmentedTabs],
  templateUrl: './parametres.html',
  styleUrl: './parametres.css',
})
export class Parametres implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CompanyService);
  private readonly toast = inject(ToastService);
  private readonly api = inject(ApiService);
  private readonly warehouseService = inject(WarehouseService);
  private readonly accountingService = inject(AccountingService);

  themeService = inject(ThemeService);
  options = THEME_OPTIONS;

  tabs = TABS;
  activeTab = signal('societe');
  loading = signal(true);
  saving = signal(false);
  company = signal<CompanySettings | null>(null);

  // --- Stock tab ---
  importTypes = IMPORT_TYPES;
  selectedImportType = signal<string>('products');
  importingStock = signal(false);
  importingChart = signal(false);
  warehouses = signal<Warehouse[]>([]);
  warehouseOptions = signal<SelectOption[]>([]);
  purchaseDefaultId = signal<number | null>(null);
  damagedDefaultId = signal<number | null>(null);
  loadingWarehouses = signal(false);
  settingDefault = signal(false);

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

  ngOnInit(): void {
    this.load();
    this.loadWarehouses();
  }

  load(): void {
    this.loading.set(true);
    this.service.get().subscribe({
      next: (c) => { this.company.set(c); this.patch(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  loadWarehouses(): void {
    this.loadingWarehouses.set(true);
    this.warehouseService.list().subscribe({
      next: (list) => {
        this.warehouses.set(list);
        this.warehouseOptions.set(list.map((w) => ({ value: w.id, label: `${w.code} — ${w.name}` })));
        const purchaseDef = list.find((w) => w.purchaseDefault);
        const damagedDef = list.find((w) => w.damagedDefault);
        this.purchaseDefaultId.set(purchaseDef?.id ?? null);
        this.damagedDefaultId.set(damagedDef?.id ?? null);
        this.loadingWarehouses.set(false);
      },
      error: () => this.loadingWarehouses.set(false),
    });
  }

  setPurchaseDefault(newId: number | null): void {
    if (newId == null) return;
    this.settingDefault.set(true);
    this.warehouseService.markPurchaseDefault(newId).subscribe({
      next: () => {
        this.toast.success('Entrepôt d\'achat par défaut mis à jour.');
        this.purchaseDefaultId.set(newId);
        this.loadWarehouses();
        this.settingDefault.set(false);
      },
      error: (e) => {
        this.settingDefault.set(false);
        this.toast.error(e instanceof ApiError ? e.message : 'Impossible de définir l\'entrepôt par défaut.');
      },
    });
  }

  setDamagedDefault(newId: number | null): void {
    if (newId == null) return;
    this.settingDefault.set(true);
    this.warehouseService.markDamagedDefault(newId).subscribe({
      next: () => {
        this.toast.success('Entrepôt d\'avariés par défaut mis à jour.');
        this.damagedDefaultId.set(newId);
        this.loadWarehouses();
        this.settingDefault.set(false);
      },
      error: (e) => {
        this.settingDefault.set(false);
        this.toast.error(e instanceof ApiError ? e.message : 'Impossible de définir l\'entrepôt d\'avariés.');
      },
    });
  }

  downloadStockTemplate(): void {
    const type = this.selectedImportType();
    window.open(`/api/stock/import/${type}/template`, '_blank');
  }

  onStockImportSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const type = this.selectedImportType();
    this.importingStock.set(true);
    this.api.upload(`/api/stock/import/${type}`, file).subscribe({
      next: () => {
        this.importingStock.set(false);
        this.toast.success(`Import ${type} réussi.`);
        if (type === 'warehouses') this.loadWarehouses();
      },
      error: (e) => {
        this.importingStock.set(false);
        this.toast.error(e instanceof ApiError ? e.message : 'Import échoué.');
      },
    });
    (event.target as HTMLInputElement).value = '';
  }

  onChartImportSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.importingChart.set(true);
    this.accountingService.chartImport(file).subscribe({
      next: () => {
        this.importingChart.set(false);
        this.toast.success('Plan comptable importé avec succès.');
      },
      error: (e) => {
        this.importingChart.set(false);
        this.toast.error(e instanceof ApiError ? e.message : 'Import du plan comptable échoué.');
      },
    });
    (event.target as HTMLInputElement).value = '';
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