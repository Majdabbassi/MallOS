// Backend roles: users self-register as MALL_USER; SUPER_ADMIN is seeded server-side.
export type UserRole = 'SUPER_ADMIN' | 'MALL_USER';

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
