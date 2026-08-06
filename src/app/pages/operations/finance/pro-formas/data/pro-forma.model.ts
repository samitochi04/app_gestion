import { InvoiceLine } from '../../factures/data/invoice.model';

/**
 * A pro forma is a billable quotation. Converting one is the only way — apart
 * from shipping an order — to bring a sales invoice into existence.
 * `DRAFT` → `SENT` → `EXECUTED` / `CONVERTED` / `EXPIRED`.
 */
export interface ProForma {
  id: number;
  reference: string;
  customerId: number;
  customerName: string;
  status: string;
  validUntil: string;
  convertedToInvoiceId?: number;
  lines: InvoiceLine[];
  totalAmountHT: number;
  totalAmountTTC: number;
  notes: string;
  createdAt: string;
}

/** `customerName` is required by the backend and denormalised onto the document. */
export interface CreateProFormaRequest {
  customerId: number;
  customerName: string;
  validUntil?: string;
  notes?: string;
  lines: InvoiceLine[];
}

export interface UpdateProFormaRequest {
  validUntil?: string;
  notes?: string;
  lines?: InvoiceLine[];
}
