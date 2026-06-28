import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Store, StoreCategory, StoreStatus } from '../models/store.model';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private stores$ = new BehaviorSubject<Store[]>(DEMO_STORES);

  getAll(): Observable<Store[]> {
    return this.stores$.asObservable();
  }

  getByMallId(mallId: string): Observable<Store[]> {
    return this.stores$.pipe(
      map(stores => stores.filter(s => s.mallId === mallId))
    );
  }

  getById(id: string): Observable<Store | undefined> {
    return new Observable(observer => {
      const store = this.stores$.getValue().find(s => s.id === id);
      observer.next(store);
      observer.complete();
    });
  }

  create(store: Omit<Store, 'id' | 'createdAt'>): void {
    const newStore: Store = {
      ...store,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    const current = this.stores$.getValue();
    this.stores$.next([...current, newStore]);
  }

  update(id: string, data: Partial<Store>): void {
    const current = this.stores$.getValue();
    const index = current.findIndex(s => s.id === id);
    if (index !== -1) {
      const updated = [...current];
      updated[index] = { ...updated[index], ...data };
      this.stores$.next(updated);
    }
  }

  delete(id: string): void {
    const current = this.stores$.getValue();
    this.stores$.next(current.filter(s => s.id !== id));
  }

  filterByCategory(mallId: string, category?: StoreCategory): Observable<Store[]> {
    return new Observable(observer => {
      let stores = this.stores$.getValue().filter(s => s.mallId === mallId);
      if (category) {
        stores = stores.filter(s => s.category === category);
      }
      observer.next(stores);
      observer.complete();
    });
  }

  filterByFloor(mallId: string, floor?: number): Observable<Store[]> {
    return new Observable(observer => {
      let stores = this.stores$.getValue().filter(s => s.mallId === mallId);
      if (floor !== undefined) {
        stores = stores.filter(s => s.floor === floor);
      }
      observer.next(stores);
      observer.complete();
    });
  }

  filterByStatus(mallId: string, status?: StoreStatus): Observable<Store[]> {
    return new Observable(observer => {
      let stores = this.stores$.getValue().filter(s => s.mallId === mallId);
      if (status) {
        stores = stores.filter(s => s.status === status);
      }
      observer.next(stores);
      observer.complete();
    });
  }
}

export const DEMO_STORES: Store[] = [
  {
    id: 's-001',
    mallId: 'm-001',
    name: 'Fashion Hub',
    code: 'A-101',
    category: 'FASHION',
    floor: 0,
    zone: 'North Wing',
    surface: 320,
    status: 'OPEN',
    ownerName: 'Karim Trabelsi',
    ownerPhone: '+216 55 100 001',
    ownerEmail: 'k.trabelsi@fashionhub.tn',
    contractStart: '2024-01-01',
    contractEnd: '2026-12-31',
    monthlyRent: 4800,
    createdAt: '2024-01-01T00:00:00Z',
    description: 'Premium fashion boutique carrying international and local brands.'
  },
  {
    id: 's-002',
    mallId: 'm-001',
    name: 'Teshion Hub',
    code: 'A-102',
    category: 'FASHION',
    floor: 0,
    zone: 'South Wing',
    surface: 280,
    status: 'OPEN',
    ownerName: 'Sonia Mejri',
    ownerPhone: '+216 55 100 002',
    ownerEmail: 's.mejri@teshion.tn',
    contractStart: '2024-02-01',
    contractEnd: '2026-01-31',
    monthlyRent: 4200,
    createdAt: '2024-02-01T00:00:00Z'
  },
  {
    id: 's-003',
    mallId: 'm-001',
    name: 'Coffee & Co',
    code: 'A-103',
    category: 'FOOD_BEVERAGE',
    floor: 0,
    zone: 'Central',
    surface: 120,
    status: 'OPEN',
    ownerName: 'Yassine Hamdi',
    ownerPhone: '+216 55 100 003',
    ownerEmail: 'y.hamdi@coffeeco.tn',
    contractStart: '2024-01-15',
    contractEnd: '2025-01-14',
    monthlyRent: 2800,
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 's-004',
    mallId: 'm-001',
    name: 'Sport Zone',
    code: 'A-104',
    category: 'SPORTS',
    floor: 1,
    zone: 'East Wing',
    surface: 450,
    status: 'OPEN',
    ownerName: 'Mondher Ayari',
    ownerPhone: '+216 55 100 004',
    ownerEmail: 'm.ayari@sportzone.tn',
    contractStart: '2023-09-01',
    contractEnd: '2025-08-31',
    monthlyRent: 5600,
    createdAt: '2023-09-01T00:00:00Z'
  },
  {
    id: 's-005',
    mallId: 'm-001',
    name: 'Book World',
    code: 'A-105',
    category: 'BOOKS_GIFTS',
    floor: 1,
    zone: 'North Wing',
    surface: 200,
    status: 'OPEN',
    ownerName: 'Nadia Ferchichi',
    ownerPhone: '+216 55 100 005',
    ownerEmail: 'n.ferchichi@bookworld.tn',
    contractStart: '2024-03-01',
    contractEnd: '2026-02-28',
    monthlyRent: 3100,
    createdAt: '2024-03-01T00:00:00Z'
  },
  {
    id: 's-006',
    mallId: 'm-001',
    name: 'Supermarket Plus',
    code: 'A-106',
    category: 'FOOD_BEVERAGE',
    floor: 0,
    zone: 'West Wing',
    surface: 1200,
    status: 'OPEN',
    ownerName: 'Riadh Chabbi',
    ownerPhone: '+216 55 100 006',
    ownerEmail: 'r.chabbi@superplus.tn',
    contractStart: '2023-01-01',
    contractEnd: '2027-12-31',
    monthlyRent: 12000,
    createdAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 's-007',
    mallId: 'm-001',
    name: 'Kids Land',
    code: 'A-107',
    category: 'ENTERTAINMENT',
    floor: 1,
    zone: 'South Wing',
    surface: 380,
    status: 'OPEN',
    ownerName: 'Leila Mansour',
    ownerPhone: '+216 55 100 007',
    ownerEmail: 'l.mansour@kidsland.tn',
    contractStart: '2024-04-01',
    contractEnd: '2026-03-31',
    monthlyRent: 4500,
    createdAt: '2024-04-01T00:00:00Z'
  },
  {
    id: 's-008',
    mallId: 'm-001',
    name: 'Tech Arena',
    code: 'B-201',
    category: 'ELECTRONICS',
    floor: 2,
    zone: 'North Wing',
    surface: 260,
    status: 'OPEN',
    ownerName: 'Bilel Jdidi',
    ownerPhone: '+216 55 100 008',
    ownerEmail: 'b.jdidi@techarena.tn',
    contractStart: '2024-05-01',
    contractEnd: '2026-04-30',
    monthlyRent: 3800,
    createdAt: '2024-05-01T00:00:00Z'
  },
  {
    id: 's-009',
    mallId: 'm-001',
    name: 'Glow Beauty',
    code: 'B-202',
    category: 'HEALTH_BEAUTY',
    floor: 2,
    zone: 'Central',
    surface: 150,
    status: 'UNDER_RENOVATION',
    ownerName: 'Rim Nasri',
    ownerPhone: '+216 55 100 009',
    ownerEmail: 'r.nasri@glowbeauty.tn',
    contractStart: '2024-06-01',
    contractEnd: '2026-05-31',
    monthlyRent: 2500,
    createdAt: '2024-06-01T00:00:00Z'
  },
  {
    id: 's-010',
    mallId: 'm-001',
    name: 'The Food Court',
    code: 'B-203',
    category: 'FOOD_BEVERAGE',
    floor: 2,
    zone: 'East Wing',
    surface: 600,
    status: 'OPEN',
    ownerName: 'Hatem Zouari',
    ownerPhone: '+216 55 100 010',
    ownerEmail: 'h.zouari@foodcourt.tn',
    contractStart: '2023-06-01',
    contractEnd: '2026-05-31',
    monthlyRent: 7200,
    createdAt: '2023-06-01T00:00:00Z'
  },
  {
    id: 's-011',
    mallId: 'm-001',
    name: 'Unit C-301',
    code: 'C-301',
    category: 'OTHER',
    floor: 3,
    zone: 'North Wing',
    surface: 200,
    status: 'VACANT',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    contractStart: '',
    contractEnd: '',
    monthlyRent: 0,
    createdAt: '2024-01-01T00:00:00Z',
    description: 'Available unit — 200m², ideal for restaurant or flagship store.'
  },
  {
    id: 's-012',
    mallId: 'm-001',
    name: 'Optical Vision',
    code: 'C-302',
    category: 'HEALTH_BEAUTY',
    floor: 3,
    zone: 'South Wing',
    surface: 110,
    status: 'CLOSED',
    ownerName: 'Tarek Bousbia',
    ownerPhone: '+216 55 100 012',
    ownerEmail: 't.bousbia@opticalvision.tn',
    contractStart: '2022-01-01',
    contractEnd: '2024-01-01',
    monthlyRent: 1800,
    createdAt: '2022-01-01T00:00:00Z',
    description: 'Contract expired. Renewal in negotiation.'
  }
];
