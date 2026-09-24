import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Store, CreateStoreRequest } from '../models/store.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const API_BASE = `${environment.apiBaseUrl}/api`;

@Injectable({
  providedIn: 'root'
})
export class StoreService {

  constructor(private http: HttpClient, private auth: AuthService) {}

  getAll(mallId?: string): Observable<Store[]> {
    const mid = mallId || (this.auth.user as any)?.mallId;
    if (!mid) return of([]);
    return this.http.get<Store[]>(`${API_BASE}/malls/${mid}/stores`).pipe(
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
    return this.http.get<Store>(`${API_BASE}/malls/${mallId}/stores/${sid}`).pipe(
      catchError(() => of(undefined))
    );
  }

  /**
   * Creates a store. The payload matches the backend CreateStoreRequest DTO —
   * the id, mallId and createdAt are generated server-side, never client-side.
   * Errors propagate to the caller (the global error interceptor surfaces a toast).
   */
  create(mallIdOrPayload: string | CreateStoreRequest, payloadOptional?: CreateStoreRequest): Observable<Store> {
    let mallId: string | undefined;
    let payload: CreateStoreRequest | undefined;
    if (typeof mallIdOrPayload === 'string') {
      mallId = mallIdOrPayload;
      payload = payloadOptional;
    } else {
      payload = mallIdOrPayload;
      mallId = (this.auth.user as any)?.mallId;
    }
    if (!mallId || !payload) throw new Error('Cannot create a store without a mall id');
    return this.http.post<Store>(`${API_BASE}/malls/${mallId}/stores`, payload);
  }

  update(mallIdOrStoreId: string, storeIdOrData: string | Partial<Store>, dataOptional?: Partial<Store>): Observable<Store> {
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
    if (!mallId || !storeId || !data) throw new Error('Cannot update a store without a mall and store id');
    return this.http.put<Store>(`${API_BASE}/malls/${mallId}/stores/${storeId}`, data);
  }

  delete(mallIdOrStoreId: string, storeIdOptional?: string): Observable<void> {
    let mallId: string | undefined;
    let storeId: string | undefined;
    if (storeIdOptional) {
      mallId = mallIdOrStoreId;
      storeId = storeIdOptional;
    } else {
      mallId = (this.auth.user as any)?.mallId;
      storeId = mallIdOrStoreId;
    }
    if (!mallId || !storeId) throw new Error('Cannot delete a store without a mall and store id');
    return this.http.delete<void>(`${API_BASE}/malls/${mallId}/stores/${storeId}`);
  }

}