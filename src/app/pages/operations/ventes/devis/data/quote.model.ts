export interface QuoteLine {
  id?: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitSalePrice: number;
  discount?: number;
  vatRate?: number;
  amountHT?: number;
  vatAmount?: number;
  amountTTC?: number;
}

export interface Quote {
  id: number;
  reference: string;
  customerId: number;
  status: string;
  validUntil: string;
  notes: string;
  lines: QuoteLine[];
  totalAmountHT: number;
  totalVatAmount: number;
  totalAmountTTC: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteRequest {
  customerId: number;
  lines: QuoteLine[];
  validUntil?: string;
  notes?: string;
}
