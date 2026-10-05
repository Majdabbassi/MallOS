export interface Assistant {
  id: string;
  mallId: string;
  fullName: string;
  email: string;
  phone: string;
  permissions: AssistantPermission[];
  createdAt: string;
  lastActive?: string;
}

export interface AssistantPermission {
  key: PermissionKey;
  granted: boolean;
}

export type PermissionKey =
  | 'VIEW_STORES'
  | 'MANAGE_STORES'
  | 'VIEW_ASSISTANTS'
  | 'MANAGE_ASSISTANTS'
  | 'VIEW_TENANTS'
  | 'MANAGE_TENANTS'
  | 'VIEW_REPORTS'
  | 'EXPORT_REPORTS'
  | 'VIEW_FINANCE'
  | 'MANAGE_FINANCE'
  | 'VIEW_MAINTENANCE'
  | 'MANAGE_MAINTENANCE'
  | 'VIEW_EMPLOYEES'
  | 'MANAGE_EMPLOYEES';
