import { PageResponse } from './user.model';

export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type InvoiceStatus =
  | 'DRAFT'
  | 'VALIDATED'
  | 'SENT'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';
export type CreditNoteType = 'PARTIAL' | 'FULL';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CHECK';
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'ACTIVATE'
  | 'DEACTIVATE'
  | 'STATUS_CHANGE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'ROLE_ASSIGNED'
  | 'ROLE_REMOVED'
  | 'STOCK_MOVEMENT'
  | 'RESERVATION_CREATED'
  | 'RESERVATION_RELEASED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'INVOICE_VALIDATED'
  | 'INVOICE_SENT'
  | 'PAYMENT_RECORDED';

export interface QuoteLine {
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  unitSalePrice: number;
  discount: number;
  vatRate: number;
  amountHT?: number;
  vatAmount?: number;
  amountTTC?: number;
}

export interface BillingLine {
  id?: number;
  productId: number;
  productName: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  vatRate: number;
  amountHT?: number;
  vatAmount?: number;
  amountTTC?: number;
}

export interface OrderLine {
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  unitSalePrice: number;
  discount: number;
  vatRate: number;
  warehouseId: number;
  amountHT?: number;
  vatAmount?: number;
  amountTTC?: number;
}

export interface Quote {
  id: number;
  reference: string;
  customerId: number;
  status: QuoteStatus;
  validUntil: string;
  notes: string;
  lines: QuoteLine[];
  totalAmountHT: number;
  totalVatAmount: number;
  totalAmountTTC: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  reference: string;
  customerId: number;
  quoteId: number | null;
  status: OrderStatus;
  notes: string;
  shippingStreet: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  lines: OrderLine[];
  totalAmountHT: number;
  totalVatAmount: number;
  totalAmountTTC: number;
  createdAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
}

export interface ProForma {
  id: number;
  reference: string;
  customerId: number;
  customerName: string;
  status: string;
  validUntil: string;
  convertedToInvoiceId: number | null;
  lines: BillingLine[];
  totalAmountHT: number;
  totalAmountTTC: number;
  notes: string;
  createdAt: string;
}

export interface Invoice {
  id: number;
  reference: string;
  orderId: number | null;
  customerId: number;
  customerName: string;
  customerTaxId: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  lines: BillingLine[];
  totalAmountHT: number;
  totalVatAmount: number;
  totalAmountTTC: number;
  paidAmount: number;
  remainingAmount: number;
  notes: string;
  createdAt: string;
  validatedAt: string | null;
  sentAt: string | null;
}

export interface Payment {
  id: number;
  invoiceId: number;
  amount: number;
  method: PaymentMethod;
  reference: string;
  notes: string;
  paidAt: string;
}

export interface Installment {
  dueDate: string;
  amount: number;
}

export interface Schedule {
  id: number;
  invoiceId: number;
  status: string;
  installments: Installment[];
  totalPaid: number;
  createdAt: string;
}

export interface InvoiceDetail {
  invoice: Invoice;
  payments: Payment[];
  totalPaid: number;
  remaining: number;
}

export interface CreditNote {
  id: number;
  reference: string;
  invoiceId: number;
  customerId: number;
  status: string;
  type: CreditNoteType;
  reason: string;
  lines: BillingLine[];
  totalAmount: number;
  createdAt: string;
  validatedAt: string | null;
}

export interface AuditLog {
  id: number;
  module: string;
  entityType: string;
  entityId: string;
  action: AuditAction | string;
  actionLabel: string;
  userId: string;
  userEmail: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string;
  occurredAt: string;
}

export interface QuoteFilters {
  page?: number;
  size?: number;
  status?: QuoteStatus | null;
  customerId?: number | null;
}

export interface OrderFilters {
  page?: number;
  size?: number;
  status?: OrderStatus | null;
  customerId?: number | null;
}

export interface ProFormaFilters {
  page?: number;
  size?: number;
  customerId?: number | null;
}

export interface InvoiceFilters {
  page?: number;
  size?: number;
  status?: InvoiceStatus | null;
  customerId?: number | null;
}

export interface CreditNoteFilters {
  page?: number;
  size?: number;
  invoiceId?: number | null;
}

export interface AuditFilters {
  page?: number;
  size?: number;
  module?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: AuditAction | '';
}

export interface CreateQuoteRequest {
  customerId: number;
  validUntil: string;
  notes: string;
  lines: QuoteLine[];
}

export interface UpdateQuoteRequest {
  validUntil: string;
  notes: string;
  lines: QuoteLine[];
}

export interface ConvertQuoteRequest {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface CreateOrderRequest {
  customerId: number;
  quoteId: number | null;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  notes: string;
  lines: OrderLine[];
}

export interface UpdateOrderRequest {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  notes: string;
  lines: OrderLine[];
}

export interface CreateProFormaRequest {
  customerId: number;
  customerName: string;
  validUntil: string;
  notes: string;
  lines: BillingLine[];
}

export interface UpdateProFormaRequest {
  validUntil: string;
  notes: string;
  lines: BillingLine[];
}

export interface CreateInvoiceRequest {
  customerId: number;
  orderId: number | null;
  dueDate: string;
  notes: string;
  lines: BillingLine[];
}

export interface UpdateInvoiceRequest {
  dueDate: string;
  notes: string;
  lines: BillingLine[];
}

export interface RecordPaymentRequest {
  invoiceId: number;
  amount: number;
  method: PaymentMethod;
  reference: string;
  notes: string;
}

export interface CreateScheduleRequest {
  invoiceId: number;
  installments: Installment[];
}

export interface RecordInstallmentRequest {
  invoiceId: number;
  installmentId: number;
  amount: number;
  method: PaymentMethod;
  reference: string;
}

export interface CreateCreditNoteRequest {
  invoiceId: number;
  type: CreditNoteType;
  reason: string;
  lines: BillingLine[];
}

export type QuotePage = PageResponse<Quote>;
export type OrderPage = PageResponse<Order>;
export type ProFormaPage = PageResponse<ProForma>;
export type InvoicePage = PageResponse<Invoice>;
export type CreditNotePage = PageResponse<CreditNote>;
export type AuditLogPage = PageResponse<AuditLog>;