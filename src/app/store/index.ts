import { isDevMode } from '@angular/core';
import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { AppState } from './app.state';

/**
 * Root reducer map. Kept empty on purpose — the global `session` slice is
 * registered with provideState(sessionFeature) in app.config, and every other
 * domain slice is lazy. This just anchors the store's typing.
 */
export const ROOT_REDUCERS: ActionReducerMap<Partial<AppState>> = {};

export const metaReducers: MetaReducer<Partial<AppState>>[] = isDevMode() ? [] : [];
