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
}

export interface InvoiceRequest {
  customerId: number;
  lines: InvoiceLine[];
  orderId?: number;
  dueDate?: string;
  notes?: string;
}

export interface InvoicePayment {
  id: number;
  invoiceId: number;
  amount: number;
  method: string;
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
