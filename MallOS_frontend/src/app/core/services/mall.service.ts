import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Mall, MallStatus } from '../models/mall.model';
import { DEMO_USERS } from './auth.service';

const DEMO_MALLS: Mall[] = [
  {
    id: 'm-001',
    name: 'City Center Mall',
    address: '45 Avenue Habib Bourguiba',
    city: 'Tunis',
    country: 'Tunisia',
    companyName: 'City Mall Group SA',
    managerId: 'u-002',
    status: 'ACTIVE',
    totalStores: 12,
    occupiedStores: 10,
    totalAssistants: 3,
    totalArea: 45000,
    openedYear: 2019,
    phone: '+216 71 800 100',
    email: 'contact@citymall.tn',
    website: 'www.citymall.tn',
    floorCount: 3,
    visitorsToday: 8142,
    salesToday: 128430,
    createdAt: '2024-03-10T00:00:00Z'
  },
  {
    id: 'm-002',
    name: 'Lac Prestige Mall',
    address: 'Les Berges du Lac 2',
    city: 'Tunis',
    country: 'Tunisia',
    companyName: 'Lac Invest SARL',
    managerId: 'u-003',
    status: 'PENDING',
    totalStores: 6,
    occupiedStores: 4,
    totalAssistants: 1,
    totalArea: 28000,
    openedYear: 2022,
    phone: '+216 71 900 200',
    email: 'contact@lacmall.tn',
    floorCount: 2,
    visitorsToday: 0,
    salesToday: 0,
    createdAt: '2024-05-20T00:00:00Z'
  },
  {
    id: 'm-003',
    name: 'Sousse Marina Mall',
    address: 'Port El Kantaoui',
    city: 'Sousse',
    country: 'Tunisia',
    companyName: 'Marina Invest Group',
    managerId: '',
    status: 'INACTIVE',
    totalStores: 0,
    occupiedStores: 0,
    totalAssistants: 0,
    totalArea: 32000,
    openedYear: 2023,
    phone: '+216 73 500 300',
    email: 'contact@sousse-marina.tn',
    floorCount: 2,
    visitorsToday: 0,
    salesToday: 0,
    createdAt: '2024-06-01T00:00:00Z'
  }
];

@Injectable({
  providedIn: 'root'
})
export class MallService {
  private malls$ = new BehaviorSubject<Mall[]>(DEMO_MALLS);

  getAll(): Observable<Mall[]> {
    return this.malls$.asObservable();
  }

  getById(id: string): Observable<Mall | undefined> {
    return new Observable(observer => {
      const mall = this.malls$.getValue().find(m => m.id === id);
      observer.next(mall);
      observer.complete();
    });
  }

  create(mall: Omit<Mall, 'id' | 'createdAt'>): void {
    const newMall: Mall = {
      ...mall,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      visitorsToday: 0,
      salesToday: 0
    };
    const current = this.malls$.getValue();
    this.malls$.next([...current, newMall]);
  }

  update(id: string, data: Partial<Mall>): void {
    const current = this.malls$.getValue();
    const index = current.findIndex(m => m.id === id);
    if (index !== -1) {
      const updated = [...current];
      updated[index] = { ...updated[index], ...(data as any) };
      this.malls$.next(updated);
    }
  }

  delete(id: string): void {
    const current = this.malls$.getValue();
    this.malls$.next(current.filter(m => m.id !== id));
  }

  getByManagerId(managerId: string): Observable<Mall[]> {
    return new Observable(observer => {
      const malls = this.malls$.getValue().filter(m => m.managerId === managerId);
      observer.next(malls);
      observer.complete();
    });
  }

  getManagersWithoutMall(): Observable<any[]> {
    return new Observable(observer => {
      const managerIds = this.malls$.getValue().map(m => m.managerId);
      const availableManagers = DEMO_USERS.filter(
        (u: any) => u.role === 'MALL_MANAGER' && !managerIds.includes(u.id)
      );
      observer.next(availableManagers);
      observer.complete();
    });
  }
}
