import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { PageResponse } from '../../../../../../core/models/api-response.model';
import { Customer, CustomerRequest } from '../customer.model';

export const CustomerActions = createActionGroup({
  source: 'Customer',
  events: {
    'Load Page': props<{ page?: number; size?: number; search?: string; filters?: Record<string, string | number> }>(),
    'Load Page Success': props<{ response: PageResponse<Customer> }>(),
    'Load Page Failure': props<{ message: string }>(),
    'Create': props<{ payload: CustomerRequest }>(),
    'Create Success': props<{ customer: Customer }>(),
    'Create Failure': props<{ message: string }>(),
    'Update': props<{ id: number; payload: CustomerRequest }>(),
    'Update Success': props<{ customer: Customer }>(),
    'Update Failure': props<{ message: string }>(),
    'Delete': props<{ id: number }>(),
    'Delete Success': props<{ id: number }>(),
    'Delete Failure': props<{ message: string }>(),
    'Clear Error': emptyProps(),
  },
});
