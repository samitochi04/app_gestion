import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { PageHeader } from '../../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../../shared/ui/card/card';
import { Button } from '../../../../../../shared/ui/button/button';
import { Select, SelectOption } from '../../../../../../shared/ui/select/select';
import { FormField } from '../../../../../../shared/ui/form-field/form-field';
import { DataTable, DataTableColumn } from '../../../../../../shared/ui/data-table/data-table';
import { DialogService } from '../../../../../../core/services/dialog.service';
import { InvoiceService } from '../../../factures/data/invoice.service';
import { Invoice, InvoicePayment } from '../../../factures/data/invoice.model';
import { FacturePaymentForm } from '../../../factures/ui/facture-payment-form/facture-payment-form';
import { formatMoney } from '../../../../../../core/utils/format';

interface PaymentRow extends InvoicePayment {
  invoiceReference?: string;
  customerName?: string;
}

/**
 * Payments page. Loads ALL payments from all invoices on init so the user
 * sees the full history immediately. An optional invoice filter narrows the
 * list. A new payment can be recorded once a specific invoice is selected.
 */
@Component({
  selector: 'app-paiements',
  standalone: true,
  imports: [PageHeader, Card, Button, Select, FormField, DataTable, FormsModule],
  templateUrl: './paiements.html',
  styleUrl: './paiements.css',
})
export class Paiements implements OnInit {
  private readonly invoiceService = inject(InvoiceService);
  private readonly dialog = inject(DialogService);

  invoiceOptions = signal<SelectOption[]>([]);
  invoicesById = new Map<number, Invoice>();
  selectedInvoiceId = signal<number | null>(null);

  /** All payments across all invoices, loaded on init. */
  allPayments = signal<PaymentRow[]>([]);
  /** Displayed subset (filtered or all). */
  payments = signal<PaymentRow[]>([]);
  loading = signal(true);

  columns: DataTableColumn<PaymentRow>[] = [
    { key: 'paidAt', header: 'Date', cell: (r) => new Date(r.paidAt).toLocaleDateString('fr-FR') },
    { key: 'invoiceReference', header: 'Facture', cell: (r) => r.invoiceReference ?? '—' },
    { key: 'customerName', header: 'Client', cell: (r) => r.customerName ?? '—' },
    { key: 'method', header: 'Mode' },
    { key: 'reference', header: 'Référence' },
    { key: 'amount', header: 'Montant', align: 'right', cell: (r) => formatMoney(r.amount) },
  ];

  ngOnInit(): void {
    this.loadAll();
  }

  /**
   * Fetch all invoices, then fetch payments for each invoice that has
   * VALIDATED / PARTIALLY_PAID / PAID / OVERDUE status (i.e. could have payments).
   */
  private loadAll(): void {
    this.loading.set(true);
    this.invoiceService.list({ page: 0, size: 500 }).pipe(
      switchMap((res) => {
        const invoices = res.content;
        this.invoiceOptions.set(invoices.map((i) => ({ value: i.id, label: `${i.reference} — ${i.customerName}` })));
        invoices.forEach((i) => this.invoicesById.set(i.id, i));

        // Only fetch payments for invoices that can have payments
        const withPayments = invoices.filter((i) =>
          ['VALIDATED', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'REVERSED', 'CREDITED'].includes(i.status),
        );
        if (withPayments.length === 0) return of([]);
        return forkJoin(
          withPayments.map((inv) =>
            this.invoiceService.payments(inv.id).pipe(
              catchError(() => of([] as InvoicePayment[])),
            ),
          ),
        ).pipe(
          switchMap((results) => {
            const allRows: PaymentRow[] = [];
            results.forEach((payments, idx) => {
              const inv = withPayments[idx];
              payments.forEach((p) => {
                allRows.push({
                  ...p,
                  invoiceReference: inv.reference,
                  customerName: inv.customerName,
                });
              });
            });
            // Sort by date descending
            allRows.sort((a, b) => (b.paidAt ?? '').localeCompare(a.paidAt ?? ''));
            return of(allRows);
          }),
        );
      }),
    ).subscribe({
      next: (rows) => {
        this.allPayments.set(rows);
        this.payments.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSelectInvoice(id: number | null): void {
    this.selectedInvoiceId.set(id);
    if (id == null) {
      // Show all payments when no filter
      this.payments.set(this.allPayments());
      return;
    }
    // Filter by selected invoice
    this.payments.set(this.allPayments().filter((p) => p.invoiceId === id));
  }

  recordPayment(): void {
    const id = this.selectedInvoiceId();
    const invoice = id != null ? this.invoicesById.get(id) : undefined;
    if (!invoice) return;
    const ref = this.dialog.open(FacturePaymentForm, { title: 'Enregistrer un paiement', data: { invoice } });
    ref.closed$.subscribe(() => this.loadAll());
  }
}