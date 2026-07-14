import { EntityState, createEntityAdapter } from '@ngrx/entity';
import { Quote } from '../quote.model';

export interface QuoteState extends EntityState<Quote> {
  loading: boolean; error: string | null;
  page: number; size: number; totalElements: number; totalPages: number;
}

export const quoteAdapter = createEntityAdapter<Quote>();
export const initialQuoteState: QuoteState = quoteAdapter.getInitialState({
  loading: false, error: null, page: 0, size: 20, totalElements: 0, totalPages: 0,
});
