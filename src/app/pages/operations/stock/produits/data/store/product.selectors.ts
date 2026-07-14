import { createSelector } from '@ngrx/store';
import { productFeature } from './product.reducer';
import { productAdapter } from './product.state';

export const {
  selectProductsState,
  selectLoading: selectProductsLoading,
  selectError: selectProductsError,
  selectPage: selectProductsPage,
  selectSize: selectProductsSize,
  selectTotalElements: selectProductsTotalElements,
  selectTotalPages: selectProductsTotalPages,
  selectSearch: selectProductsSearch,
} = productFeature;

const { selectAll } = productAdapter.getSelectors(selectProductsState);
export const selectAllProducts = createSelector(selectAll, (products) => products);
