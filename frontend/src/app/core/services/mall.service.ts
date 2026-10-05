import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Mall, CreateMallRequest } from '../models/mall.model';
import { environment } from '../../../environments/environment';

const API_BASE = `${environment.apiBaseUrl}/api`;

@Injectable({
  providedIn: 'root'
})
export class MallService {
  constructor(private http: HttpClient) {}

  getById(id: string | number): Observable<Mall | undefined> {
    return this.http.get<Mall>(`${API_BASE}/malls/${id}`).pipe(
      catchError(() => of(undefined))
    );
  }

  getAll(): Observable<Mall[]> {
    return this.http.get<Mall[]>(`${API_BASE}/malls`).pipe(
      catchError(() => of([]))
    );
  }

  create(request: CreateMallRequest): Observable<Mall> {
    return this.http.post<Mall>(`${API_BASE}/malls`, request);
  }
}