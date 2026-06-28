export type UserRole = 'SUPER_ADMIN' | 'MALL_MANAGER';

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
