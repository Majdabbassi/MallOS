import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StoreApiResponse } from '../models/floorplan.model';

const API_BASE = 'http://localhost:8080/api';

/**
 * HTTP-based service for the real Store backend API.
 * Named separately from the existing demo-data `store.service.ts`
 * to avoid breaking the existing store list UI.
 */
@Injectable({ providedIn: 'root' })
export class StoreApiService {

  constructor(private http: HttpClient) {}

  private headers(userId: number): HttpHeaders {
    return new HttpHeaders({ 'X-User-Id': String(userId) });
  }

  listStores(userId: number, mallId: number): Observable<StoreApiResponse[]> {
    return this.http.get<StoreApiResponse[]>(
      `${API_BASE}/malls/${mallId}/stores`,
      { headers: this.headers(userId) }
    );
  }

  /** Returns stores not yet assigned to any polygon — for the Assign Store dropdown */
  listUnlinked(userId: number, mallId: number): Observable<StoreApiResponse[]> {
    return this.http.get<StoreApiResponse[]>(
      `${API_BASE}/malls/${mallId}/stores/unlinked`,
      { headers: this.headers(userId) }
    );
  }

  getStore(userId: number, mallId: number, storeId: number): Observable<StoreApiResponse> {
    return this.http.get<StoreApiResponse>(
      `${API_BASE}/malls/${mallId}/stores/${storeId}`,
      { headers: this.headers(userId) }
    );
  }
}
