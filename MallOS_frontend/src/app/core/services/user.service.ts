import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';

const API_BASE = 'http://localhost:8080';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  private get headers(): HttpHeaders {
    const userId = (this.auth.user as any)?.id ?? 0;
    return new HttpHeaders({ 'X-User-Id': String(userId) });
  }

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(`${API_BASE}/api/users`, { headers: this.headers }).pipe(
      catchError(() => of([]))
    );
  }

  getById(id: string): Observable<User | undefined> {
    return this.http.get<User>(`${API_BASE}/api/users/${id}`, { headers: this.headers }).pipe(
      catchError(() => of(undefined))
    );
  }

  create(payload: any): Observable<User | null> {
    return this.http.post<any>(`${API_BASE}/auth/register`, payload, { headers: this.headers }).pipe(
      map(resp => ({
        id: String(resp.id || resp.username || ''),
        fullName: resp.fullName || resp.username || '',
        email: resp.email || '',
        password: '',
        role: (resp.role as any) || 'MALL_USER',
        createdAt: resp.createdAt || new Date().toISOString()
      } as User)),
      catchError(() => of(null))
    );
  }

  update(id: string, data: Partial<User>): Observable<any> {
    return this.http.put(`${API_BASE}/api/users/${id}`, data, { headers: this.headers }).pipe(
      catchError(() => of(null))
    );
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${API_BASE}/api/users/${id}`, { headers: this.headers }).pipe(
      catchError(() => of(null))
    );
  }
}
