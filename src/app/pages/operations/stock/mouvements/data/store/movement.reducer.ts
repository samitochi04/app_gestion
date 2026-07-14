import { createFeature, createReducer, on } from '@ngrx/store';
import { MovementActions } from './movement.actions';
import { initialMovementState, movementAdapter } from './movement.state';

export const movementFeature = createFeature({
  name: 'movements',
  reducer: createReducer(
    initialMovementState,
    on(MovementActions.loadPage, (s) => ({ ...s, loading: true, error: null })),
    on(MovementActions.loadPageSuccess, (s, { response }) =>
      movementAdapter.setAll(response.content, {
        ...s, loading: false, page: response.page, size: response.size,
        totalElements: response.totalElements, totalPages: response.totalPages,
      }),
    ),
    on(MovementActions.loadPageFailure, (s, { message }) => ({ ...s, loading: false, error: message })),
    on(MovementActions.createSuccess, (s, { movement }) => movementAdapter.addOne(movement, s)),
    on(MovementActions.createFailure, (s, { message }) => ({ ...s, error: message })),
  ),
});
