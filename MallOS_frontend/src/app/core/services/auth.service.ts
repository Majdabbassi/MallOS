import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { User, UserRole } from '../models/user.model';
import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBaseUrl;
const STORAGE_KEY = 'mall_os_user';
const CRED_KEY = 'mall_os_credentials';

interface StoredCredentials {
  username: string;
  password: string;
}

interface AuthResponse {
  id: number | string;
  username: string;
  email?: string;
  role: UserRole;
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
   * Returns the pre-encoded Basic auth header value for the stored
   * credentials (used by the request interceptor), or null when logged out.
   */
  static getBasicAuthHeader(): string | null {
    try {
      const raw = sessionStorage.getItem(CRED_KEY);
      if (!raw) return null;
      const { username, password } = JSON.parse(raw) as StoredCredentials;
      return 'Basic ' + btoa(`${username}:${password}`);
    } catch {
      return null;
    }
  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<AuthResponse>(`${API_BASE}/auth/login`, {
      username: email,
      password
    }).pipe(
      map(response => {
        const user: User = {
          id: String(response.id),
          fullName: response.fullName || response.username || response.email || '',
          email: response.email || email,
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
        sessionStorage.setItem(CRED_KEY, JSON.stringify({ username: email, password }));
        return user;
      })
    );
  }

  logout(): void {
    this.currentUser$.next(null);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(CRED_KEY);
  }

  restoreSession(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored);
        this.currentUser$.next(user);
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

