import { SelectOption } from '../../../../shared/ui/select/select';

/**
 * `SupplierCreditNote` (`AVF-…`). Two natures with different effects
 * (MODULES.md § erp-supplier):
 *  - RETURN    : goods go back; they leave the damaged warehouse. No accounting
 *                event from the stock move — the credit note's own entry credits 31x.
 *  - FINANCIAL : rebate, or goods invoiced but never delivered → credits 4081.
 */
export const SUPPLIER_CREDIT_NOTE_KINDS: SelectOption[] = [
  { value: 'RETURN', label: 'Retour de marchandise' },
  { value: 'FINANCIAL', label: 'Avoir financier (remise)' },
];

export interface SupplierCreditNoteLine {
  id?: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  amountTTC?: number;
}

export interface SupplierCreditNote {
  id: number;
  reference: string;              // AVF-…
  supplierInvoiceId: number;
  supplierInvoiceReference?: string;
  supplierId?: number;
  kind: string;                   // RETURN · FINANCIAL
  status: string;                 // DRAFT · VALIDATED
  reason: string;
  lines: SupplierCreditNoteLine[];
  totalAmount: number;
  createdAt: string;
  validatedAt?: string;
}

export interface CreateSupplierCreditNoteRequest {
  supplierInvoiceId: number;
  kind: string;
  reason: string;
  lines: SupplierCreditNoteLine[];
}
