import { Component, OnInit, computed, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { Invoice, InvoiceStatus, Payment } from '../../models/commercial.model';
import { AuthService } from '../../services/auth.service';
import { InvoiceService } from '../../services/invoice.service';
import { getApiErrorMessage } from '../../utils/http.util';

interface TreasuryFilters {
  startDate: string;
  endDate: string;
  status: InvoiceStatus | '';
}

@Component({
  selector: 'app-payments',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './payments.html',
  styleUrl: './payments.css'
})
export class PaymentsComponent implements OnInit {
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly invoices = signal<Invoice[]>([]);
  protected readonly payments = signal<Payment[]>([]);
  protected readonly invoiceStatuses: InvoiceStatus[] = [
    'DRAFT',
    'VALIDATED',
    'SENT',
    'PARTIALLY_PAID',
    'PAID',
    'OVERDUE',
    'CANCELLED'
  ];
  protected readonly filters = signal<TreasuryFilters>(this.defaultFilters());

  readonly filterForm: FormGroup;

  protected readonly filteredInvoices = computed(() => {
    const current = this.filters();

    return this.invoices().filter((invoice) => {
      if (current.status && invoice.status !== current.status) {
        return false;
      }

      return this.inDateRange(invoice.issueDate ?? invoice.createdAt, current);
    });
  });

  protected readonly filteredPayments = computed(() => {
    const invoiceIds = new Set(this.filteredInvoices().map((invoice) => invoice.id));
    const current = this.filters();

    return this.payments()
      .filter((payment) => invoiceIds.has(payment.invoiceId) && this.inDateRange(payment.paidAt, current))
      .slice()
      .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
  });

  protected readonly totalReceivables = computed(() =>
    this.filteredInvoices().reduce((sum, invoice) => sum + Math.max(0, invoice.remainingAmount ?? 0), 0)
  );

  protected readonly totalCollected = computed(() =>
    this.filteredPayments().reduce((sum, payment) => sum + (payment.amount ?? 0), 0)
  );

  protected readonly overdueCount = computed(
    () => this.filteredInvoices().filter((invoice) => invoice.status === 'OVERDUE').length
  );

  protected readonly averagePaymentAmount = computed(() => {
    const currentPayments = this.filteredPayments();
    if (currentPayments.length === 0) {
      return 0;
    }

    return this.totalCollected() / currentPayments.length;
  });

  protected readonly atRiskInvoices = computed(() =>
    this.filteredInvoices()
      .filter((invoice) => ['OVERDUE', 'PARTIALLY_PAID', 'SENT'].includes(invoice.status))
      .slice()
      .sort((a, b) => (b.remainingAmount ?? 0) - (a.remainingAmount ?? 0))
      .slice(0, 12)
  );

  constructor(
    private readonly formBuilder: FormBuilder,
    protected readonly authService: AuthService,
    private readonly invoiceService: InvoiceService
  ) {
    this.filterForm = this.formBuilder.group({
      startDate: [''],
      endDate: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.loadTreasuryData();
  }

  protected applyFilters(): void {
    this.filters.set(this.normalizeFilters(this.filterForm.getRawValue()));
  }

  protected resetFilters(): void {
    const defaults = this.defaultFilters();
    this.filterForm.reset(defaults);
    this.filters.set(defaults);
  }

  private loadTreasuryData(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.invoiceService
      .getInvoices({ page: 0, size: 200, status: null, customerId: null })
      .pipe(
        switchMap((invoicePage) => {
          const invoices = invoicePage.content;
          const recentInvoiceIds = invoices
            .slice()
            .sort((a, b) => new Date(b.issueDate ?? b.createdAt).getTime() - new Date(a.issueDate ?? a.createdAt).getTime())
            .slice(0, 60)
            .map((invoice) => invoice.id);

          if (recentInvoiceIds.length === 0) {
            return of({ invoices, payments: [] as Payment[] });
          }

          return forkJoin(
            recentInvoiceIds.map((invoiceId) =>
              this.invoiceService.getPayments(invoiceId).pipe(catchError(() => of([] as Payment[])))
            )
          ).pipe(
            map((paymentsPerInvoice) => ({
              invoices,
              payments: paymentsPerInvoice.flat()
            }))
          );
        })
      )
      .subscribe({
        next: ({ invoices, payments }) => {
          this.invoices.set(invoices);
          this.payments.set(payments);
          this.loading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getApiErrorMessage(error, 'Erreur lors du chargement de la tresorerie'));
          this.loading.set(false);
        }
      });
  }

  private defaultFilters(): TreasuryFilters {
    return {
      startDate: '',
      endDate: '',
      status: ''
    };
  }

  private normalizeFilters(rawValue: Record<string, unknown>): TreasuryFilters {
    return {
      startDate: typeof rawValue['startDate'] === 'string' ? rawValue['startDate'] : '',
      endDate: typeof rawValue['endDate'] === 'string' ? rawValue['endDate'] : '',
      status: this.isInvoiceStatus(rawValue['status']) ? rawValue['status'] : ''
    };
  }

  private isInvoiceStatus(value: unknown): value is InvoiceStatus {
    return this.invoiceStatuses.includes(value as InvoiceStatus);
  }

  private inDateRange(dateValue: string | null | undefined, filters: TreasuryFilters): boolean {
    if (!dateValue) {
      return true;
    }

    const current = new Date(dateValue);
    if (Number.isNaN(current.getTime())) {
      return true;
    }

    const start = filters.startDate ? new Date(filters.startDate) : null;
    const end = filters.endDate ? new Date(filters.endDate) : null;

    if (start) {
      start.setHours(0, 0, 0, 0);
    }

    if (end) {
      end.setHours(23, 59, 59, 999);
    }

    return (!start || current >= start) && (!end || current <= end);
  }

  protected invoiceReference(invoiceId: number): string {
    return this.invoices().find((invoice) => invoice.id === invoiceId)?.reference ?? `#${invoiceId}`;
  }
}
