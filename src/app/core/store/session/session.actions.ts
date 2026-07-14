import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  ForgotPasswordRequest, LoginRequest, RegisterRequest,
  ResetPasswordRequest, TokenResponse,
} from '../../models/auth.model';

export const SessionActions = createActionGroup({
  source: 'Session',
  events: {
    // --- Login ---
    'Login': props<{ credentials: LoginRequest }>(),
    'Login Success': props<{ response: TokenResponse }>(),
    'Login Failure': props<{ message: string }>(),

    // --- Register ---
    'Register': props<{ payload: RegisterRequest }>(),
    'Register Success': props<{ response: TokenResponse }>(),
    'Register Failure': props<{ message: string }>(),

    // --- Startup / refresh ---
    'Restore Session': emptyProps(),        // dispatched by APP_INITIALIZER
    'Refresh Success': props<{ response: TokenResponse }>(),
    'Refresh Failure': emptyProps(),

    // --- Password flows (fire-and-forget; UI toasts on result) ---
    'Forgot Password': props<{ payload: ForgotPasswordRequest }>(),
    'Reset Password': props<{ payload: ResetPasswordRequest }>(),

    // --- Logout / misc ---
    'Logout': emptyProps(),
    'Clear Error': emptyProps(),
  },
});
