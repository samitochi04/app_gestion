/** Authenticated user profile embedded in the login/refresh response. */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

/** `data` payload of /api/auth/login and /api/auth/refresh. */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: AuthUser;
  /**
   * When `true`, the holder must call PUT /api/auth/change-password before
   * accessing any other endpoint. The JWT itself carries this flag and
   * JwtAuthenticationFilter rejects all other requests with 403
   * PASSWORD_CHANGE_REQUIRED. See MODULES.md § erp-iam.
   */
  mustChangePassword?: boolean;
}

export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { email: string; firstName: string; lastName: string; password: string; }
export interface RefreshRequest { refreshToken: string; }
export interface ForgotPasswordRequest { email: string; }
export interface ResetPasswordRequest { code: string; email: string; newPassword: string; }
export interface ChangePasswordRequest { currentPassword: string; newPassword: string; }
