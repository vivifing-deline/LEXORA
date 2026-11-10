import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../services/api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints.constant';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  designation?: string;
  phone?: string;
  avatarUrl?: string;
  department?: string;
  workspaceName?: string;
  roles: string[];
  permissions: string[];
}

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly TOKEN_KEY = 'lexora_token';
  private readonly USER_KEY = 'lexora_user';

  readonly currentUser = signal<UserProfile | null>(this.getStoredUser());
  readonly token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));
  
  readonly isAuthenticated = computed(() => !!this.currentUser() && !!this.token());
  readonly userRole = computed(() => this.currentUser()?.roles?.[0] || 'Guest');

  private getStoredUser(): UserProfile | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.api.post<any>(API_ENDPOINTS.AUTH.LOGIN, credentials).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setSession(res.data.token, res.data.user);
        }
      })
    );
  }

  setSession(token: string, user: UserProfile): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.token.set(token);
    this.currentUser.set(user);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  hasPermission(code: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.roles?.includes('Firm Admin')) return true;
    return user.permissions?.includes(code) ?? false;
  }

  hasRole(roleName: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return user.roles?.includes(roleName) ?? false;
  }
}

