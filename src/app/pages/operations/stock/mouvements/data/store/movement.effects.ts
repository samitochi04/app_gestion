import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, exhaustMap, map, switchMap } from 'rxjs/operators';
import { ApiError } from '../../../../../../core/services/api.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { MovementService } from '../movement.service';
import { MovementActions } from './movement.actions';

const msg = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

export const loadMovementsPageEffect = createEffect(
  (actions$ = inject(Actions), service = inject(MovementService)) =>
    actions$.pipe(
      ofType(MovementActions.loadPage),
      switchMap(({ page, size, filters }) =>
        service.list({ page: page ?? 0, size: size ?? 20, ...filters }).pipe(
          map((response) => MovementActions.loadPageSuccess({ response })),
          catchError((e) => of(MovementActions.loadPageFailure({ message: msg(e, 'Chargement impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const receiveMovementEffect = createEffect(
  (actions$ = inject(Actions), service = inject(MovementService), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(MovementActions.receive),
      exhaustMap(({ payload }) =>
        service.receive(payload).pipe(
          map((movement) => { toast.success('Réception enregistrée.'); return MovementActions.createSuccess({ movement }); }),
          catchError((e) => of(MovementActions.createFailure({ message: msg(e, 'Réception impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const issueMovementEffect = createEffect(
  (actions$ = inject(Actions), service = inject(MovementService), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(MovementActions.issue),
      exhaustMap(({ payload }) =>
        service.issue(payload).pipe(
          map((movement) => { toast.success('Sortie enregistrée.'); return MovementActions.createSuccess({ movement }); }),
          catchError((e) => of(MovementActions.createFailure({ message: msg(e, 'Sortie impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const adjustMovementEffect = createEffect(
  (actions$ = inject(Actions), service = inject(MovementService), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(MovementActions.adjust),
      exhaustMap(({ payload }) =>
        service.adjust(payload).pipe(
          map((movement) => { toast.success('Ajustement enregistré.'); return MovementActions.createSuccess({ movement }); }),
          catchError((e) => of(MovementActions.createFailure({ message: msg(e, 'Ajustement impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const transferMovementEffect = createEffect(
  (actions$ = inject(Actions), service = inject(MovementService), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(MovementActions.transfer),
      exhaustMap(({ payload }) =>
        service.transfer(payload).pipe(
          map((movement) => { toast.success('Transfert enregistré.'); return MovementActions.createSuccess({ movement }); }),
          catchError((e) => of(MovementActions.createFailure({ message: msg(e, 'Transfert impossible.') }))),
        ),
      ),
    ),
  { functional: true },
);

export const movementErrorToastEffect = createEffect(
  (actions$ = inject(Actions), toast = inject(ToastService)) =>
    actions$.pipe(
      ofType(MovementActions.createFailure, MovementActions.loadPageFailure),
      map(({ message }) => toast.error(message)),
    ),
  { functional: true, dispatch: false },
);
