import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, UserRole } from '../models/user.model';

const STORAGE_KEY = 'mall_os_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser$ = new BehaviorSubject<User | null>(null);

  constructor() {
    this.restoreSession();
  }

  get user(): User | null {
    return this.currentUser$.getValue();
  }

  get user$(): Observable<User | null> {
    return this.currentUser$.asObservable();
  }

  login(email: string, password: string): boolean {
    const user = DEMO_USERS.find(u => u.email === email && u.password === password);
    if (user) {
      const userWithoutPassword = { ...user };
      delete (userWithoutPassword as any).password;
      this.currentUser$.next(userWithoutPassword);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  }

  logout(): void {
    this.currentUser$.next(null);
    localStorage.removeItem(STORAGE_KEY);
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
    return this.user?.role === 'MALL_MANAGER';
  }

  updateUser(user: User): void {
    const userWithoutPassword = { ...user };
    delete (userWithoutPassword as any).password;
    this.currentUser$.next(userWithoutPassword);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userWithoutPassword));
  }
}

export const DEMO_USERS: User[] = [
  {
    id: 'u-001',
    fullName: 'Sami Arfaoui',
    email: 'admin@mallas.com',
    password: 'Admin@123',
    role: 'SUPER_ADMIN',
    phone: '+216 71 000 000',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: new Date().toISOString()
  },
  {
    id: 'u-002',
    fullName: 'Ahmed Ben Salah',
    email: 'manager@citymall.tn',
    password: 'Manager@123',
    role: 'MALL_MANAGER',
    mallId: 'm-001',
    phone: '+216 55 123 456',
    createdAt: '2024-03-10T00:00:00Z',
    lastLogin: new Date().toISOString()
  },
  {
    id: 'u-003',
    fullName: 'Ines Gharbi',
    email: 'manager@lacmall.tn',
    password: 'Manager@123',
    role: 'MALL_MANAGER',
    mallId: 'm-002',
    phone: '+216 50 987 654',
    createdAt: '2024-05-20T00:00:00Z'
  }
];
