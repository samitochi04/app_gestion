import { createSelector } from '@ngrx/store';
import { movementFeature } from './movement.reducer';
import { movementAdapter } from './movement.state';

export const {
  selectMovementsState,
  selectLoading: selectMovementsLoading,
  selectPage: selectMovementsPage,
  selectSize: selectMovementsSize,
  selectTotalElements: selectMovementsTotalElements,
  selectTotalPages: selectMovementsTotalPages,
} = movementFeature;

const { selectAll } = movementAdapter.getSelectors(selectMovementsState);
export const selectAllMovements = createSelector(selectAll, (m) => m);
