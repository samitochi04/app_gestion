import { createFeature, createReducer, on } from '@ngrx/store';
import { CustomerActions } from './customer.actions';
import { customerAdapter, initialCustomerState } from './customer.state';

export const customerFeature = createFeature({
  name: 'customers',
  reducer: createReducer(
    initialCustomerState,
    on(CustomerActions.loadPage, (s, { search }) => ({ ...s, loading: true, error: null, search: search ?? s.search })),
    on(CustomerActions.loadPageSuccess, (s, { response }) =>
      customerAdapter.setAll(response.content, {
        ...s, loading: false, page: response.page, size: response.size,
        totalElements: response.totalElements, totalPages: response.totalPages,
      }),
    ),
    on(CustomerActions.loadPageFailure, (s, { message }) => ({ ...s, loading: false, error: message })),
    on(CustomerActions.createSuccess, (s, { customer }) => customerAdapter.addOne(customer, s)),
    on(CustomerActions.updateSuccess, (s, { customer }) => customerAdapter.upsertOne(customer, s)),
    on(CustomerActions.deleteSuccess, (s, { id }) => customerAdapter.removeOne(id, s)),
    on(CustomerActions.createFailure, CustomerActions.updateFailure, CustomerActions.deleteFailure, (s, { message }) => ({ ...s, error: message })),
    on(CustomerActions.clearError, (s) => ({ ...s, error: null })),
  ),
});
