// ─── Floor Plan Models ──────────────────────────────────────────────────────

export type FloorStatus  = 'UPLOADED' | 'TRACING' | 'COMPLETED';
export type PolygonType  = 'STORE' | 'CORRIDOR' | 'BOUNDARY' | 'COMMON_AREA';
export type StoreCategory =
  | 'FASHION' | 'FOOD_BEVERAGE' | 'ELECTRONICS' | 'SERVICES'
  | 'ENTERTAINMENT' | 'HEALTH_BEAUTY' | 'SPORTS' | 'BOOKS_GIFTS' | 'OTHER';
export type StoreStatus = 'OPEN' | 'CLOSED' | 'UNDER_RENOVATION' | 'VACANT';

export interface PointDto {
  x: number;
  y: number;
}

/** Compact store snapshot embedded inside PolygonResponse */
export interface StoreDto {
  id: number;
  name: string;
  code: string;
  category: StoreCategory;
  status: StoreStatus;
  ownerName: string | null;
  surface: number | null;
  monthlyRent: number | null;
}

export interface FloorResponse {
  id: number;
  mallId: number;
  name: string;
  level: number;
  sourceImageUrl: string | null;
  width: number;
  height: number;
  status: FloorStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PolygonResponse {
  id: number;
  floorId: number;
  points: PointDto[];
  label: string | null;
  polygonType: PolygonType;
  /** Null when no store is assigned to this polygon */
  store: StoreDto | null;
  createdAt: string;
  updatedAt: string;
}

export interface GeometryResponse {
  floor: FloorResponse;
  polygons: PolygonResponse[];
}

// ─── Store API Models (full, for list/detail endpoints) ────────────────────

export interface StoreApiResponse {
  id: number;
  mallId: number;
  name: string;
  code: string;
  category: StoreCategory;
  floor: number;
  zone: string | null;
  surface: number | null;
  status: StoreStatus;
  ownerName: string | null;
  ownerPhone: string | null;
  ownerEmail: string | null;
  contractStart: string | null;
  contractEnd: string | null;
  monthlyRent: number | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePolygonRequest {
  points: PointDto[];
  label?: string;
  polygonType: PolygonType;
}

export interface UpdatePolygonRequest {
  points?: PointDto[];
  label?: string;
  polygonType?: PolygonType;
}

export interface CreateStoreRequest {
  name: string;
  code: string;
  category: StoreCategory;
  floor: number;
  zone?: string;
  surface?: number;
  status: StoreStatus;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  contractStart?: string;
  contractEnd?: string;
  monthlyRent?: number;
  description?: string;
}

/** Color palette for polygon types */
export const POLYGON_TYPE_COLORS: Record<PolygonType, { fill: string; stroke: string }> = {
  STORE:       { fill: 'rgba(99, 102, 241, 0.35)',  stroke: '#6366f1' },
  CORRIDOR:    { fill: 'rgba(148, 163, 184, 0.20)', stroke: '#94a3b8' },
  BOUNDARY:    { fill: 'rgba(239, 68, 68, 0.20)',   stroke: '#ef4444' },
  COMMON_AREA: { fill: 'rgba(16, 185, 129, 0.25)',  stroke: '#10b981' },
};

export const STORE_STATUS_COLORS: Record<StoreStatus, string> = {
  OPEN:             '#10b981',
  CLOSED:           '#ef4444',
  UNDER_RENOVATION: '#f59e0b',
  VACANT:           '#64748b',
};
