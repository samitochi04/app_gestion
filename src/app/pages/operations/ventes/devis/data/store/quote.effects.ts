import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, exhaustMap, map, switchMap } from 'rxjs/operators';
import { ApiError } from '../../../../../../core/services/api.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { QuoteService } from '../quote.service';
import { QuoteActions } from './quote.actions';

const msg = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

export const loadQuotesPageEffect = createEffect(
  (actions$ = inject(Actions), service = inject(QuoteService)) =>
    actions$.pipe(
      ofType(QuoteActions.loadPage),
      switchMap(({ page, size, filters }) =>
        service.list({ page: page ?? 0, size: size ?? 20, ...filters }).pipe(
          map((response) => QuoteActions.loadPageSuccess({ response })),
          catchError((e) => of(QuoteActions.loadPageFailure({ message: msg(e, 'Chargement impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const createOrUpdateQuoteEffect = createEffect(
  (actions$ = inject(Actions), service = inject(QuoteService), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(QuoteActions.create),
      exhaustMap(({ payload }) =>
        service.create(payload).pipe(
          map((quote) => { toast.success('Devis créé.'); return QuoteActions.saveSuccess({ quote }); }),
          catchError((e) => of(QuoteActions.saveFailure({ message: msg(e, 'Création impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const updateQuoteEffect = createEffect(
  (actions$ = inject(Actions), service = inject(QuoteService), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(QuoteActions.update),
      exhaustMap(({ id, payload }) =>
        service.update(id, payload).pipe(
          map((quote) => { toast.success('Devis modifié.'); return QuoteActions.saveSuccess({ quote }); }),
          catchError((e) => of(QuoteActions.saveFailure({ message: msg(e, 'Modification impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const sendQuoteEffect = createEffect(
  (actions$ = inject(Actions), service = inject(QuoteService), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(QuoteActions.send),
      exhaustMap(({ id }) =>
        service.send(id).pipe(
          map((quote) => { toast.success('Devis envoyé.'); return QuoteActions.sendSuccess({ quote }); }),
          catchError((e) => of(QuoteActions.actionFailure({ message: msg(e, 'Envoi impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const convertQuoteEffect = createEffect(
  (actions$ = inject(Actions), service = inject(QuoteService), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(QuoteActions.convert),
      exhaustMap(({ id }) =>
        service.convert(id).pipe(
          map(() => { toast.success('Devis converti en commande.'); return QuoteActions.convertSuccess({ id }); }),
          catchError((e) => of(QuoteActions.actionFailure({ message: msg(e, 'Conversion impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const quoteErrorToastEffect = createEffect(
  (actions$ = inject(Actions), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(QuoteActions.saveFailure, QuoteActions.actionFailure, QuoteActions.loadPageFailure),
      map(({ message }) => toast.error(message)),
    ),
  { functional: true, dispatch: false },
);
