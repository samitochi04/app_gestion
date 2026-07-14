import { createSelector } from '@ngrx/store';
import { orderFeature } from './order.reducer';
import { orderAdapter } from './order.state';

export const {
  selectOrdersState,
  selectLoading: selectOrdersLoading,
  selectPage: selectOrdersPage,
  selectSize: selectOrdersSize,
  selectTotalElements: selectOrdersTotalElements,
  selectTotalPages: selectOrdersTotalPages,
} = orderFeature;

const { selectAll } = orderAdapter.getSelectors(selectOrdersState);
export const selectAllOrders = createSelector(selectAll, (o) => o);
export const selectDeliveryOrders = createSelector(selectAll, (o) =>
  o.filter((ord) => ['CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'].includes(ord.status)),
);
