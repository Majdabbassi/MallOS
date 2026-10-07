export type MemberRole = 'MANAGER' | 'ASSISTANT';

export type MallPermission =
  | 'MANAGE_PRODUCTS' // no longer offered; may still appear on old members
  | 'MANAGE_EMPLOYEES'
  | 'VIEW_REPORTS'
  | 'EDIT_REPORTS'
  | 'MANAGE_ORDERS'
  | 'VIEW_FINANCE'
  | 'MANAGE_FINANCE'
  | 'MANAGE_STORES'
  | 'MANAGE_FLOORPLAN';

export const ALL_PERMISSIONS: { value: MallPermission; label: string }[] = [
  { value: 'MANAGE_STORES', label: 'Manage stores' },
  { value: 'MANAGE_FLOORPLAN', label: 'Edit the floor plan' },
  { value: 'VIEW_REPORTS', label: 'View reports' },
  { value: 'EDIT_REPORTS', label: 'Export reports (CSV)' },
  { value: 'VIEW_FINANCE', label: 'View finance' },
  { value: 'MANAGE_FINANCE', label: 'Manage finance' },
  { value: 'MANAGE_ORDERS', label: 'Maintenance work orders' },
  { value: 'MANAGE_EMPLOYEES', label: 'Manage the team (within their own rights)' }
];

export interface MallMember {
  userId: number;
  username: string;
  email?: string;
  role: MemberRole;
  permissions: MallPermission[];
  isActive: boolean;
  createdAt?: string;
}
