import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { AuthResponse, AuthState, UserRole } from '../models/auth.model';
import { environment } from '../../../environments/environment';

interface JwtPayload {
  [key: string]: string;
  exp: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_KEY = 'refresh_token';

  private authState = signal<AuthState>({
    isAuthenticated: false,
    userId: null,
    email: null,
    name: null,
    role: null,
  });

  readonly isAuthenticated = computed(() => this.authState().isAuthenticated);
  readonly currentUser = computed(() => this.authState());
  readonly isAdmin = computed(() => this.authState().role === 'Admin');

  constructor(private http: HttpClient, private router: Router) {
    this.loadTokenFromStorage();
  }

  sendMagicLink(email: string) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/magic-link`, { email });
  }

  verifyToken(token: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/verify`, { token });
  }

  handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.REFRESH_KEY, response.refreshToken);
    this.updateAuthState(response.accessToken);
  }

  refreshToken() {
    const refreshToken = localStorage.getItem(this.REFRESH_KEY);
    if (!refreshToken) return null;
    return this.http.post<{ accessToken: string; refreshToken: string }>(
      `${this.apiUrl}/refresh`,
      { refreshToken }
    );
  }

  logout(): void {
    const refreshToken = localStorage.getItem(this.REFRESH_KEY);
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/logout`, { refreshToken }).subscribe();
    }
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    this.authState.set({
      isAuthenticated: false,
      userId: null,
      email: null,
      name: null,
      role: null,
    });
    this.router.navigate(['/']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  updateStoredTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_KEY, refreshToken);
    this.updateAuthState(accessToken);
  }

  private loadTokenFromStorage(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        const exp = parseInt(decoded['exp'], 10);
        if (exp * 1000 > Date.now()) {
          this.updateAuthState(token);
        } else {
          // Token expired, try refresh
          this.tryRefresh();
        }
      } catch {
        this.clearAuth();
      }
    }
  }

  private updateAuthState(token: string): void {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      this.authState.set({
        isAuthenticated: true,
        userId: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || null,
        email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || null,
        name: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || null,
        role: (decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as UserRole) || null,
      });
    } catch {
      this.clearAuth();
    }
  }

  private tryRefresh(): void {
    const obs = this.refreshToken();
    if (obs) {
      obs.subscribe({
        next: (res) => this.updateStoredTokens(res.accessToken, res.refreshToken),
        error: () => this.clearAuth(),
      });
    }
  }

  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    this.authState.set({
      isAuthenticated: false,
      userId: null,
      email: null,
      name: null,
      role: null,
    });
  }
}
