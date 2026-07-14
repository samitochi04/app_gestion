import { createFeature, createReducer, on } from '@ngrx/store';
import { OrderActions } from './order.actions';
import { initialOrderState, orderAdapter } from './order.state';

export const orderFeature = createFeature({
  name: 'orders',
  reducer: createReducer(
    initialOrderState,
    on(OrderActions.loadPage, (s) => ({ ...s, loading: true, error: null })),
    on(OrderActions.loadPageSuccess, (s, { response }) =>
      orderAdapter.setAll(response.content, {
        ...s, loading: false, page: response.page, size: response.size,
        totalElements: response.totalElements, totalPages: response.totalPages,
      }),
    ),
    on(OrderActions.loadPageFailure, (s, { message }) => ({ ...s, loading: false, error: message })),
    on(OrderActions.saveSuccess, (s, { order }) => orderAdapter.upsertOne(order, s)),
    on(OrderActions.actionFailure, (s, { message }) => ({ ...s, error: message })),
  ),
});
