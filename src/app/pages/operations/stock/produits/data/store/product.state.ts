import { EntityState, createEntityAdapter } from '@ngrx/entity';
import { Product } from '../product.model';

export interface ProductState extends EntityState<Product> {
  loading: boolean;
  error: string | null;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  search: string;
}

export const productAdapter = createEntityAdapter<Product>();

export const initialProductState: ProductState = productAdapter.getInitialState({
  loading: false, error: null, page: 0, size: 20, totalElements: 0, totalPages: 0, search: '',
});
