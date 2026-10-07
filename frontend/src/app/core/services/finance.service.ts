import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SILENT_ERRORS } from '../interceptors/error.interceptor';
import { AuditEntry, FinanceSummary, GenerateResult, Invoice, MallAnalytics } from '../models/finance.model';

const API_BASE = `${environment.apiBaseUrl}/api`;

/** Rent invoices, the money summary, the occupancy analytics and the mall's history. */
@Injectable({ providedIn: 'root' })
export class FinanceService {
  constructor(private http: HttpClient) {}

  invoices(mallId: string | number, period?: string, state?: string): Observable<Invoice[]> {
    let params = new HttpParams();
    if (period) params = params.set('period', period);
    if (state) params = params.set('state', state);
    return this.http.get<Invoice[]>(`${API_BASE}/malls/${mallId}/invoices`, { params });
  }

  summary(mallId: string | number, period?: string): Observable<FinanceSummary> {
    let params = new HttpParams();
    if (period) params = params.set('period', period);
    return this.http.get<FinanceSummary>(`${API_BASE}/malls/${mallId}/finance/summary`, { params });
  }

  generate(mallId: string | number, period: string): Observable<GenerateResult> {
    return this.http.post<GenerateResult>(`${API_BASE}/malls/${mallId}/invoices/generate`, null, { params: { period } });
  }

  refresh(mallId: string | number): Observable<{ lateFeesApplied: number }> {
    return this.http.post<{ lateFeesApplied: number }>(`${API_BASE}/malls/${mallId}/invoices/refresh`, null);
  }

  pay(mallId: string | number, invoiceId: number): Observable<Invoice> {
    return this.http.post<Invoice>(`${API_BASE}/malls/${mallId}/invoices/${invoiceId}/pay`, null);
  }

  cancel(mallId: string | number, invoiceId: number): Observable<Invoice> {
    return this.http.post<Invoice>(`${API_BASE}/malls/${mallId}/invoices/${invoiceId}/cancel`, null);
  }

  /** A CSV report as a file: the units and leases, or the invoices of a month (needs "Export reports"). */
  exportCsv(mallId: string | number, report: 'units' | 'invoices', period?: string): Observable<Blob> {
    let params = new HttpParams();
    if (period) params = params.set('period', period);
    return this.http.get(`${API_BASE}/malls/${mallId}/reports/${report}.csv`, {
      params, responseType: 'blob', context: new HttpContext().set(SILENT_ERRORS, true)
    });
  }

  analytics(mallId: string | number, silent = false): Observable<MallAnalytics> {
    return this.http.get<MallAnalytics>(`${API_BASE}/malls/${mallId}/analytics`, {
      context: new HttpContext().set(SILENT_ERRORS, silent)
    });
  }

  history(mallId: string | number, filters: { actor?: string; floor?: number | null; entityType?: string; limit?: number } = {},
          silent = false): Observable<AuditEntry[]> {
    let params = new HttpParams();
    if (filters.actor) params = params.set('actor', filters.actor);
    if (filters.floor !== undefined && filters.floor !== null) params = params.set('floor', filters.floor);
    if (filters.entityType) params = params.set('entityType', filters.entityType);
    if (filters.limit) params = params.set('limit', filters.limit);
    return this.http.get<AuditEntry[]>(`${API_BASE}/malls/${mallId}/audit`, {
      params, context: new HttpContext().set(SILENT_ERRORS, silent)
    });
  }
}
