export type StoreCategory =
  | 'FASHION'
  | 'FOOD_BEVERAGE'
  | 'ELECTRONICS'
  | 'SERVICES'
  | 'ENTERTAINMENT'
  | 'HEALTH_BEAUTY'
  | 'SPORTS'
  | 'BOOKS_GIFTS'
  | 'OTHER';

export type StoreStatus = 'OPEN' | 'CLOSED' | 'UNDER_RENOVATION' | 'VACANT';

export interface Store {
  id: string;
  mallId: string;
  name: string;
  code: string;
  category: StoreCategory;
  floor: number;
  zone: string;
  surface: number;
  status: StoreStatus;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  contractStart: string;
  contractEnd: string;
  monthlyRent: number;
  createdAt: string;
  description?: string;
}

/** Exact payload the backend CreateStoreRequest DTO expects. */
export interface CreateStoreRequest {
  name: string;
  code: string;
  category: StoreCategory;
  floor: number;
  zone: string;
  surface: number;
  status: StoreStatus;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  contractStart?: string;
  contractEnd?: string;
  monthlyRent?: number;
  description?: string;
}
