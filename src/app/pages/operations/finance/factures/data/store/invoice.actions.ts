import { createActionGroup, props } from '@ngrx/store';
import { PageResponse } from '../../../../../../core/models/api-response.model';
import {
  Invoice, RecordPaymentRequest, RefundPaymentRequest, UpdateInvoiceRequest,
} from '../invoice.model';

/**
 * No `Create` action: `POST /api/invoices` does not exist. An invoice arrives
 * from a shipped order or from a converted pro forma.
 */
export const InvoiceActions = createActionGroup({
  source: 'Invoice',
  events: {
    'Load Page': props<{ page?: number; size?: number; filters?: Record<string, string | number> }>(),
    'Load Page Success': props<{ response: PageResponse<Invoice> }>(),
    'Load Page Failure': props<{ message: string }>(),
    'Update': props<{ id: number; payload: UpdateInvoiceRequest }>(),
    'Validate': props<{ id: number }>(),
    'Send': props<{ id: number; email: string }>(),
    'Cancel': props<{ id: number; reason?: string }>(),
    'Save Success': props<{ invoice: Invoice }>(),
    'Action Failure': props<{ message: string }>(),
    'Record Payment': props<{ payload: RecordPaymentRequest }>(),
    'Refund Payment': props<{ payload: RefundPaymentRequest }>(),
    'Payment Settled': props<{ invoiceId: number }>(),
  },
});
