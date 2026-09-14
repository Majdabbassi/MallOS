import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Store, StoreCategory, StoreStatus } from '../models/store.model';
import { AuthService } from './auth.service';

const API_BASE = 'http://localhost:8080/api';

@Injectable({
  providedIn: 'root'
})
export class StoreService {

  constructor(private http: HttpClient, private auth: AuthService) {}

  private get headers(): HttpHeaders {
    const userId = (this.auth.user as any)?.id ?? 0;
    return new HttpHeaders({ 'X-User-Id': String(userId) });
  }

  getAll(mallId?: string): Observable<Store[]> {
    const mid = mallId || (this.auth.user as any)?.mallId;
    if (!mid) return of([]);
    return this.http.get<Store[]>(`${API_BASE}/malls/${mid}/stores`, { headers: this.headers }).pipe(
      catchError(() => of([]))
    );
  }

  // Backwards-compatible alias used by components that call getByMallId
  getByMallId(mallId: string): Observable<Store[]> {
    return this.getAll(mallId);
  }

  // Convenience: allow calling getAll() without args (uses current user's mall)
  getAllForCurrentMall(): Observable<Store[]> {
    const mallId = (this.auth.user as any)?.mallId;
    if (!mallId) return of([]);
    return this.getAll(mallId);
  }

  getById(mallIdOrStoreId: string, storeId?: string): Observable<Store | undefined> {
    let mallId = mallIdOrStoreId;
    let sid = storeId;
    if (!storeId) {
      sid = mallIdOrStoreId;
      mallId = (this.auth.user as any)?.mallId;
    }
    if (!mallId || !sid) return of(undefined);
    return this.http.get<Store>(`${API_BASE}/malls/${mallId}/stores/${sid}`, { headers: this.headers }).pipe(
      catchError(() => of(undefined))
    );
  }

  create(mallIdOrPayload: string | Partial<Store>, payloadOptional?: Partial<Store>): Observable<Store | null> {
    let mallId: string | undefined;
    let payload: Partial<Store> | undefined;
    if (typeof mallIdOrPayload === 'string') {
      mallId = mallIdOrPayload;
      payload = payloadOptional;
    } else {
      payload = mallIdOrPayload;
      mallId = (this.auth.user as any)?.mallId;
    }
    if (!mallId || !payload) return of(null);
    return this.http.post<Store>(`${API_BASE}/malls/${mallId}/stores`, payload, { headers: this.headers }).pipe(
      catchError(() => of(null))
    );
  }

  update(mallIdOrStoreId: string, storeIdOrData: string | Partial<Store>, dataOptional?: Partial<Store>): Observable<any> {
    let mallId: string | undefined;
    let storeId: string | undefined;
    let data: Partial<Store> | undefined;
    if (typeof storeIdOrData === 'string' && dataOptional) {
      mallId = mallIdOrStoreId;
      storeId = storeIdOrData;
      data = dataOptional;
    } else {
      mallId = (this.auth.user as any)?.mallId;
      storeId = mallIdOrStoreId;
      data = storeIdOrData as Partial<Store>;
    }
    if (!mallId || !storeId || !data) return of(null);
    return this.http.put(`${API_BASE}/malls/${mallId}/stores/${storeId}`, data, { headers: this.headers }).pipe(
      catchError(() => of(null))
    );
  }

  delete(mallIdOrStoreId: string, storeIdOptional?: string): Observable<any> {
    let mallId: string | undefined;
    let storeId: string | undefined;
    if (storeIdOptional) {
      mallId = mallIdOrStoreId;
      storeId = storeIdOptional;
    } else {
      mallId = (this.auth.user as any)?.mallId;
      storeId = mallIdOrStoreId;
    }
    if (!mallId || !storeId) return of(null);
    return this.http.delete(`${API_BASE}/malls/${mallId}/stores/${storeId}`, { headers: this.headers }).pipe(
      catchError(() => of(null))
    );
  }

}