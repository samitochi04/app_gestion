import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, exhaustMap, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { ApiError } from '../../../../../../core/services/api.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { ProductService } from '../product.service';
import { ProductActions } from './product.actions';
import { selectProductsSize } from './product.selectors';

const msg = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

export const loadProductsPageEffect = createEffect(
  (actions$ = inject(Actions), service = inject(ProductService), store = inject(Store)) =>
    actions$.pipe(
      ofType(ProductActions.loadPage),
      withLatestFrom(store.select(selectProductsSize)),
      switchMap(([{ page, size, search, filters }, currentSize]) =>
        service.list({ page: page ?? 0, size: size ?? currentSize, search, ...filters }).pipe(
          map((response) => ProductActions.loadPageSuccess({ response })),
          catchError((e) => of(ProductActions.loadPageFailure({ message: msg(e, 'Chargement impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const createProductEffect = createEffect(
  (actions$ = inject(Actions), service = inject(ProductService), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(ProductActions.create),
      exhaustMap(({ payload, sale }) =>
        service.create(payload).pipe(
          switchMap((product) => {
            // The backend CreateProductCommand only accepts a *purchase* price,
            // so any sale price / margin entered on the create form would be
            // silently dropped (stored as 0). Persist it now with an update —
            // UpdateProductCommand does accept unitSalePrice / marginPercent.
            const wantsSale = !!sale && ((sale.unitSalePrice ?? 0) > 0 || (sale.marginPercent ?? 0) > 0);
            if (!wantsSale) {
              toast.success('Produit créé.');
              return of(ProductActions.createSuccess({ product }));
            }
            return service.update(product.id, {
              name: product.name,
              description: product.description ?? payload.description ?? '',
              categoryId: product.categoryId ?? payload.categoryId,
              unitPurchasePrice: product.unitPurchasePrice ?? payload.unitPurchasePrice,
              unit: product.unit ?? payload.unit,
              unitSalePrice: sale!.unitSalePrice,
              marginPercent: sale!.marginPercent,
            }).pipe(
              map((updated) => { toast.success('Produit créé.'); return ProductActions.createSuccess({ product: updated }); }),
              // Creation itself succeeded; only the price top-up failed.
              catchError(() => {
                toast.success('Produit créé — pensez à vérifier le prix de vente.');
                return of(ProductActions.createSuccess({ product }));
              }),
            );
          }),
          catchError((e) => of(ProductActions.createFailure({ message: msg(e, 'Création impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const updateProductEffect = createEffect(
  (actions$ = inject(Actions), service = inject(ProductService), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(ProductActions.update),
      exhaustMap(({ id, payload }) =>
        service.update(id, payload).pipe(
          map((product) => { toast.success('Produit modifié.'); return ProductActions.updateSuccess({ product }); }),
          catchError((e) => of(ProductActions.updateFailure({ message: msg(e, 'Modification impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const deleteProductEffect = createEffect(
  (actions$ = inject(Actions), service = inject(ProductService), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(ProductActions.delete),
      exhaustMap(({ id }) =>
        service.delete(id).pipe(
          map(() => { toast.success('Produit supprimé.'); return ProductActions.deleteSuccess({ id }); }),
          catchError((e) => of(ProductActions.deleteFailure({ message: msg(e, 'Suppression impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const productErrorToastEffect = createEffect(
  (actions$ = inject(Actions), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(ProductActions.createFailure, ProductActions.updateFailure, ProductActions.deleteFailure, ProductActions.loadPageFailure),
      map(({ message }) => toast.error(message)),
    ),
  { functional: true, dispatch: false },
);
