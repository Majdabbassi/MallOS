import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Assistant, AssistantPermission, PermissionKey } from '../models/assistant.model';
import { AuthService } from './auth.service';

const API_BASE = 'http://localhost:8080';

@Injectable({
  providedIn: 'root'
})
export class AssistantService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  private get headers(): HttpHeaders {
    const userId = (this.auth.user as any)?.id ?? 0;
    return new HttpHeaders({ 'X-User-Id': String(userId) });
  }

  getAll(): Observable<Assistant[]> {
    const mallId = (this.auth.user as any)?.mallId;
    if (!mallId) return of([]);
    return this.http.get<Assistant[]>(`${API_BASE}/malls/${mallId}/assistants`, { headers: this.headers }).pipe(
      catchError(() => of([]))
    );
  }

  getByMallId(mallId: string): Observable<Assistant[]> {
    return this.http.get<Assistant[]>(`${API_BASE}/malls/${mallId}/assistants`, { headers: this.headers }).pipe(
      catchError(() => of([]))
    );
  }

  getById(id: string): Observable<Assistant | undefined> {
    const mallId = (this.auth.user as any)?.mallId;
    if (!mallId) return of(undefined);
    return this.http.get<any>(`${API_BASE}/malls/${mallId}/assistants/${id}`, { headers: this.headers }).pipe(
      catchError(() => of(undefined))
    );
  }

  create(mallIdOrAssistant: string | Omit<Assistant, 'id' | 'createdAt'>, assistantOptional?: Omit<Assistant, 'id' | 'createdAt'>): Observable<any> {
    let mallId: string | undefined;
    let assistant: any;
    if (typeof mallIdOrAssistant === 'string') {
      mallId = mallIdOrAssistant;
      assistant = assistantOptional;
    } else {
      assistant = mallIdOrAssistant;
      mallId = (this.auth.user as any)?.mallId;
    }
    if (!mallId || !assistant) return of(null);
    return this.http.post(`${API_BASE}/malls/${mallId}/assistants`, assistant, { headers: this.headers }).pipe(
      catchError(() => of(null))
    );
  }

  update(id: string, data: Partial<Assistant>): Observable<any> {
    const mallId = (this.auth.user as any)?.mallId;
    if (!mallId) return of(null);
    return this.http.put(`${API_BASE}/malls/${mallId}/assistants/${id}`, data, { headers: this.headers }).pipe(
      catchError(() => of(null))
    );
  }

  updatePermissions(id: string, permissions: AssistantPermission[]): Observable<any> {
    const mallId = (this.auth.user as any)?.mallId;
    if (!mallId) return of(null);
    return this.http.put(`${API_BASE}/malls/${mallId}/assistants/${id}/permissions`, { permissions }, { headers: this.headers }).pipe(
      catchError(() => of(null))
    );
  }

  delete(id: string): Observable<any> {
    const mallId = (this.auth.user as any)?.mallId;
    if (!mallId) return of(null);
    return this.http.delete(`${API_BASE}/malls/${mallId}/assistants/${id}`, { headers: this.headers }).pipe(
      catchError(() => of(null))
    );
  }

  updateLastActive(id: string): Observable<any> {
    // no dedicated endpoint; use a best-effort custom call if available
    return of(null);
  }
}
