export type InvoiceStatus = 'UNPAID' | 'PAID' | 'CANCELED';

export interface Invoice {
  id: number;
  storeId: number;
  storeCode: string;
  storeName: string;
  tenantName: string | null;
  period: string;
  amount: number;
  lateFee: number;
  total: number;
  dueDate: string;
  status: InvoiceStatus;
  late: boolean;
  daysLate: number;
  paidDate: string | null;
}

export interface Debtor {
  storeId: number;
  storeCode: string;
  storeName: string;
  tenantName: string | null;
  unpaidInvoices: number;
  owed: number;
  overdue: number;
  lateFees: number;
  oldestDueDate: string | null;
}

export interface FinanceSummary {
  period: string;
  billed: number;
  collected: number;
  collectionRate: number;
  outstanding: number;
  overdue: number;
  lateFees: number;
  debtors: Debtor[];
}

export interface GenerateResult {
  period: string;
  created: number;
  alreadyBilled: number;
  notBillable: number;
}

export type LeaseState = 'VACANT' | 'EXPIRED' | 'EXPIRING' | 'LEASED';

export interface UnitState {
  storeId: number;
  code: string;
  name: string;
  floor: number;
  category: string;
  status: string;
  surface: number | null;
  monthlyRent: number | null;
  tenant: string | null;
  contractEnd: string | null;
  daysLeft: number | null;
  leaseState: LeaseState;
}

export interface FloorStats {
  level: number;
  units: number;
  leased: number;
  vacant: number;
  occupancyRate: number;
  monthlyRent: number;
  leasedSurface: number;
  rentPerSqm: number;
}

export interface CategoryStats {
  category: string;
  units: number;
  leased: number;
  monthlyRent: number;
}

export interface MallAnalytics {
  today: string;
  totalUnits: number;
  leasedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  monthlyRent: number;
  leasedSurface: number;
  rentPerSqm: number;
  vacantPotentialRent: number;
  expiringSoon: number;
  expired: number;
  floors: FloorStats[];
  categories: CategoryStats[];
  units: UnitState[];
}

export interface AuditEntry {
  id: number;
  mallId: number;
  actorName: string;
  action: string;
  entityType: string;
  entityId: number | null;
  floorLevel: number | null;
  summary: string;
  createdAt: string;
}
