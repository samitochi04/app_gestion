import { createSelector } from '@ngrx/store';
import { invoiceFeature } from './invoice.reducer';
import { invoiceAdapter } from './invoice.state';

export const {
  selectInvoicesState,
  selectLoading: selectInvoicesLoading,
  selectPage: selectInvoicesPage,
  selectSize: selectInvoicesSize,
  selectTotalElements: selectInvoicesTotalElements,
  selectTotalPages: selectInvoicesTotalPages,
} = invoiceFeature;

const { selectAll } = invoiceAdapter.getSelectors(selectInvoicesState);
export const selectAllInvoices = createSelector(selectAll, (i) => i);
