import { PermissionKey } from './assistant.model';

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  description: string;
  group: PermissionGroup;
  icon: string;
}

export type PermissionGroup = 'Stores' | 'Team' | 'Analytics' | 'Finance' | 'Operations';

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Stores
  {
    key: 'VIEW_STORES',
    label: 'View Stores',
    description: 'Read-only access to store list and details',
    group: 'Stores',
    icon: 'pi pi-eye'
  },
  {
    key: 'MANAGE_STORES',
    label: 'Manage Stores',
    description: 'Create, edit, and remove stores',
    group: 'Stores',
    icon: 'pi pi-shop'
  },
  // Team
  {
    key: 'VIEW_ASSISTANTS',
    label: 'View Assistants',
    description: 'See assistant list and their permissions',
    group: 'Team',
    icon: 'pi pi-eye'
  },
  {
    key: 'MANAGE_ASSISTANTS',
    label: 'Manage Assistants',
    description: 'Add, remove, and edit assistant permissions',
    group: 'Team',
    icon: 'pi pi-users'
  },
  {
    key: 'VIEW_EMPLOYEES',
    label: 'View Employees',
    description: 'Access employee directory (future module)',
    group: 'Team',
    icon: 'pi pi-eye'
  },
  {
    key: 'MANAGE_EMPLOYEES',
    label: 'Manage Employees',
    description: 'Full HR access (future module)',
    group: 'Team',
    icon: 'pi pi-id-card'
  },
  // Analytics
  {
    key: 'VIEW_REPORTS',
    label: 'View Reports',
    description: 'Access analytics and reporting dashboards',
    group: 'Analytics',
    icon: 'pi pi-chart-bar'
  },
  {
    key: 'EXPORT_REPORTS',
    label: 'Export Reports',
    description: 'Download reports as PDF/Excel',
    group: 'Analytics',
    icon: 'pi pi-download'
  },
  // Finance
  {
    key: 'VIEW_FINANCE',
    label: 'View Finance',
    description: 'See rent, revenue, and financial data',
    group: 'Finance',
    icon: 'pi pi-eye'
  },
  {
    key: 'MANAGE_FINANCE',
    label: 'Manage Finance',
    description: 'Edit contracts, rents, invoices',
    group: 'Finance',
    icon: 'pi pi-wallet'
  },
  // Operations
  {
    key: 'VIEW_MAINTENANCE',
    label: 'View Maintenance',
    description: 'See maintenance tickets and schedules',
    group: 'Operations',
    icon: 'pi pi-eye'
  },
  {
    key: 'MANAGE_MAINTENANCE',
    label: 'Manage Maintenance',
    description: 'Create and assign maintenance tasks',
    group: 'Operations',
    icon: 'pi pi-wrench'
  }
];
