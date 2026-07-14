import { createSelector } from '@ngrx/store';
import { customerFeature } from './customer.reducer';
import { customerAdapter } from './customer.state';

export const {
  selectCustomersState,
  selectLoading: selectCustomersLoading,
  selectPage: selectCustomersPage,
  selectSize: selectCustomersSize,
  selectTotalElements: selectCustomersTotalElements,
  selectTotalPages: selectCustomersTotalPages,
} = customerFeature;

const { selectAll } = customerAdapter.getSelectors(selectCustomersState);
export const selectAllCustomers = createSelector(selectAll, (c) => c);
