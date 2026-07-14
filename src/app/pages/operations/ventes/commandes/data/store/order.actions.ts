import { createActionGroup, props } from '@ngrx/store';
import { PageResponse } from '../../../../../../core/models/api-response.model';
import { Order, OrderRequest } from '../order.model';

export const OrderActions = createActionGroup({
  source: 'Order',
  events: {
    'Load Page': props<{ page?: number; size?: number; filters?: Record<string, string | number> }>(),
    'Load Page Success': props<{ response: PageResponse<Order> }>(),
    'Load Page Failure': props<{ message: string }>(),
    'Create': props<{ payload: OrderRequest }>(),
    'Update': props<{ id: number; payload: OrderRequest }>(),
    'Confirm': props<{ id: number }>(),
    'Prepare': props<{ id: number }>(),
    'Ship': props<{ id: number }>(),
    'Deliver': props<{ id: number }>(),
    'Cancel': props<{ id: number }>(),
    'Save Success': props<{ order: Order }>(),
    'Action Failure': props<{ message: string }>(),
  },
});
