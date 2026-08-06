import { SelectOption } from '../../../../../shared/ui/select/select';

/** Backend `PaymentMethod` enum — the only four values the API accepts. */
export const PAYMENT_METHODS: SelectOption[] = [
  { value: 'CASH', label: 'Espèces' },
  { value: 'BANK_TRANSFER', label: 'Virement bancaire' },
  { value: 'CHECK', label: 'Chèque' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
];

export interface InvoiceLine {
  id?: number;
  productId: number;
  productName?: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  vatRate?: number;
  amountHT?: number;
  vatAmount?: number;
  amountTTC?: number;
}

export interface Invoice {
  id: number;
  reference: string;
  orderId?: number;
  customerId: number;
  customerName: string;
  customerTaxId: string;
  status: string;
  issueDate: string;
  dueDate: string;
  lines: InvoiceLine[];
  totalAmountHT: number;
  totalVatAmount: number;
  totalAmountTTC: number;
  paidAmount: number;
  remainingAmount: number;
  notes: string;
  createdAt: string;
  validatedAt?: string;
  sentAt?: string;
  reversedAt?: string;
}

/**
 * There is deliberately no `CreateInvoiceRequest`: the backend exposes no
 * `POST /api/invoices`. A sales invoice is born from a shipped order
 * (`OrderShippedEvent`) or from a converted pro forma — see
 * `pro-formas/data/pro-forma.service.ts`. Only a DRAFT may be updated, and
 * only its due date, notes and lines.
 */
export interface UpdateInvoiceRequest {
  dueDate?: string;
  notes?: string;
  lines?: InvoiceLine[];
}

export interface InvoicePayment {
  id: number;
  invoiceId: number;
  amount: number;
  method: string;
  /** `RECEIPT` or `REFUND` — the sign is never carried by `amount`. */
  type?: string;
  reference: string;
  notes: string;
  paidAt: string;
}

export interface RecordPaymentRequest {
  invoiceId: number;
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
}

/** A refund points at the payment it reverses; `amount` stays positive. */
export interface RefundPaymentRequest {
  paymentId: number;
  amount: number;
  method: string;
  reason: string;
  reference?: string;
}

export interface Installment {
  id: number;
  dueDate: string;
  amount: number;
  paidAmount?: number;
  status: string;
}

export interface PaymentSchedule {
  id: number;
  invoiceId: number;
  status: string;
  installments: Installment[];
}

export interface CreateScheduleRequest {
  invoiceId: number;
  installments: { dueDate: string; amount: number }[];
}

export interface RecordInstallmentRequest {
  invoiceId: number;
  installmentId: number;
  amount: number;
  method: string;
  reference?: string;
}
