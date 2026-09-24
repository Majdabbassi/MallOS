import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StoreApiResponse } from '../models/floorplan.model';
import { environment } from '../../../environments/environment';

const API_BASE = `${environment.apiBaseUrl}/api`;

/**
 * HTTP-based service for the real Store backend API.
 * The caller's identity comes from the Basic auth header attached by the
 * auth interceptor.
 */
@Injectable({ providedIn: 'root' })
export class StoreApiService {

  constructor(private http: HttpClient) {}

  listStores(mallId: number): Observable<StoreApiResponse[]> {
    return this.http.get<StoreApiResponse[]>(`${API_BASE}/malls/${mallId}/stores`);
  }

  /** Returns stores not yet assigned to any polygon — for the Assign Store dropdown */
  listUnlinked(mallId: number): Observable<StoreApiResponse[]> {
    return this.http.get<StoreApiResponse[]>(`${API_BASE}/malls/${mallId}/stores/unlinked`);
  }

  getStore(mallId: number, storeId: number): Observable<StoreApiResponse> {
    return this.http.get<StoreApiResponse>(`${API_BASE}/malls/${mallId}/stores/${storeId}`);
  }
}