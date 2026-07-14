import { EntityState, createEntityAdapter } from '@ngrx/entity';
import { Invoice } from '../invoice.model';

export interface InvoiceState extends EntityState<Invoice> {
  loading: boolean; error: string | null;
  page: number; size: number; totalElements: number; totalPages: number;
}

export const invoiceAdapter = createEntityAdapter<Invoice>();
export const initialInvoiceState: InvoiceState = invoiceAdapter.getInitialState({
  loading: false, error: null, page: 0, size: 20, totalElements: 0, totalPages: 0,
});
