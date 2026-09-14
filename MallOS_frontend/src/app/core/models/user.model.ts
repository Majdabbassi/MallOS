// Include both frontend historical `MALL_MANAGER` and backend `MALL_USER` for compatibility
export type UserRole = 'SUPER_ADMIN' | 'MALL_MANAGER' | 'MALL_USER';

export interface User {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  mallId?: string;
  avatar?: string;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
}
