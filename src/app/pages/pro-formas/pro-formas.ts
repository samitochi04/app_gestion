import { Component, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Customer, Product } from '../../models/business.model';
import {
  BillingLine,
  CreateProFormaRequest,
  ProForma,
  UpdateProFormaRequest
} from '../../models/commercial.model';
import { AuthService } from '../../services/auth.service';
import { CustomerService } from '../../services/customer.service';
import { ProFormaService } from '../../services/pro-forma.service';
import { ProductService } from '../../services/product.service';
import { getApiErrorMessage } from '../../utils/http.util';

@Component({
  selector: 'app-pro-formas',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './pro-formas.html',
  styleUrl: './pro-formas.css'
})
export class ProFormasComponent implements OnInit {
  protected readonly proFormas = signal<ProForma[]>([]);
  protected readonly customers = signal<Customer[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(false);
  protected readonly page = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalElements = signal(0);
  protected readonly showForm = signal(false);
  protected readonly showSendModal = signal(false);
  protected readonly showConvertModal = signal(false);
  protected readonly editingProForma = signal<ProForma | null>(null);
  protected readonly selectedProForma = signal<ProForma | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly canCreateProForma = signal(true);
  protected readonly canEditProForma = signal(true);
  protected readonly canSendProForma = signal(true);
  protected readonly canConvertProForma = signal(true);

  readonly filterForm: FormGroup;
  readonly proFormaForm: FormGroup;
  readonly sendForm: FormGroup;
  readonly convertForm: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    protected readonly authService: AuthService,
    private readonly proFormaService: ProFormaService,
    private readonly customerService: CustomerService,
    private readonly productService: ProductService
  ) {
    this.filterForm = this.fb.group({
      customerId: ['']
    });

    this.proFormaForm = this.fb.group({
      customerId: ['', Validators.required],
      customerName: ['', Validators.required],
      validUntil: ['', Validators.required],
      notes: [''],
      lines: this.fb.array([])
    });

    this.sendForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.convertForm = this.fb.group({
      dueDate: ['']
    });

    this.canCreateProForma.set(this.authService.hasRole('ADMIN') || this.authService.hasAnyPermission(['QUOTE_CREATE', 'INVOICE_CREATE']));
    this.canEditProForma.set(this.authService.hasRole('ADMIN') || this.authService.hasAnyPermission(['QUOTE_UPDATE', 'QUOTE_CREATE', 'INVOICE_UPDATE']));
    this.canSendProForma.set(this.authService.hasRole('ADMIN') || this.authService.hasAnyPermission(['QUOTE_VALIDATE', 'INVOICE_SEND']));
    this.canConvertProForma.set(this.authService.hasRole('ADMIN') || this.authService.hasAnyPermission(['INVOICE_CREATE', 'QUOTE_VALIDATE']));
  }

  get lines(): FormArray {
    return this.proFormaForm.get('lines') as FormArray;
  }

  ngOnInit(): void {
    this.loadLookups();
    this.loadProFormas();
  }

  loadLookups(): void {
    this.customerService.getCustomers({ page: 0, size: 100 }).subscribe({
      next: (response) => this.customers.set(response.content),
      error: (error) => this.errorMessage.set(getApiErrorMessage(error, 'Erreur chargement clients'))
    });

    this.productService.getProducts({ page: 0, size: 100, active: true }).subscribe({
      next: (response) => this.products.set(response.content),
      error: (error) => this.errorMessage.set(getApiErrorMessage(error, 'Erreur chargement produits'))
    });
  }

  loadProFormas(page = this.page()): void {
    this.loading.set(true);
    this.page.set(page);

    const raw = this.filterForm.getRawValue();
    this.proFormaService
      .getProFormas({ page, size: 10, customerId: raw.customerId ? Number(raw.customerId) : null })
      .subscribe({
        next: (response) => {
          this.proFormas.set(response.content);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
          this.loading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors du chargement des pro-formas'));
          this.loading.set(false);
        }
      });
  }

  applyFilters(): void {
    this.loadProFormas(0);
  }

  clearFilters(): void {
    this.filterForm.reset({ customerId: '' });
    this.loadProFormas(0);
  }

  openCreateForm(): void {
    this.editingProForma.set(null);
    this.proFormaForm.reset({ customerId: '', customerName: '', validUntil: '', notes: '' });
    this.lines.clear();
    this.addLine();
    this.proFormaForm.get('customerId')?.enable();
    this.proFormaForm.get('customerName')?.enable();
    this.showForm.set(true);
    this.clearMessages();
  }

  openEditForm(proForma: ProForma): void {
    this.editingProForma.set(proForma);
    this.proFormaForm.reset({
      customerId: proForma.customerId,
      customerName: proForma.customerName,
      validUntil: proForma.validUntil,
      notes: proForma.notes
    });
    this.lines.clear();
    proForma.lines.forEach((line) => this.lines.push(this.createLineGroup(line)));
    this.proFormaForm.get('customerId')?.disable();
    this.proFormaForm.get('customerName')?.disable();
    this.showForm.set(true);
    this.clearMessages();
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingProForma.set(null);
    this.lines.clear();
    this.proFormaForm.get('customerId')?.enable();
    this.proFormaForm.get('customerName')?.enable();
  }

  addLine(): void {
    this.lines.push(this.createLineGroup());
  }

  removeLine(index: number): void {
    if (this.lines.length === 1) {
      return;
    }

    this.lines.removeAt(index);
  }

  onCustomerChange(): void {
    const customerId = Number(this.proFormaForm.get('customerId')?.value);
    const customer = this.customers().find((item) => item.id === customerId);
    if (customer) {
      this.proFormaForm.patchValue({ customerName: customer.name });
    }
  }

  onSubmit(): void {
    if (this.proFormaForm.invalid || this.lines.length === 0) {
      this.proFormaForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    const raw = this.proFormaForm.getRawValue();
    const lines = this.mapBillingLines(raw.lines);
    const request$ = this.editingProForma()
      ? this.proFormaService.updateProForma(this.editingProForma()!.id, {
          validUntil: raw.validUntil,
          notes: raw.notes,
          lines
        } as UpdateProFormaRequest)
      : this.proFormaService.createProForma({
          customerId: Number(raw.customerId),
          customerName: raw.customerName,
          validUntil: raw.validUntil,
          notes: raw.notes,
          lines
        } as CreateProFormaRequest);

    request$.subscribe({
      next: () => {
        this.successMessage.set(this.editingProForma() ? 'Pro-forma modifiée avec succès' : 'Pro-forma créée avec succès');
        this.loading.set(false);
        this.cancelForm();
        this.loadProFormas(this.page());
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de l\'enregistrement de la pro-forma'));
        this.loading.set(false);
      }
    });
  }

  sendByEmail(proForma: ProForma): void {
    this.selectedProForma.set(proForma);
    this.sendForm.reset({ email: '' });
    this.showSendModal.set(true);
  }

  closeSendModal(): void {
    this.showSendModal.set(false);
    this.selectedProForma.set(null);
    this.sendForm.reset({ email: '' });
  }

  submitSendByEmail(): void {
    if (this.sendForm.invalid || !this.selectedProForma()) {
      this.sendForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.clearMessages();
    const proForma = this.selectedProForma()!;

    this.proFormaService.sendProForma(proForma.id, this.sendForm.get('email')?.value).subscribe({
      next: () => {
        this.successMessage.set(`Pro-forma ${proForma.reference} envoyée`);
        this.loading.set(false);
        this.closeSendModal();
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de l\'envoi de la pro-forma'));
        this.loading.set(false);
      }
    });
  }

  convertToInvoice(proForma: ProForma): void {
    this.selectedProForma.set(proForma);
    this.convertForm.reset({ dueDate: '' });
    this.showConvertModal.set(true);
  }

  closeConvertModal(): void {
    this.showConvertModal.set(false);
    this.selectedProForma.set(null);
    this.convertForm.reset({ dueDate: '' });
  }

  submitConvertToInvoice(): void {
    const proForma = this.selectedProForma();
    if (!proForma) {
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    this.proFormaService.convertProForma(proForma.id, this.convertForm.get('dueDate')?.value || null).subscribe({
      next: (invoice) => {
        this.successMessage.set(`Pro-forma convertie en facture ${invoice.reference}`);
        this.loading.set(false);
        this.closeConvertModal();
        this.loadProFormas(this.page());
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de la conversion en facture'));
        this.loading.set(false);
      }
    });
  }

  downloadPdf(proForma: ProForma): void {
    this.proFormaService.downloadPdf(proForma.id).subscribe({
      next: (blob) => this.saveFile(blob, `${proForma.reference}.pdf`),
      error: (error) => this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors du téléchargement du PDF'))
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages() || page === this.page()) {
      return;
    }

    this.loadProFormas(page);
  }

  private createLineGroup(line?: Partial<BillingLine>): FormGroup {
    return this.fb.group({
      productId: [line?.productId ?? '', Validators.required],
      quantity: [line?.quantity ?? 1, [Validators.required, Validators.min(0.01)]],
      unitPrice: [line?.unitPrice ?? 0, [Validators.required, Validators.min(0)]],
      discount: [line?.discount ?? 0, [Validators.min(0)]],
      vatRate: [line?.vatRate ?? 0, [Validators.min(0)]]
    });
  }

  private mapBillingLines(lines: Array<Record<string, unknown>>): BillingLine[] {
    return lines.map((line) => {
      const productId = Number(line['productId']);
      const product = this.products().find((item) => item.id === productId);

      return {
        productId,
        productName: product?.name ?? '',
        productSku: product?.sku,
        quantity: Number(line['quantity']),
        unitPrice: Number(line['unitPrice']),
        discount: Number(line['discount'] ?? 0),
        vatRate: Number(line['vatRate'] ?? 0)
      };
    });
  }

  private saveFile(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}