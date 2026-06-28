import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Assistant, AssistantPermission, PermissionKey } from '../models/assistant.model';

@Injectable({
  providedIn: 'root'
})
export class AssistantService {
  private assistants$ = new BehaviorSubject<Assistant[]>(DEMO_ASSISTANTS);

  getAll(): Observable<Assistant[]> {
    return this.assistants$.asObservable();
  }

  getByMallId(mallId: string): Observable<Assistant[]> {
    return new Observable(observer => {
      const assistants = this.assistants$.getValue().filter(a => a.mallId === mallId);
      observer.next(assistants);
      observer.complete();
    });
  }

  getById(id: string): Observable<Assistant | undefined> {
    return new Observable(observer => {
      const assistant = this.assistants$.getValue().find(a => a.id === id);
      observer.next(assistant);
      observer.complete();
    });
  }

  create(assistant: Omit<Assistant, 'id' | 'createdAt'>): void {
    const newAssistant: Assistant = {
      ...assistant,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    const current = this.assistants$.getValue();
    this.assistants$.next([...current, newAssistant]);
  }

  update(id: string, data: Partial<Assistant>): void {
    const current = this.assistants$.getValue();
    const index = current.findIndex(a => a.id === id);
    if (index !== -1) {
      const updated = [...current];
      updated[index] = { ...updated[index], ...data };
      this.assistants$.next(updated);
    }
  }

  updatePermissions(id: string, permissions: AssistantPermission[]): void {
    const current = this.assistants$.getValue();
    const index = current.findIndex(a => a.id === id);
    if (index !== -1) {
      const updated = [...current];
      updated[index] = { ...updated[index], permissions };
      this.assistants$.next(updated);
    }
  }

  delete(id: string): void {
    const current = this.assistants$.getValue();
    this.assistants$.next(current.filter(a => a.id !== id));
  }

  updateLastActive(id: string): void {
    const current = this.assistants$.getValue();
    const index = current.findIndex(a => a.id === id);
    if (index !== -1) {
      const updated = [...current];
      updated[index] = { ...updated[index], lastActive: new Date().toISOString() };
      this.assistants$.next(updated);
    }
  }
}

export const DEMO_ASSISTANTS: Assistant[] = [
  {
    id: 'a-001',
    mallId: 'm-001',
    fullName: 'Salma Ounis',
    email: 'salma@citymall.tn',
    phone: '+216 55 200 001',
    permissions: [
      { key: 'VIEW_STORES', granted: true },
      { key: 'MANAGE_STORES', granted: true },
      { key: 'VIEW_ASSISTANTS', granted: true },
      { key: 'MANAGE_ASSISTANTS', granted: false },
      { key: 'VIEW_REPORTS', granted: true },
      { key: 'EXPORT_REPORTS', granted: false },
      { key: 'VIEW_FINANCE', granted: false },
      { key: 'MANAGE_FINANCE', granted: false },
      { key: 'VIEW_MAINTENANCE', granted: true },
      { key: 'MANAGE_MAINTENANCE', granted: false }
    ],
    createdAt: '2024-04-01T00:00:00Z',
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'a-002',
    mallId: 'm-001',
    fullName: 'Walid Khelifi',
    email: 'walid@citymall.tn',
    phone: '+216 55 200 002',
    permissions: [
      { key: 'VIEW_STORES', granted: true },
      { key: 'MANAGE_STORES', granted: false },
      { key: 'VIEW_FINANCE', granted: true },
      { key: 'MANAGE_FINANCE', granted: true },
      { key: 'VIEW_REPORTS', granted: true },
      { key: 'EXPORT_REPORTS', granted: true }
    ],
    createdAt: '2024-05-15T00:00:00Z',
    lastActive: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'a-003',
    mallId: 'm-001',
    fullName: 'Farah Amor',
    email: 'farah@citymall.tn',
    phone: '+216 55 200 003',
    permissions: [
      { key: 'VIEW_STORES', granted: true },
      { key: 'VIEW_MAINTENANCE', granted: true },
      { key: 'MANAGE_MAINTENANCE', granted: true }
    ],
    createdAt: '2024-06-01T00:00:00Z',
    lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  }
];
