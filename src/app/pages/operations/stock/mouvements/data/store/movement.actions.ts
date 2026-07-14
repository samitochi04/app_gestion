import { createActionGroup, props } from '@ngrx/store';
import { PageResponse } from '../../../../../../core/models/api-response.model';
import { ReceiveIssueAdjustRequest, StockMovement, TransferRequest } from '../movement.model';

export const MovementActions = createActionGroup({
  source: 'Movement',
  events: {
    'Load Page': props<{ page?: number; size?: number; filters?: Record<string, string | number> }>(),
    'Load Page Success': props<{ response: PageResponse<StockMovement> }>(),
    'Load Page Failure': props<{ message: string }>(),

    'Receive': props<{ payload: ReceiveIssueAdjustRequest }>(),
    'Issue': props<{ payload: ReceiveIssueAdjustRequest }>(),
    'Adjust': props<{ payload: ReceiveIssueAdjustRequest }>(),
    'Transfer': props<{ payload: TransferRequest }>(),
    'Create Success': props<{ movement: StockMovement }>(),
    'Create Failure': props<{ message: string }>(),
  },
});
