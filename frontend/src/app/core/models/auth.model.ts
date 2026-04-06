export interface MagicLinkRequest {
  email: string;
}

export interface VerifyTokenRequest {
  token: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  name: string | null;
  role: UserRole | null;
}

export type UserRole = 'Customer' | 'Admin';
