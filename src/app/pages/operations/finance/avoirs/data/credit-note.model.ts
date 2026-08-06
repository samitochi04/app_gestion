import { SelectOption } from '../../../../../shared/ui/select/select';
import { InvoiceLine } from '../../factures/data/invoice.model';

/** `CreditNoteType` — how much of the invoice the avoir covers. */
export const CREDIT_NOTE_TYPES: SelectOption[] = [
  { value: 'PARTIAL', label: 'Partiel' },
  { value: 'FULL', label: 'Total' },
];

/**
 * `CreditNoteKind` — what actually happens to the goods, and therefore whether
 * stock moves. `RETURN` reintegrates the quantities and reverses the COGS;
 * `FINANCIAL` is a commercial gesture and touches no stock at all.
 */
export const CREDIT_NOTE_KINDS: SelectOption[] = [
  { value: 'RETURN', label: 'Retour de marchandise' },
  { value: 'FINANCIAL', label: 'Avoir financier (remise)' },
];

export interface CreditNote {
  id: number;
  reference: string;
  invoiceId: number;
  invoiceReference?: string;
  customerId: number;
  status: string;
  type: string;
  kind: string;
  reason: string;
  lines: InvoiceLine[];
  totalAmount: number;
  createdAt: string;
  validatedAt?: string;
}

export interface CreateCreditNoteRequest {
  invoiceId: number;
  /** `PARTIAL` | `FULL` — never `TOTAL`, which the backend rejects. */
  type: string;
  /** `RETURN` | `FINANCIAL` — required. */
  kind: string;
  reason: string;
  lines: InvoiceLine[];
}
