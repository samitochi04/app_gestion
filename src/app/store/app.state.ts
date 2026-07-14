import { SessionState } from '../core/store/session/session.state';

/**
 * Root application state. Eager slices are listed here; lazy feature slices
 * (products, customers, orders, invoices…) attach themselves via provideState
 * inside their lazy routes and extend the store at runtime.
 */
export interface AppState {
  session: SessionState;
}
