import { createFeature, createReducer, on } from '@ngrx/store';
import { QuoteActions } from './quote.actions';
import { initialQuoteState, quoteAdapter } from './quote.state';

export const quoteFeature = createFeature({
  name: 'quotes',
  reducer: createReducer(
    initialQuoteState,
    on(QuoteActions.loadPage, (s) => ({ ...s, loading: true, error: null })),
    on(QuoteActions.loadPageSuccess, (s, { response }) =>
      quoteAdapter.setAll(response.content, {
        ...s, loading: false, page: response.page, size: response.size,
        totalElements: response.totalElements, totalPages: response.totalPages,
      }),
    ),
    on(QuoteActions.loadPageFailure, (s, { message }) => ({ ...s, loading: false, error: message })),
    on(QuoteActions.saveSuccess, QuoteActions.sendSuccess, (s, { quote }) => quoteAdapter.upsertOne(quote, s)),
    on(QuoteActions.saveFailure, QuoteActions.actionFailure, (s, { message }) => ({ ...s, error: message })),
  ),
});
