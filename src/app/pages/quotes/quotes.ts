import { Component, OnInit, computed, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Customer, Product } from '../../models/business.model';
import {
  ConvertQuoteRequest,
  CreateQuoteRequest,
  Quote,
  QuoteLine,
  QuoteStatus,
  UpdateQuoteRequest
} from '../../models/commercial.model';
import { AuthService } from '../../services/auth.service';
import { CustomerService } from '../../services/customer.service';
import { ProductService } from '../../services/product.service';
import { QuoteService } from '../../services/quote.service';
import { getApiErrorMessage } from '../../utils/http.util';

@Component({
  selector: 'app-quotes',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './quotes.html',
  styleUrl: './quotes.css'
})
export class QuotesComponent implements OnInit {
  protected readonly quotes = signal<Quote[]>([]);
  protected readonly customers = signal<Customer[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(false);
  protected readonly page = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalElements = signal(0);
  protected readonly showForm = signal(false);
  protected readonly showConvertModal = signal(false);
  protected readonly editingQuote = signal<Quote | null>(null);
  protected readonly selectedQuoteForConversion = signal<Quote | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly quoteStatuses: QuoteStatus[] = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'];
  protected readonly canCreateQuote = computed(() =>
    this.authService.hasRoleOrPermission('ADMIN', ['QUOTE_CREATE'])
  );
  protected readonly canEditQuote = computed(() =>
    this.authService.hasRoleOrPermission('ADMIN', ['QUOTE_UPDATE', 'QUOTE_CREATE'])
  );
  protected readonly canSendOrConvertQuote = computed(() =>
    this.authService.hasRoleOrPermission('ADMIN', ['QUOTE_VALIDATE', 'QUOTE_UPDATE'])
  );
  protected readonly summary = computed(() => {
    const items = this.quotes();
    return {
      total: this.totalElements(),
      sent: items.filter((quote) => quote.status === 'SENT').length,
      accepted: items.filter((quote) => quote.status === 'ACCEPTED').length
    };
  });

  readonly filterForm: FormGroup;
  readonly quoteForm: FormGroup;
  readonly convertForm: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    protected readonly authService: AuthService,
    private readonly quoteService: QuoteService,
    private readonly customerService: CustomerService,
    private readonly productService: ProductService
  ) {
    this.filterForm = this.fb.group({
      status: [''],
      customerId: ['']
    });

    this.quoteForm = this.fb.group({
      customerId: ['', Validators.required],
      validUntil: ['', Validators.required],
      notes: [''],
      lines: this.fb.array([])
    });

    this.convertForm = this.fb.group({
      street: ['', Validators.required],
      city: ['', Validators.required],
      postalCode: [''],
      country: ['', Validators.required]
    });
  }

  get lines(): FormArray {
    return this.quoteForm.get('lines') as FormArray;
  }

  ngOnInit(): void {
    this.loadLookups();
    this.loadQuotes();
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

  loadQuotes(page = this.page()): void {
    this.loading.set(true);
    this.page.set(page);

    const raw = this.filterForm.getRawValue();
    this.quoteService
      .getQuotes({
        page,
        size: 10,
        status: raw.status || null,
        customerId: raw.customerId ? Number(raw.customerId) : null
      })
      .subscribe({
        next: (response) => {
          this.quotes.set(response.content);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
          this.loading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors du chargement des devis'));
          this.loading.set(false);
        }
      });
  }

  applyFilters(): void {
    this.loadQuotes(0);
  }

  clearFilters(): void {
    this.filterForm.reset({ status: '', customerId: '' });
    this.loadQuotes(0);
  }

  openCreateForm(): void {
    this.editingQuote.set(null);
    this.quoteForm.reset({ customerId: '', validUntil: '', notes: '' });
    this.lines.clear();
    this.addLine();
    this.quoteForm.get('customerId')?.enable();
    this.showForm.set(true);
    this.clearMessages();
  }

  openEditForm(quote: Quote): void {
    this.editingQuote.set(quote);
    this.quoteForm.reset({
      customerId: quote.customerId,
      validUntil: quote.validUntil,
      notes: quote.notes
    });
    this.lines.clear();
    quote.lines.forEach((line) => this.lines.push(this.createLineGroup(line)));
    this.quoteForm.get('customerId')?.disable();
    this.showForm.set(true);
    this.clearMessages();
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingQuote.set(null);
    this.lines.clear();
    this.quoteForm.get('customerId')?.enable();
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

  onSubmit(): void {
    if (this.quoteForm.invalid || this.lines.length === 0) {
      this.quoteForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    const raw = this.quoteForm.getRawValue();
    const lines = this.mapQuoteLines(raw.lines);
    const request$ = this.editingQuote()
      ? this.quoteService.updateQuote(this.editingQuote()!.id, {
          validUntil: raw.validUntil,
          notes: raw.notes,
          lines
        } as UpdateQuoteRequest)
      : this.quoteService.createQuote({
          customerId: Number(raw.customerId),
          validUntil: raw.validUntil,
          notes: raw.notes,
          lines
        } as CreateQuoteRequest);

    request$.subscribe({
      next: () => {
        this.successMessage.set(this.editingQuote() ? 'Devis modifié avec succès' : 'Devis créé avec succès');
        this.loading.set(false);
        this.cancelForm();
        this.loadQuotes(this.page());
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de l\'enregistrement du devis'));
        this.loading.set(false);
      }
    });
  }

  sendQuote(quote: Quote): void {
    this.loading.set(true);
    this.clearMessages();

    this.quoteService.sendQuote(quote.id).subscribe({
      next: () => {
        this.successMessage.set(`Devis ${quote.reference} envoyé`);
        this.loading.set(false);
        this.loadQuotes(this.page());
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de l\'envoi du devis'));
        this.loading.set(false);
      }
    });
  }

  convertQuote(quote: Quote): void {
    this.selectedQuoteForConversion.set(quote);
    this.convertForm.reset({ street: '', city: '', postalCode: '', country: '' });
    this.showConvertModal.set(true);
  }

  closeConvertModal(): void {
    this.showConvertModal.set(false);
    this.selectedQuoteForConversion.set(null);
    this.convertForm.reset({ street: '', city: '', postalCode: '', country: '' });
  }

  submitConversion(): void {
    if (this.convertForm.invalid || !this.selectedQuoteForConversion()) {
      this.convertForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.clearMessages();
    const quote = this.selectedQuoteForConversion()!;

    this.quoteService
      .convertQuote(quote.id, this.convertForm.getRawValue() as ConvertQuoteRequest)
      .subscribe({
        next: (order) => {
          this.successMessage.set(`Devis converti en commande ${order.reference}`);
          this.loading.set(false);
          this.closeConvertModal();
          this.loadQuotes(this.page());
        },
        error: (error) => {
          this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de la conversion du devis'));
          this.loading.set(false);
        }
      });
  }

  getCustomerName(customerId: number): string {
    return this.customers().find((customer) => customer.id === customerId)?.name ?? `Client #${customerId}`;
  }

  getProductName(productId: number): string {
    return this.products().find((product) => product.id === productId)?.name ?? `Produit #${productId}`;
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages() || page === this.page()) {
      return;
    }

    this.loadQuotes(page);
  }

  private createLineGroup(line?: Partial<QuoteLine>): FormGroup {
    return this.fb.group({
      productId: [line?.productId ?? '', Validators.required],
      productName: [line?.productName ?? ''],
      quantity: [line?.quantity ?? 1, [Validators.required, Validators.min(0.01)]],
      unitSalePrice: [line?.unitSalePrice ?? 0, [Validators.required, Validators.min(0)]],
      discount: [line?.discount ?? 0, [Validators.min(0)]],
      vatRate: [line?.vatRate ?? 0, [Validators.min(0)]]
    });
  }

  private mapQuoteLines(lines: Array<Record<string, unknown>>): QuoteLine[] {
    return lines.map((line) => ({
      productId: Number(line['productId']),
      productName: this.getProductName(Number(line['productId'])),
      quantity: Number(line['quantity']),
      unitSalePrice: Number(line['unitSalePrice']),
      discount: Number(line['discount'] ?? 0),
      vatRate: Number(line['vatRate'] ?? 0)
    }));
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}