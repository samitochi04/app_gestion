import { createFeature, createReducer, on } from '@ngrx/store';
import { InvoiceActions } from './invoice.actions';
import { initialInvoiceState, invoiceAdapter } from './invoice.state';

export const invoiceFeature = createFeature({
  name: 'invoices',
  reducer: createReducer(
    initialInvoiceState,
    on(InvoiceActions.loadPage, (s) => ({ ...s, loading: true, error: null })),
    on(InvoiceActions.loadPageSuccess, (s, { response }) =>
      invoiceAdapter.setAll(response.content, {
        ...s, loading: false, page: response.page, size: response.size,
        totalElements: response.totalElements, totalPages: response.totalPages,
      }),
    ),
    on(InvoiceActions.loadPageFailure, (s, { message }) => ({ ...s, loading: false, error: message })),
    on(InvoiceActions.saveSuccess, (s, { invoice }) => invoiceAdapter.upsertOne(invoice, s)),
    on(InvoiceActions.actionFailure, (s, { message }) => ({ ...s, error: message })),
  ),
});
