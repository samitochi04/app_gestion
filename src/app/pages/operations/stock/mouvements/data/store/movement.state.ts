import { EntityState, createEntityAdapter } from '@ngrx/entity';
import { StockMovement } from '../movement.model';

export interface MovementState extends EntityState<StockMovement> {
  loading: boolean;
  error: string | null;
  page: number; size: number; totalElements: number; totalPages: number;
}

export const movementAdapter = createEntityAdapter<StockMovement>();
export const initialMovementState: MovementState = movementAdapter.getInitialState({
  loading: false, error: null, page: 0, size: 20, totalElements: 0, totalPages: 0,
});
