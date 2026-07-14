import { createActionGroup, props } from '@ngrx/store';
import { PageResponse } from '../../../../../../core/models/api-response.model';
import { Quote, QuoteRequest } from '../quote.model';

export const QuoteActions = createActionGroup({
  source: 'Quote',
  events: {
    'Load Page': props<{ page?: number; size?: number; filters?: Record<string, string | number> }>(),
    'Load Page Success': props<{ response: PageResponse<Quote> }>(),
    'Load Page Failure': props<{ message: string }>(),
    'Create': props<{ payload: QuoteRequest }>(),
    'Update': props<{ id: number; payload: QuoteRequest }>(),
    'Save Success': props<{ quote: Quote }>(),
    'Save Failure': props<{ message: string }>(),
    'Send': props<{ id: number }>(),
    'Send Success': props<{ quote: Quote }>(),
    'Convert': props<{ id: number }>(),
    'Convert Success': props<{ id: number }>(),
    'Action Failure': props<{ message: string }>(),
  },
});
