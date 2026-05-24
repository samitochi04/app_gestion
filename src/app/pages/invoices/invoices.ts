import { Component, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Customer, Product } from '../../models/business.model';
import {
  BillingLine,
  CreateInvoiceRequest,
  CreateScheduleRequest,
  Installment,
  Invoice,
  InvoiceDetail,
  InvoiceStatus,
  Payment,
  PaymentMethod,
  RecordInstallmentRequest,
  RecordPaymentRequest,
  Schedule,
  UpdateInvoiceRequest
} from '../../models/commercial.model';
import { AuthService } from '../../services/auth.service';
import { CustomerService } from '../../services/customer.service';
import { InvoiceService } from '../../services/invoice.service';
import { ProductService } from '../../services/product.service';
import { getApiErrorMessage } from '../../utils/http.util';

@Component({
  selector: 'app-invoices',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './invoices.html',
  styleUrl: './invoices.css'
})
export class InvoicesComponent implements OnInit {
  protected readonly invoices = signal<Invoice[]>([]);
  protected readonly customers = signal<Customer[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly selectedInvoiceDetail = signal<InvoiceDetail | null>(null);
  protected readonly schedule = signal<Schedule | null>(null);
  protected readonly loading = signal(false);
  protected readonly detailLoading = signal(false);
  protected readonly page = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalElements = signal(0);
  protected readonly showForm = signal(false);
  protected readonly showSendModal = signal(false);
  protected readonly showCancelModal = signal(false);
  protected readonly editingInvoice = signal<Invoice | null>(null);
  protected readonly selectedInvoice = signal<Invoice | null>(null);
  protected readonly detailMode = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly invoiceStatuses: InvoiceStatus[] = ['DRAFT', 'VALIDATED', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'];
  protected readonly paymentMethods: PaymentMethod[] = ['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CHECK'];
  protected readonly canCreateInvoice = signal(true);
  protected readonly canEditInvoice = signal(true);
  protected readonly canValidateInvoiceAction = signal(true);
  protected readonly canSendInvoiceAction = signal(true);
  protected readonly canCancelInvoiceAction = signal(true);
  protected readonly canRecordPaymentAction = signal(true);
  protected readonly canManageScheduleAction = signal(true);
  protected readonly productStockByProductId = signal<Record<number, number | null>>({});

  readonly filterForm: FormGroup;
  readonly invoiceForm: FormGroup;
  readonly paymentForm: FormGroup;
  readonly scheduleForm: FormGroup;
  readonly installmentPaymentForm: FormGroup;
  readonly sendForm: FormGroup;
  readonly cancelInvoiceForm: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    protected readonly authService: AuthService,
    private readonly invoiceService: InvoiceService,
    private readonly customerService: CustomerService,
    private readonly productService: ProductService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    this.filterForm = this.fb.group({
      status: [''],
      customerId: ['']
    });

    this.invoiceForm = this.fb.group({
      customerId: ['', Validators.required],
      orderId: [''],
      dueDate: ['', Validators.required],
      notes: [''],
      lines: this.fb.array([])
    });

    this.paymentForm = this.fb.group({
      invoiceId: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      method: ['CASH', Validators.required],
      reference: [''],
      notes: ['']
    });

    this.scheduleForm = this.fb.group({
      invoiceId: ['', Validators.required],
      installments: this.fb.array([])
    });

    this.installmentPaymentForm = this.fb.group({
      invoiceId: ['', Validators.required],
      installmentId: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      method: ['CASH', Validators.required],
      reference: ['']
    });

    this.sendForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.cancelInvoiceForm = this.fb.group({
      reason: ['']
    });

    this.canCreateInvoice.set(this.authService.hasRoleOrPermission('ADMIN', ['INVOICE_CREATE']));
    this.canEditInvoice.set(this.authService.hasRoleOrPermission('ADMIN', ['INVOICE_UPDATE']));
    this.canValidateInvoiceAction.set(this.authService.hasRoleOrPermission('ADMIN', ['INVOICE_UPDATE', 'INVOICE_CREATE']));
    this.canSendInvoiceAction.set(this.authService.hasRoleOrPermission('ADMIN', ['INVOICE_SEND']));
    this.canCancelInvoiceAction.set(this.authService.hasRoleOrPermission('ADMIN', ['INVOICE_CANCEL']));
    this.canRecordPaymentAction.set(this.authService.hasRoleOrPermission('ADMIN', ['PAYMENT_RECORD']));
    this.canManageScheduleAction.set(this.authService.hasRoleOrPermission('ADMIN', ['PAYMENT_RECORD']));
  }

  get lines(): FormArray {
    return this.invoiceForm.get('lines') as FormArray;
  }

  get installments(): FormArray {
    return this.scheduleForm.get('installments') as FormArray;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const invoiceId = params.get('id');
      this.detailMode.set(!!invoiceId);

      if (invoiceId) {
        this.loadInvoiceDetail(Number(invoiceId));
      } else {
        this.loadInvoices();
      }
    });

    this.loadLookups();
    this.installments.push(
      this.fb.group({
        dueDate: ['', Validators.required],
        amount: [0, [Validators.required, Validators.min(0.01)]]
      })
    );
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

  loadInvoices(page = this.page()): void {
    this.loading.set(true);
    this.page.set(page);

    const raw = this.filterForm.getRawValue();
    this.invoiceService
      .getInvoices({
        page,
        size: 10,
        status: raw.status || null,
        customerId: raw.customerId ? Number(raw.customerId) : null
      })
      .subscribe({
        next: (response) => {
          this.invoices.set(response.content);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
          this.loading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors du chargement des factures'));
          this.loading.set(false);
        }
      });
  }

  loadInvoiceDetail(invoiceId: number): void {
    this.detailLoading.set(true);
    this.invoiceService.getInvoiceDetail(invoiceId).subscribe({
      next: (detail) => {
        this.selectedInvoiceDetail.set(detail);
        this.paymentForm.patchValue({ invoiceId: detail.invoice.id, amount: 0, reference: '', notes: '' });
        this.scheduleForm.patchValue({ invoiceId: detail.invoice.id });
        this.installmentPaymentForm.patchValue({ invoiceId: detail.invoice.id, installmentId: '', amount: 0, reference: '' });
        this.loadSchedule(detail.invoice.id);
        this.detailLoading.set(false);
        this.selectedInvoice.set(detail.invoice);
        this.productStockByProductId.set({});
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors du chargement du détail facture'));
        this.detailLoading.set(false);
      }
    });
  }

  loadSchedule(invoiceId: number): void {
    this.invoiceService.getSchedule(invoiceId).subscribe({
      next: (schedule) => this.schedule.set(schedule),
      error: () => this.schedule.set(null)
    });
  }

  applyFilters(): void {
    this.loadInvoices(0);
  }

  clearFilters(): void {
    this.filterForm.reset({ status: '', customerId: '' });
    this.loadInvoices(0);
  }

  openCreateForm(): void {
    this.editingInvoice.set(null);
    this.invoiceForm.reset({ customerId: '', orderId: '', dueDate: '', notes: '' });
    this.lines.clear();
    this.addLine();
    this.invoiceForm.get('customerId')?.enable();
    this.showForm.set(true);
    this.clearMessages();
  }

  openDetail(invoiceId: number): void {
    this.router.navigate(['/invoices', invoiceId]);
  }

  backToList(): void {
    this.selectedInvoiceDetail.set(null);
    this.selectedInvoice.set(null);
    this.schedule.set(null);
    this.detailMode.set(false);
    this.router.navigate(['/invoices']);
  }

  openEditForm(invoice: Invoice): void {
    this.editingInvoice.set(invoice);
    this.invoiceForm.reset({
      customerId: invoice.customerId,
      orderId: invoice.orderId ?? '',
      dueDate: invoice.dueDate,
      notes: invoice.notes
    });
    this.lines.clear();
    invoice.lines.forEach((line) => this.lines.push(this.createLineGroup(line)));
    this.invoiceForm.get('customerId')?.disable();
    this.showForm.set(true);
    this.clearMessages();
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingInvoice.set(null);
    this.lines.clear();
    this.invoiceForm.get('customerId')?.enable();
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

  addInstallment(): void {
    this.installments.push(
      this.fb.group({
        dueDate: ['', Validators.required],
        amount: [0, [Validators.required, Validators.min(0.01)]]
      })
    );
  }

  removeInstallment(index: number): void {
    if (this.installments.length === 1) {
      return;
    }

    this.installments.removeAt(index);
  }

  onSubmit(): void {
    if (this.invoiceForm.invalid || this.lines.length === 0) {
      this.invoiceForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    const raw = this.invoiceForm.getRawValue();
    const lines = this.mapBillingLines(raw.lines);
    const request$ = this.editingInvoice()
      ? this.invoiceService.updateInvoice(this.editingInvoice()!.id, {
          dueDate: raw.dueDate,
          notes: raw.notes,
          lines
        } as UpdateInvoiceRequest)
      : this.invoiceService.createInvoice({
          customerId: Number(raw.customerId),
          orderId: raw.orderId ? Number(raw.orderId) : null,
          dueDate: raw.dueDate,
          notes: raw.notes,
          lines
        } as CreateInvoiceRequest);

    request$.subscribe({
      next: () => {
        this.successMessage.set(this.editingInvoice() ? 'Facture modifiée avec succès' : 'Facture créée avec succès');
        this.loading.set(false);
        this.cancelForm();
        this.loadInvoices(this.page());
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de l\'enregistrement de la facture'));
        this.loading.set(false);
      }
    });
  }

  validateInvoice(invoice: Invoice): void {
    this.loading.set(true);
    this.clearMessages();

    this.invoiceService.validateInvoice(invoice.id).subscribe({
      next: () => {
        this.successMessage.set(`Facture ${invoice.reference} validée`);
        this.loading.set(false);
        this.loadInvoices(this.page());
        if (this.selectedInvoiceDetail()?.invoice.id === invoice.id) {
          this.loadInvoiceDetail(invoice.id);
        }
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de la validation'));
        this.loading.set(false);
      }
    });
  }

  getLineStock(lineIndex: number): number | null {
    const productId = Number(this.lines.at(lineIndex)?.get('productId')?.value);

    if (!productId) {
      return null;
    }

    const stock = this.productStockByProductId()[productId];
    return typeof stock === 'number' ? stock : null;
  }

  protected invoiceStatusLabel(status: InvoiceStatus): string {
    const labels: Record<InvoiceStatus, string> = {
      DRAFT: 'Brouillon',
      VALIDATED: 'Validee',
      SENT: 'Envoyee',
      PARTIALLY_PAID: 'Partiellement payee',
      PAID: 'Payee',
      OVERDUE: 'En retard',
      CANCELLED: 'Annulee'
    };

    return labels[status] ?? status;
  }

  protected invoiceStatusClass(status: InvoiceStatus): string {
    const classes: Record<InvoiceStatus, string> = {
      DRAFT: 'tag-status tag-status-draft',
      VALIDATED: 'tag-status tag-status-validated',
      SENT: 'tag-status tag-status-sent',
      PARTIALLY_PAID: 'tag-status tag-status-partially-paid',
      PAID: 'tag-status tag-status-paid',
      OVERDUE: 'tag-status tag-status-overdue',
      CANCELLED: 'tag-status tag-status-cancelled'
    };

    return classes[status] ?? 'tag-status';
  }

  protected paymentMethodLabel(method: PaymentMethod): string {
    const labels: Record<PaymentMethod, string> = {
      CASH: 'Especes',
      BANK_TRANSFER: 'Virement bancaire',
      MOBILE_MONEY: 'Mobile money',
      CHECK: 'Cheque'
    };

    return labels[method] ?? method;
  }

  loadLineStock(lineIndex: number): void {
    const productId = Number(this.lines.at(lineIndex)?.get('productId')?.value);

    if (!productId) {
      return;
    }

    this.productService.getProductStock(productId).subscribe({
      next: (stocks) => {
        const availableQuantity = stocks.reduce((total, stock) => total + stock.availableQuantity, 0);
        this.productStockByProductId.update((current) => ({
          ...current,
          [productId]: availableQuantity
        }));
      },
      error: () => {
        this.productStockByProductId.update((current) => ({
          ...current,
          [productId]: null
        }));
      }
    });
  }

  sendInvoice(invoice: Invoice): void {
    this.selectedInvoice.set(invoice);
    this.sendForm.reset({ email: '' });
    this.showSendModal.set(true);
  }

  closeSendModal(): void {
    this.showSendModal.set(false);
    this.selectedInvoice.set(null);
    this.sendForm.reset({ email: '' });
  }

  submitSendInvoice(): void {
    if (this.sendForm.invalid || !this.selectedInvoice()) {
      this.sendForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.clearMessages();
    const invoice = this.selectedInvoice()!;

    this.invoiceService.sendInvoice(invoice.id, this.sendForm.get('email')?.value).subscribe({
      next: () => {
        this.successMessage.set(`Facture ${invoice.reference} envoyée`);
        this.loading.set(false);
        this.closeSendModal();
        this.loadInvoices(this.page());
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de l\'envoi de la facture'));
        this.loading.set(false);
      }
    });
  }

  cancelInvoice(invoice: Invoice): void {
    this.selectedInvoice.set(invoice);
    this.cancelInvoiceForm.reset({ reason: '' });
    this.showCancelModal.set(true);
  }

  closeCancelModal(): void {
    this.showCancelModal.set(false);
    this.selectedInvoice.set(null);
    this.cancelInvoiceForm.reset({ reason: '' });
  }

  submitCancelInvoice(): void {
    const invoice = this.selectedInvoice();
    if (!invoice) {
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    this.invoiceService
      .cancelInvoice(invoice.id, this.cancelInvoiceForm.get('reason')?.value || null)
      .subscribe({
      next: () => {
        this.successMessage.set(`Facture ${invoice.reference} annulée`);
        this.loading.set(false);
        this.closeCancelModal();
        this.loadInvoices(this.page());
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de l\'annulation'));
        this.loading.set(false);
      }
      });
  }

  downloadPdf(invoice: Invoice): void {
    this.invoiceService.downloadPdf(invoice.id).subscribe({
      next: (blob) => this.saveFile(blob, `${invoice.reference}.pdf`),
      error: (error) => this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors du téléchargement du PDF'))
    });
  }

  recordPayment(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    this.invoiceService.recordPayment(this.paymentForm.getRawValue() as RecordPaymentRequest).subscribe({
      next: (payment) => {
        this.successMessage.set(`Paiement enregistré (${payment.amount})`);
        this.loading.set(false);
        this.loadInvoiceDetail(payment.invoiceId);
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de l\'enregistrement du paiement'));
        this.loading.set(false);
      }
    });
  }

  createSchedule(): void {
    if (this.scheduleForm.invalid || this.installments.length === 0) {
      this.scheduleForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    this.invoiceService.createSchedule(this.scheduleForm.getRawValue() as CreateScheduleRequest).subscribe({
      next: () => {
        this.successMessage.set('Échéancier créé avec succès');
        this.loading.set(false);
        this.loadSchedule(Number(this.scheduleForm.get('invoiceId')?.value));
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors de la création de l\'échéancier'));
        this.loading.set(false);
      }
    });
  }

  recordInstallment(): void {
    if (this.installmentPaymentForm.invalid) {
      this.installmentPaymentForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    this.invoiceService
      .recordInstallment(this.installmentPaymentForm.getRawValue() as RecordInstallmentRequest)
      .subscribe({
        next: (schedule) => {
          this.successMessage.set('Paiement d\'échéance enregistré');
          this.schedule.set(schedule);
          this.loading.set(false);
          this.loadInvoiceDetail(Number(this.installmentPaymentForm.get('invoiceId')?.value));
        },
        error: (error) => {
          this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors du paiement d\'échéance'));
          this.loading.set(false);
        }
      });
  }

  closeDetail(): void {
    this.selectedInvoiceDetail.set(null);
    this.schedule.set(null);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages() || page === this.page()) {
      return;
    }

    this.loadInvoices(page);
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