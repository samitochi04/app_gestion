import { EntityState, createEntityAdapter } from '@ngrx/entity';
import { Order } from '../order.model';

export interface OrderState extends EntityState<Order> {
  loading: boolean; error: string | null;
  page: number; size: number; totalElements: number; totalPages: number;
}

export const orderAdapter = createEntityAdapter<Order>();
export const initialOrderState: OrderState = orderAdapter.getInitialState({
  loading: false, error: null, page: 0, size: 20, totalElements: 0, totalPages: 0,
});
