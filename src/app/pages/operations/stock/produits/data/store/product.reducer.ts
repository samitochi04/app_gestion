import { createFeature, createReducer, on } from '@ngrx/store';
import { ProductActions } from './product.actions';
import { initialProductState, productAdapter } from './product.state';

export const productFeature = createFeature({
  name: 'products',
  reducer: createReducer(
    initialProductState,

    on(ProductActions.loadPage, (s, { search }) => ({
      ...s, loading: true, error: null, search: search ?? s.search,
    })),
    on(ProductActions.loadPageSuccess, (s, { response }) =>
      productAdapter.setAll(response.content, {
        ...s, loading: false,
        page: response.page, size: response.size,
        totalElements: response.totalElements, totalPages: response.totalPages,
      }),
    ),
    on(ProductActions.loadPageFailure, (s, { message }) => ({ ...s, loading: false, error: message })),

    on(ProductActions.createSuccess, (s, { product }) => productAdapter.addOne(product, s)),
    on(ProductActions.updateSuccess, (s, { product }) => productAdapter.upsertOne(product, s)),
    on(ProductActions.deleteSuccess, (s, { id }) => productAdapter.removeOne(id, s)),

    on(ProductActions.createFailure, ProductActions.updateFailure, ProductActions.deleteFailure, (s, { message }) => ({
      ...s, error: message,
    })),

    on(ProductActions.setSearch, (s, { search }) => ({ ...s, search })),
    on(ProductActions.clearError, (s) => ({ ...s, error: null })),
  ),
});
