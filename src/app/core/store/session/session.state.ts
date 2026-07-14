import { AuthUser } from '../../models/auth.model';

export type SessionStatus = 'idle' | 'loading' | 'authenticated' | 'error';

export interface SessionState {
  user: AuthUser | null;
  roles: string[];
  permissions: string[];
  status: SessionStatus;
  error: string | null;
}

export const initialSessionState: SessionState = {
  user: null,
  roles: [],
  permissions: [],
  status: 'idle',
  error: null,
};
