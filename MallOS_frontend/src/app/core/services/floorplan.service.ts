import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  FloorResponse,
  GeometryResponse,
  PolygonResponse,
  CreatePolygonRequest,
  UpdatePolygonRequest,
} from '../models/floorplan.model';

const API_BASE = 'http://localhost:8080/api';

@Injectable({ providedIn: 'root' })
export class FloorplanService {

  constructor(private http: HttpClient) {}

  private headers(userId: number): HttpHeaders {
    return new HttpHeaders({ 'X-User-Id': String(userId) });
  }

  // ─── Floors ────────────────────────────────────────────────────────────────

  createFloor(userId: number, mallId: number, name: string, level: number, image?: File): Observable<FloorResponse> {
    const form = new FormData();
    form.append('name', name);
    form.append('level', String(level));
    if (image) form.append('image', image);
    return this.http.post<FloorResponse>(
      `${API_BASE}/malls/${mallId}/floors`,
      form,
      { headers: this.headers(userId) }
    );
  }

  listFloors(userId: number, mallId: number): Observable<FloorResponse[]> {
    return this.http.get<FloorResponse[]>(
      `${API_BASE}/malls/${mallId}/floors`,
      { headers: this.headers(userId) }
    );
  }

  getFloor(userId: number, mallId: number, floorId: number): Observable<FloorResponse> {
    return this.http.get<FloorResponse>(
      `${API_BASE}/malls/${mallId}/floors/${floorId}`,
      { headers: this.headers(userId) }
    );
  }

  updateFloorStatus(userId: number, mallId: number, floorId: number, status: string): Observable<FloorResponse> {
    return this.http.put<FloorResponse>(
      `${API_BASE}/malls/${mallId}/floors/${floorId}/status`,
      { status },
      { headers: this.headers(userId) }
    );
  }

  getGeometry(userId: number, mallId: number, floorId: number): Observable<GeometryResponse> {
    return this.http.get<GeometryResponse>(
      `${API_BASE}/malls/${mallId}/floors/${floorId}/geometry`,
      { headers: this.headers(userId) }
    );
  }

  // ─── Polygons ──────────────────────────────────────────────────────────────

  createPolygon(userId: number, mallId: number, floorId: number, req: CreatePolygonRequest): Observable<PolygonResponse> {
    return this.http.post<PolygonResponse>(
      `${API_BASE}/malls/${mallId}/floors/${floorId}/polygons`,
      req,
      { headers: this.headers(userId) }
    );
  }

  updatePolygon(userId: number, mallId: number, floorId: number, polygonId: number, req: UpdatePolygonRequest): Observable<PolygonResponse> {
    return this.http.put<PolygonResponse>(
      `${API_BASE}/malls/${mallId}/floors/${floorId}/polygons/${polygonId}`,
      req,
      { headers: this.headers(userId) }
    );
  }

  deletePolygon(userId: number, mallId: number, floorId: number, polygonId: number): Observable<void> {
    return this.http.delete<void>(
      `${API_BASE}/malls/${mallId}/floors/${floorId}/polygons/${polygonId}`,
      { headers: this.headers(userId) }
    );
  }

  // ─── Store linking ─────────────────────────────────────────────────────────

  linkStore(userId: number, mallId: number, floorId: number, polygonId: number, storeId: number): Observable<PolygonResponse> {
    return this.http.put<PolygonResponse>(
      `${API_BASE}/malls/${mallId}/floors/${floorId}/polygons/${polygonId}/store`,
      { storeId },
      { headers: this.headers(userId) }
    );
  }

  unlinkStore(userId: number, mallId: number, floorId: number, polygonId: number): Observable<PolygonResponse> {
    return this.http.delete<PolygonResponse>(
      `${API_BASE}/malls/${mallId}/floors/${floorId}/polygons/${polygonId}/store`,
      { headers: this.headers(userId) }
    );
  }
}
