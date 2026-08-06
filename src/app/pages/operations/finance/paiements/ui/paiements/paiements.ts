import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeader } from '../../../../../../shared/ui/page-header/page-header';
import { Card } from '../../../../../../shared/ui/card/card';
import { Button } from '../../../../../../shared/ui/button/button';
import { Select, SelectOption } from '../../../../../../shared/ui/select/select';
import { FormField } from '../../../../../../shared/ui/form-field/form-field';
import { DataTable, DataTableColumn } from '../../../../../../shared/ui/data-table/data-table';
import { EmptyState } from '../../../../../../shared/ui/empty-state/empty-state';
import { DialogService } from '../../../../../../core/services/dialog.service';
import { InvoiceService } from '../../../factures/data/invoice.service';
import { Invoice, InvoicePayment } from '../../../factures/data/invoice.model';
import { FacturePaymentForm } from '../../../factures/ui/facture-payment-form/facture-payment-form';
import { formatMoney } from '../../../../../../core/utils/format';

/**
 * The backend has no aggregate "list all payments" endpoint — only
 * GET /api/invoices/{id}/payments per invoice. So this page: pick an
 * invoice, see its payments, and record a new one.
 */
@Component({
  selector: 'app-paiements',
  standalone: true,
  imports: [PageHeader, Card, Button, Select, FormField, DataTable, EmptyState, FormsModule],
  templateUrl: './paiements.html',
  styleUrl: './paiements.css',
})
export class Paiements implements OnInit {
  private readonly invoiceService = inject(InvoiceService);
  private readonly dialog = inject(DialogService);

  invoiceOptions = signal<SelectOption[]>([]);
  invoicesById = new Map<number, Invoice>();
  selectedInvoiceId = signal<number | null>(null);
  payments = signal<InvoicePayment[]>([]);
  loading = signal(false);

  columns: DataTableColumn<InvoicePayment>[] = [
    { key: 'paidAt', header: 'Date', cell: (r) => new Date(r.paidAt).toLocaleDateString('fr-FR') },
    { key: 'method', header: 'Mode' },
    { key: 'reference', header: 'Référence' },
    { key: 'amount', header: 'Montant', align: 'right', cell: (r) => formatMoney(r.amount) },
  ];

  ngOnInit(): void {
    this.invoiceService.list({ page: 0, size: 200 }).subscribe((res) => {
      this.invoiceOptions.set(res.content.map((i) => ({ value: i.id, label: `${i.reference} — ${i.customerName}` })));
      res.content.forEach((i) => this.invoicesById.set(i.id, i));
    });
  }

  onSelectInvoice(id: number | null): void {
    this.selectedInvoiceId.set(id);
    if (id == null) { this.payments.set([]); return; }
    this.loading.set(true);
    this.invoiceService.payments(id).subscribe({
      next: (list) => { this.payments.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  recordPayment(): void {
    const id = this.selectedInvoiceId();
    const invoice = id != null ? this.invoicesById.get(id) : undefined;
    if (!invoice) return;
    const ref = this.dialog.open(FacturePaymentForm, { title: 'Enregistrer un paiement', data: { invoice } });
    ref.closed$.subscribe(() => this.onSelectInvoice(id));
  }
}
