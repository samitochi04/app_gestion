export interface AppUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  active: boolean;
  /**
   * Set on any account an administrator created or reset. Its holder's token
   * only opens `change-password` and `logout` until the password is changed.
   */
  mustChangePassword: boolean;
  roles: string[];
  permissions: string[];
  createdAt: string;
}

/**
 * An administrator never chooses a permanent password: the account is created
 * with a provisional one that its holder must replace at first sign-in.
 */
export interface CreateUserRequest {
  email: string;
  temporaryPassword: string;
  firstName: string;
  lastName: string;
}

export interface ResetPasswordRequest {
  temporaryPassword: string;
}
