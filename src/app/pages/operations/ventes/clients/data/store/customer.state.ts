import { EntityState, createEntityAdapter } from '@ngrx/entity';
import { Customer } from '../customer.model';

export interface CustomerState extends EntityState<Customer> {
  loading: boolean; error: string | null;
  page: number; size: number; totalElements: number; totalPages: number; search: string;
}

export const customerAdapter = createEntityAdapter<Customer>();
export const initialCustomerState: CustomerState = customerAdapter.getInitialState({
  loading: false, error: null, page: 0, size: 20, totalElements: 0, totalPages: 0, search: '',
});
