import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { PageResponse } from '../../../../../../core/models/api-response.model';
import { CreateProductRequest, Product, UpdateProductRequest } from '../product.model';

export const ProductActions = createActionGroup({
  source: 'Product',
  events: {
    'Load Page': props<{ page?: number; size?: number; search?: string; filters?: Record<string, string | number> }>(),
    'Load Page Success': props<{ response: PageResponse<Product> }>(),
    'Load Page Failure': props<{ message: string }>(),

    // `sale` carries the sale price / margin, which the backend's
    // CreateProductCommand does NOT accept — the effect applies it with an
    // immediate follow-up update so a newly created product keeps its price.
    'Create': props<{ payload: CreateProductRequest; sale?: { unitSalePrice?: number; marginPercent?: number } }>(),
    'Create Success': props<{ product: Product }>(),
    'Create Failure': props<{ message: string }>(),

    'Update': props<{ id: number; payload: UpdateProductRequest }>(),
    'Update Success': props<{ product: Product }>(),
    'Update Failure': props<{ message: string }>(),

    'Delete': props<{ id: number }>(),
    'Delete Success': props<{ id: number }>(),
    'Delete Failure': props<{ message: string }>(),

    'Set Search': props<{ search: string }>(),
    'Clear Error': emptyProps(),
  },
});
