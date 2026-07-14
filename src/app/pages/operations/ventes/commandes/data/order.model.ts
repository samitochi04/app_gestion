export interface OrderLine {
  id?: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitSalePrice: number;
  discount?: number;
  vatRate?: number;
  warehouseId?: number;
  amountHT?: number;
  vatAmount?: number;
  amountTTC?: number;
}

export interface Order {
  id: number;
  reference: string;
  customerId: number;
  quoteId?: number;
  status: string;
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
  confirmedAt?: string;
  shippedAt?: string;
}

export interface OrderRequest {
  customerId: number;
  lines: OrderLine[];
  quoteId?: number;
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
}
