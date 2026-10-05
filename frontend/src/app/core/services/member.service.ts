import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MallMember, MallPermission } from '../models/member.model';

const API_BASE = `${environment.apiBaseUrl}/api`;

@Injectable({ providedIn: 'root' })
export class MemberService {
  constructor(private http: HttpClient) {}

  list(mallId: number | string): Observable<MallMember[]> {
    return this.http.get<MallMember[]>(`${API_BASE}/malls/${mallId}/members`);
  }

  inviteAssistant(mallId: number | string, emailOrUsername: string, permissions: MallPermission[]): Observable<MallMember> {
    return this.http.post<MallMember>(`${API_BASE}/malls/${mallId}/assistants`, { emailOrUsername, permissions });
  }

  updatePermissions(mallId: number | string, userId: number, permissions: MallPermission[]): Observable<MallMember> {
    return this.http.put<MallMember>(`${API_BASE}/malls/${mallId}/assistants/${userId}/permissions`, { permissions });
  }

  removeAssistant(mallId: number | string, userId: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/malls/${mallId}/assistants/${userId}`);
  }

  /** Super admin only: make a registered user the manager of a mall. */
  assignManager(mallId: number | string, emailOrUsername: string): Observable<MallMember> {
    return this.http.post<MallMember>(`${API_BASE}/malls/${mallId}/managers`, { emailOrUsername });
  }
}
