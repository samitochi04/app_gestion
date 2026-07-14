import { createActionGroup, props } from '@ngrx/store';
import { PageResponse } from '../../../../../core/models/api-response.model';
import { Invoice, InvoiceRequest, RecordPaymentRequest } from '../invoice.model';

export const InvoiceActions = createActionGroup({
  source: 'Invoice',
  events: {
    'Load Page': props<{ page?: number; size?: number; filters?: Record<string, string | number> }>(),
    'Load Page Success': props<{ response: PageResponse<Invoice> }>(),
    'Load Page Failure': props<{ message: string }>(),
    'Create': props<{ payload: InvoiceRequest }>(),
    'Update': props<{ id: number; payload: InvoiceRequest }>(),
    'Validate': props<{ id: number }>(),
    'Send': props<{ id: number }>(),
    'Cancel': props<{ id: number }>(),
    'Save Success': props<{ invoice: Invoice }>(),
    'Action Failure': props<{ message: string }>(),
    'Record Payment': props<{ payload: RecordPaymentRequest }>(),
    'Record Payment Success': props<{ invoiceId: number }>(),
  },
});
