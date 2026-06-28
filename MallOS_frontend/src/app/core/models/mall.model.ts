export type MallStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';

export interface Mall {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  companyName: string;
  managerId: string;
  status: MallStatus;
  totalStores: number;
  occupiedStores: number;
  totalAssistants: number;
  totalArea: number;
  openedYear: number;
  phone: string;
  email: string;
  website?: string;
  floorCount: number;
  createdAt: string;
  visitorsToday: number;
  salesToday: number;
}
