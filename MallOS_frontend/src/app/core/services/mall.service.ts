import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Mall } from '../models/mall.model';
import { AuthService } from './auth.service';

const API_BASE = 'http://localhost:8080';

@Injectable({
  providedIn: 'root'
})
export class MallService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  private get headers(): HttpHeaders {
    const userId = (this.auth.user as any)?.id ?? 0;
    return new HttpHeaders({ 'X-User-Id': String(userId) });
  }

  getAll(): Observable<Mall[]> {
    return this.http.get<Mall[]>(`${API_BASE}/malls`, { headers: this.headers }).pipe(
      catchError(() => of([]))
    );
  }

  getById(id: string): Observable<Mall | undefined> {
    return this.http.get<Mall>(`${API_BASE}/malls/${id}`, { headers: this.headers }).pipe(
      catchError(() => of(undefined))
    );
  }

  create(mall: Omit<Mall, 'id' | 'createdAt'>): Observable<Mall> {
    return this.http.post<Mall>(`${API_BASE}/malls`, mall, { headers: this.headers });
  }

  update(id: string, data: Partial<Mall>): Observable<any> {
    return this.http.put(`${API_BASE}/malls/${id}`, data, { headers: this.headers }).pipe(
      catchError(() => of(null))
    );
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${API_BASE}/malls/${id}`, { headers: this.headers }).pipe(
      catchError(() => of(null))
    );
  }

  getByManagerId(managerId: string): Observable<Mall[]> {
    return this.http.get<Mall[]>(`${API_BASE}/malls?managerId=${managerId}`, { headers: this.headers }).pipe(
      catchError(() => of([]))
    );
  }

  getManagersWithoutMall(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/api/users?role=MALL_USER&unassigned=true`, { headers: this.headers }).pipe(
      catchError(() => of([]))
    );
  }
}
