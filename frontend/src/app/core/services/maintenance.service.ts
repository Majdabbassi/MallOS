import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const API_BASE = `${environment.apiBaseUrl}/api`;

export type WorkOrderPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type WorkOrderStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELED';

export interface WorkOrder {
  id: number;
  title: string;
  description: string | null;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  storeId: number | null;
  storeCode: string | null;
  storeName: string | null;
  floor: number | null;
  assignee: string | null;
  cost: number | null;
  reportedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
  closedAt: string | null;
}

export interface WorkOrderRequest {
  title: string;
  description?: string | null;
  priority: WorkOrderPriority;
  storeId?: number | null;
  assignee?: string | null;
}

/** Maintenance work orders of a mall (needs the "Maintenance work orders" permission). */
@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  constructor(private http: HttpClient) {}

  list(mallId: string | number, status?: WorkOrderStatus): Observable<WorkOrder[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<WorkOrder[]>(`${API_BASE}/malls/${mallId}/work-orders`, { params });
  }

  create(mallId: string | number, request: WorkOrderRequest): Observable<WorkOrder> {
    return this.http.post<WorkOrder>(`${API_BASE}/malls/${mallId}/work-orders`, request);
  }

  update(mallId: string | number, id: number, request: WorkOrderRequest): Observable<WorkOrder> {
    return this.http.put<WorkOrder>(`${API_BASE}/malls/${mallId}/work-orders/${id}`, request);
  }

  changeStatus(mallId: string | number, id: number, status: WorkOrderStatus, cost?: number | null): Observable<WorkOrder> {
    return this.http.post<WorkOrder>(`${API_BASE}/malls/${mallId}/work-orders/${id}/status`, { status, cost: cost ?? null });
  }
}
