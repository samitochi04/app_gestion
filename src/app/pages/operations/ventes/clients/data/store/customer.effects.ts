import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, exhaustMap, map, switchMap } from 'rxjs/operators';
import { ApiError } from '../../../../../../core/services/api.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { CustomerService } from '../customer.service';
import { CustomerActions } from './customer.actions';

const msg = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

export const loadCustomersPageEffect = createEffect(
  (actions$ = inject(Actions), service = inject(CustomerService)) =>
    actions$.pipe(
      ofType(CustomerActions.loadPage),
      switchMap(({ page, size, search, filters }) =>
        service.list({ page: page ?? 0, size: size ?? 20, search, ...filters }).pipe(
          map((response) => CustomerActions.loadPageSuccess({ response })),
          catchError((e) => of(CustomerActions.loadPageFailure({ message: msg(e, 'Chargement impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const createCustomerEffect = createEffect(
  (actions$ = inject(Actions), service = inject(CustomerService), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(CustomerActions.create),
      exhaustMap(({ payload }) =>
        service.create(payload).pipe(
          map((customer) => { toast.success('Client créé.'); return CustomerActions.createSuccess({ customer }); }),
          catchError((e) => of(CustomerActions.createFailure({ message: msg(e, 'Création impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const updateCustomerEffect = createEffect(
  (actions$ = inject(Actions), service = inject(CustomerService), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(CustomerActions.update),
      exhaustMap(({ id, payload }) =>
        service.update(id, payload).pipe(
          map((customer) => { toast.success('Client modifié.'); return CustomerActions.updateSuccess({ customer }); }),
          catchError((e) => of(CustomerActions.updateFailure({ message: msg(e, 'Modification impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const deleteCustomerEffect = createEffect(
  (actions$ = inject(Actions), service = inject(CustomerService), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(CustomerActions.delete),
      exhaustMap(({ id }) =>
        service.delete(id).pipe(
          map(() => { toast.success('Client supprimé.'); return CustomerActions.deleteSuccess({ id }); }),
          catchError((e) => of(CustomerActions.deleteFailure({ message: msg(e, 'Suppression impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const customerErrorToastEffect = createEffect(
  (actions$ = inject(Actions), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(CustomerActions.createFailure, CustomerActions.updateFailure, CustomerActions.deleteFailure, CustomerActions.loadPageFailure),
      map(({ message }) => toast.error(message)),
    ),
  { functional: true, dispatch: false },
);
