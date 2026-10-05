import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  FloorResponse,
  GeometryResponse,
  PolygonResponse,
  CreatePolygonRequest,
  UpdatePolygonRequest,
} from '../models/floorplan.model';
import { environment } from '../../../environments/environment';

const API_BASE = `${environment.apiBaseUrl}/api`;

@Injectable({ providedIn: 'root' })
export class FloorplanService {

  constructor(private http: HttpClient) {}

  // ─── Floors ────────────────────────────────────────────────────────────────

  createFloor(mallId: number, name: string, level: number, image?: File): Observable<FloorResponse> {
    const form = new FormData();
    form.append('name', name);
    form.append('level', String(level));
    if (image) form.append('image', image);
    return this.http.post<FloorResponse>(
      `${API_BASE}/malls/${mallId}/floors`,
      form
    );
  }

  listFloors(mallId: number): Observable<FloorResponse[]> {
    return this.http.get<FloorResponse[]>(`${API_BASE}/malls/${mallId}/floors`);
  }

  /** Attaches/replaces the source image of an existing floor (does not create a new floor). */
  updateFloorImage(mallId: number, floorId: number, image: File): Observable<FloorResponse> {
    const form = new FormData();
    form.append('image', image);
    return this.http.put<FloorResponse>(
      `${API_BASE}/malls/${mallId}/floors/${floorId}/image`,
      form
    );
  }

  getFloor(mallId: number, floorId: number): Observable<FloorResponse> {
    return this.http.get<FloorResponse>(`${API_BASE}/malls/${mallId}/floors/${floorId}`);
  }

  updateFloorStatus(mallId: number, floorId: number, status: string): Observable<FloorResponse> {
    return this.http.put<FloorResponse>(
      `${API_BASE}/malls/${mallId}/floors/${floorId}/status`,
      { status }
    );
  }

  getGeometry(mallId: number, floorId: number): Observable<GeometryResponse> {
    return this.http.get<GeometryResponse>(
      `${API_BASE}/malls/${mallId}/floors/${floorId}/geometry`
    );
  }

  /** Fetches the floor plan image as a Blob (authenticated) so callers can build an object URL. */
  getFloorImage(mallId: number, floorId: number): Observable<Blob> {
    return this.http.get(`${API_BASE}/malls/${mallId}/floors/${floorId}/image`, {
      responseType: 'blob'
    });
  }

  // ─── Polygons ──────────────────────────────────────────────────────────────

  createPolygon(mallId: number, floorId: number, req: CreatePolygonRequest): Observable<PolygonResponse> {
    return this.http.post<PolygonResponse>(
      `${API_BASE}/malls/${mallId}/floors/${floorId}/polygons`,
      req
    );
  }

  updatePolygon(mallId: number, floorId: number, polygonId: number, req: UpdatePolygonRequest): Observable<PolygonResponse> {
    return this.http.put<PolygonResponse>(
      `${API_BASE}/malls/${mallId}/floors/${floorId}/polygons/${polygonId}`,
      req
    );
  }

  deletePolygon(mallId: number, floorId: number, polygonId: number): Observable<void> {
    return this.http.delete<void>(
      `${API_BASE}/malls/${mallId}/floors/${floorId}/polygons/${polygonId}`
    );
  }

  // ─── Store linking ─────────────────────────────────────────────────────────

  linkStore(mallId: number, floorId: number, polygonId: number, storeId: number): Observable<PolygonResponse> {
    return this.http.put<PolygonResponse>(
      `${API_BASE}/malls/${mallId}/floors/${floorId}/polygons/${polygonId}/store`,
      { storeId }
    );
  }

  unlinkStore(mallId: number, floorId: number, polygonId: number): Observable<PolygonResponse> {
    return this.http.delete<PolygonResponse>(
      `${API_BASE}/malls/${mallId}/floors/${floorId}/polygons/${polygonId}/store`
    );
  }
}