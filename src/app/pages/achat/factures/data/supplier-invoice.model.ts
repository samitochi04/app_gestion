import { SelectOption } from '../../../../shared/ui/select/select';

/** Same four methods as the sales side, duplicated per bounded context. */
export const SUPPLIER_PAYMENT_METHODS: SelectOption[] = [
  { value: 'CASH', label: 'Espèces' },
  { value: 'BANK_TRANSFER', label: 'Virement bancaire' },
  { value: 'CHECK', label: 'Chèque' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
];

export interface SupplierInvoiceLine {
  id?: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  nature: string;
  amountHT?: number;
  amountTTC?: number;
}

export interface SupplierInvoice {
  id: number;
  reference: string;              // FA-…
  supplierId: number;
  supplierName?: string;
  purchaseOrderId?: number;
  status: string;                 // DRAFT · VALIDATED · PARTIALLY_PAID · PAID · CANCELLED
  issueDate: string;
  dueDate: string;
  lines: SupplierInvoiceLine[];
  totalAmountHT: number;
  totalVatAmount: number;
  totalAmountTTC: number;
  paidAmount: number;
  remainingAmount: number;
  notes: string;
  createdAt: string;
  validatedAt?: string;
}

export interface CreateSupplierInvoiceRequest {
  supplierId: number;
  issueDate?: string;
  dueDate?: string;
  notes?: string;
  lines: SupplierInvoiceLine[];
}

export interface RecordSupplierPaymentRequest {
  supplierInvoiceId: number;
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
}
