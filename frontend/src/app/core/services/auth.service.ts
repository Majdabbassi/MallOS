import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { User, UserRole } from '../models/user.model';
import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBaseUrl;
const STORAGE_KEY = 'mall_os_user';
const TOKEN_KEY = 'mall_os_token';

interface AuthResponse {
  id: number | string;
  username: string;
  email?: string;
  role: UserRole;
  token?: string;
  authenticated: boolean;
  mallId?: number;
  fullName?: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
  lastLogin?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser$ = new BehaviorSubject<User | null>(null);

  constructor(private http: HttpClient) {
    this.restoreSession();
  }

  get user(): User | null {
    return this.currentUser$.getValue();
  }

  get user$(): Observable<User | null> {
    return this.currentUser$.asObservable();
  }

  /**
   * Returns the bearer token for the stored session, or null when logged out.
   * Intentionally returns no credentials — only a short-lived JWT is kept,
   * never the password.
   */
  static getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  login(identifier: string, password: string): Observable<User> {
    return this.http.post<AuthResponse>(`${API_BASE}/auth/login`, {
      username: identifier,
      password
    }).pipe(
      map(response => {
        const user: User = {
          id: String(response.id),
          fullName: response.fullName || response.username || response.email || '',
          email: response.email || identifier,
          password: '',
          role: response.role,
          mallId: response.mallId ? String(response.mallId) : undefined,
          avatar: response.avatar,
          phone: response.phone,
          createdAt: response.createdAt || new Date().toISOString(),
          lastLogin: response.lastLogin
        };

        this.currentUser$.next(user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        if (response.token) {
          sessionStorage.setItem(TOKEN_KEY, response.token);
        }
        return user;
      })
    );
  }

  logout(): void {
    this.currentUser$.next(null);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }

  restoreSession(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored);
        const token = sessionStorage.getItem(TOKEN_KEY);
        if (token) {
          this.currentUser$.next(user);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  isAdmin(): boolean {
    return this.user?.role === 'SUPER_ADMIN';
  }

  isManager(): boolean {
    return this.user?.role === 'MALL_USER';
  }

  updateUser(user: User): void {
    const userWithoutPassword = { ...user };
    delete (userWithoutPassword as any).password;
    this.currentUser$.next(userWithoutPassword);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userWithoutPassword));
  }
}