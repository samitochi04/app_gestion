export interface CreditNoteLine {
  productId: number;
  productName?: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  vatRate?: number;
}

export interface CreditNote {
  id: number;
  reference: string;
  invoiceId: number;
  customerId: number;
  status: string;
  type: string;
  reason: string;
  lines: CreditNoteLine[];
  totalAmount: number;
  createdAt: string;
  validatedAt?: string;
}

export interface CreditNoteRequest {
  invoiceId: number;
  reason: string;
  type: string;
  lines: CreditNoteLine[];
}
