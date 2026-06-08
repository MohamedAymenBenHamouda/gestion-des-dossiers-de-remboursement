import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, AuthResponse, ApiResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'med_token';
  private readonly USER_KEY = 'med_user';

  currentUser = signal<User | null>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        map(res => res.data),
        tap(data => {
          localStorage.setItem(this.TOKEN_KEY, data.accessToken);
          localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
          this.currentUser.set(data.user);
        })
      );
  }

  register(payload: any): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/register`, payload)
      .pipe(
        map(res => res.data),
        tap(data => {
          if (!data.verificationRequired && data.accessToken) {
            localStorage.setItem(this.TOKEN_KEY, data.accessToken);
            localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
            this.currentUser.set(data.user);
          }
        })
      );
  }

  verifyOtp(email: string, otp: string): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/verify-otp`, { email, otp })
      .pipe(
        map(res => res.data),
        tap(data => {
          if (data.accessToken) {
            localStorage.setItem(this.TOKEN_KEY, data.accessToken);
            localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
            this.currentUser.set(data.user);
          }
        })
      );
  }

  resendOtp(email: string): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/auth/resend-otp`, { email })
      .pipe(map(res => res.data));
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getRole(): string | null {
    return this.currentUser()?.role ?? null;
  }

  isAdmin(): boolean { return this.getRole() === 'ROLE_ADMIN'; }
  isAgent(): boolean { return this.getRole() === 'ROLE_AGENT'; }
  isAssure(): boolean { return this.getRole() === 'ROLE_ASSURE'; }

  private loadUser(): User | null {
    try {
      const stored = localStorage.getItem(this.USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  }

  redirectToDashboard() {
    const role = this.getRole();
    if (role === 'ROLE_ADMIN') this.router.navigate(['/admin/dashboard']);
    else if (role === 'ROLE_AGENT') this.router.navigate(['/agent/dashboard']);
    else this.router.navigate(['/assure/dashboard']);
  }
}
