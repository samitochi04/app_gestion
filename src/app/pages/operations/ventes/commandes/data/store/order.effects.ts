import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, exhaustMap, map, switchMap } from 'rxjs/operators';
import { ApiError } from '../../../../../../core/services/api.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { OrderService } from '../order.service';
import { OrderActions } from './order.actions';

const msg = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

export const loadOrdersPageEffect = createEffect(
  (actions$ = inject(Actions), service = inject(OrderService)) =>
    actions$.pipe(
      ofType(OrderActions.loadPage),
      switchMap(({ page, size, filters }) =>
        service.list({ page: page ?? 0, size: size ?? 50, ...filters }).pipe(
          map((response) => OrderActions.loadPageSuccess({ response })),
          catchError((e) => of(OrderActions.loadPageFailure({ message: msg(e, 'Chargement impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const createOrderEffect = createEffect(
  (actions$ = inject(Actions), service = inject(OrderService), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(OrderActions.create),
      exhaustMap(({ payload }) =>
        service.create(payload).pipe(
          map((order) => { toast.success('Commande créée.'); return OrderActions.saveSuccess({ order }); }),
          catchError((e) => of(OrderActions.actionFailure({ message: msg(e, 'Création impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const updateOrderEffect = createEffect(
  (actions$ = inject(Actions), service = inject(OrderService), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(OrderActions.update),
      exhaustMap(({ id, payload }) =>
        service.update(id, payload).pipe(
          map((order) => { toast.success('Commande modifiée.'); return OrderActions.saveSuccess({ order }); }),
          catchError((e) => of(OrderActions.actionFailure({ message: msg(e, 'Modification impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

function statusEffect(
  actionType: typeof OrderActions.confirm | typeof OrderActions.prepare | typeof OrderActions.ship | typeof OrderActions.deliver | typeof OrderActions.cancel,
  call: (service: OrderService, id: number) => ReturnType<OrderService['confirm']>,
  successMsg: string,
  failMsg: string,
) {
  return createEffect(
    (actions$ = inject(Actions), service = inject(OrderService), toast = inject(ToastService)) =>
      actions$.pipe(
        ofType(actionType),
        exhaustMap(({ id }) =>
          call(service, id).pipe(
            map((order) => { toast.success(successMsg); return OrderActions.saveSuccess({ order }); }),
            catchError((e) => of(OrderActions.actionFailure({ message: msg(e, failMsg) }))),
          ),
        ),
      ),
    { functional: true },
  );
}

export const confirmOrderEffect = statusEffect(OrderActions.confirm, (s, id) => s.confirm(id), 'Commande confirmée.', 'Confirmation impossible.');
export const prepareOrderEffect = statusEffect(OrderActions.prepare, (s, id) => s.prepare(id), 'Commande en préparation.', 'Action impossible.');
export const shipOrderEffect = statusEffect(OrderActions.ship, (s, id) => s.ship(id), 'Commande expédiée.', 'Expédition impossible.');
export const deliverOrderEffect = statusEffect(OrderActions.deliver, (s, id) => s.deliver(id), 'Commande livrée.', 'Livraison impossible.');
export const cancelOrderEffect = statusEffect(OrderActions.cancel, (s, id) => s.cancel(id), 'Commande annulée.', 'Annulation impossible.');

export const orderErrorToastEffect = createEffect(
  (actions$ = inject(Actions), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(OrderActions.actionFailure, OrderActions.loadPageFailure),
      map(({ message }) => toast.error(message)),
    ),
  { functional: true, dispatch: false },
);
