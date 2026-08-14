import { SelectOption } from '../../../../shared/ui/select/select';

/**
 * `LineNature` decides the accounting target at posting time: MERCHANDISE ->
 * a stock account (31x), SERVICE -> an expense account (6xx). See MODULES.md
 * § erp-supplier.
 */
export const LINE_NATURES: SelectOption[] = [
  { value: 'MERCHANDISE', label: 'Marchandise' },
  { value: 'SERVICE', label: 'Prestation' },
];

export interface PurchaseOrderLine {
  id?: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  nature: string;
  /** Quantities the reception has ticked off (read-only, filled by backend). */
  receivedQuantity?: number;
  amountHT?: number;
  amountTTC?: number;
}

export interface PurchaseOrder {
  id: number;
  reference: string;              // CA-…
  supplierId: number;
  supplierName?: string;
  status: string;                 // DRAFT · CONFIRMED · CANCELLED · (RECEIVED/INVOICED)
  notes: string;
  lines: PurchaseOrderLine[];
  totalAmountHT: number;
  totalVatAmount: number;
  totalAmountTTC: number;
  expectedDate?: string;
  createdAt: string;
  confirmedAt?: string;
}

export interface CreatePurchaseOrderRequest {
  supplierId: number;
  lines: PurchaseOrderLine[];
  expectedDate?: string;
  notes?: string;
}
