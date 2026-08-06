import { createActionGroup, props } from '@ngrx/store';
import { PageResponse } from '../../../../../../core/models/api-response.model';
import {
  AdjustRequest, IssueRequest, ReceiveRequest, StockMovement, TransferRequest,
} from '../movement.model';

/**
 * Each movement kind carries its own command shape — an adjustment states a
 * counted quantity where the others state a moved one, so a single shared
 * payload type would hide a real difference.
 */
export const MovementActions = createActionGroup({
  source: 'Movement',
  events: {
    'Load Page': props<{ page?: number; size?: number; filters?: Record<string, string | number> }>(),
    'Load Page Success': props<{ response: PageResponse<StockMovement> }>(),
    'Load Page Failure': props<{ message: string }>(),

    'Receive': props<{ payload: ReceiveRequest }>(),
    'Issue': props<{ payload: IssueRequest }>(),
    'Adjust': props<{ payload: AdjustRequest }>(),
    'Transfer': props<{ payload: TransferRequest }>(),
    'Create Success': props<{ movement: StockMovement }>(),
    'Create Failure': props<{ message: string }>(),
  },
});
