import { createSelector } from '@ngrx/store';
import { quoteFeature } from './quote.reducer';
import { quoteAdapter } from './quote.state';

export const {
  selectQuotesState,
  selectLoading: selectQuotesLoading,
  selectPage: selectQuotesPage,
  selectSize: selectQuotesSize,
  selectTotalElements: selectQuotesTotalElements,
  selectTotalPages: selectQuotesTotalPages,
} = quoteFeature;

const { selectAll } = quoteAdapter.getSelectors(selectQuotesState);
export const selectAllQuotes = createSelector(selectAll, (q) => q);
