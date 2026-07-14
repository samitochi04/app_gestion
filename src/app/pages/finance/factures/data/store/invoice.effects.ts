import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, exhaustMap, map, switchMap } from 'rxjs/operators';
import { ApiError } from '../../../../../core/services/api.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { InvoiceService } from '../invoice.service';
import { InvoiceActions } from './invoice.actions';

const msg = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

export const loadInvoicesPageEffect = createEffect(
  (actions$ = inject(Actions), service = inject(InvoiceService)) =>
    actions$.pipe(
      ofType(InvoiceActions.loadPage),
      switchMap(({ page, size, filters }) =>
        service.list({ page: page ?? 0, size: size ?? 20, ...filters }).pipe(
          map((response) => InvoiceActions.loadPageSuccess({ response })),
          catchError((e) => of(InvoiceActions.loadPageFailure({ message: msg(e, 'Chargement impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const createInvoiceEffect = createEffect(
  (actions$ = inject(Actions), service = inject(InvoiceService), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(InvoiceActions.create),
      exhaustMap(({ payload }) =>
        service.create(payload).pipe(
          map((invoice) => { toast.success('Facture créée.'); return InvoiceActions.saveSuccess({ invoice }); }),
          catchError((e) => of(InvoiceActions.actionFailure({ message: msg(e, 'Création impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const updateInvoiceEffect = createEffect(
  (actions$ = inject(Actions), service = inject(InvoiceService), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(InvoiceActions.update),
      exhaustMap(({ id, payload }) =>
        service.update(id, payload).pipe(
          map((invoice) => { toast.success('Facture modifiée.'); return InvoiceActions.saveSuccess({ invoice }); }),
          catchError((e) => of(InvoiceActions.actionFailure({ message: msg(e, 'Modification impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const validateInvoiceEffect = createEffect(
  (actions$ = inject(Actions), service = inject(InvoiceService), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(InvoiceActions.validate),
      exhaustMap(({ id }) =>
        service.validate(id).pipe(
          map((invoice) => { toast.success('Facture validée.'); return InvoiceActions.saveSuccess({ invoice }); }),
          catchError((e) => of(InvoiceActions.actionFailure({ message: msg(e, 'Validation impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const sendInvoiceEffect = createEffect(
  (actions$ = inject(Actions), service = inject(InvoiceService), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(InvoiceActions.send),
      exhaustMap(({ id }) =>
        service.send(id).pipe(
          map((invoice) => { toast.success('Facture envoyée.'); return InvoiceActions.saveSuccess({ invoice }); }),
          catchError((e) => of(InvoiceActions.actionFailure({ message: msg(e, 'Envoi impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const cancelInvoiceEffect = createEffect(
  (actions$ = inject(Actions), service = inject(InvoiceService), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(InvoiceActions.cancel),
      exhaustMap(({ id }) =>
        service.cancel(id).pipe(
          map((invoice) => { toast.success('Facture annulée.'); return InvoiceActions.saveSuccess({ invoice }); }),
          catchError((e) => of(InvoiceActions.actionFailure({ message: msg(e, 'Annulation impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const recordPaymentEffect = createEffect(
  (actions$ = inject(Actions), service = inject(InvoiceService), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(InvoiceActions.recordPayment),
      exhaustMap(({ payload }) =>
        service.recordPayment(payload).pipe(
          map(() => { toast.success('Paiement enregistré.'); return InvoiceActions.recordPaymentSuccess({ invoiceId: payload.invoiceId }); }),
          catchError((e) => of(InvoiceActions.actionFailure({ message: msg(e, 'Paiement impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

/** Refresh the invoice list page after a payment so paidAmount/remainingAmount are current. */
export const refreshAfterPaymentEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(InvoiceActions.recordPaymentSuccess),
      map(() => InvoiceActions.loadPage({})),
    ),
  { functional: true },
);

export const invoiceErrorToastEffect = createEffect(
  (actions$ = inject(Actions), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(InvoiceActions.actionFailure, InvoiceActions.loadPageFailure),
      map(({ message }) => toast.error(message)),
    ),
  { functional: true, dispatch: false },
);
