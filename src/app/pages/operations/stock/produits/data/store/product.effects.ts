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
      exhaustMap(({ payload }) =>
        service.create(payload).pipe(
          map((product) => { toast.success('Produit créé.'); return ProductActions.createSuccess({ product }); }),
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
