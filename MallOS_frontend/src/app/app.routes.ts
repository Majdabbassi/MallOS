import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { managerGuard } from './core/guards/manager.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./layout/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'malls',
        loadComponent: () => import('./features/admin/malls/mall-list/mall-list.component').then(m => m.MallListComponent)
      },
      {
        path: 'malls/create',
        loadComponent: () => import('./features/admin/malls/mall-create/mall-create.component').then(m => m.MallCreateComponent)
      },
      {
        path: 'malls/:id',
        loadComponent: () => import('./features/admin/malls/mall-detail/mall-detail.component').then(m => m.MallDetailComponent)
      },
      {
        path: 'malls/:id/edit',
        loadComponent: () => import('./features/admin/malls/mall-edit/mall-edit.component').then(m => m.MallEditComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/users/user-list/user-list.component').then(m => m.UserListComponent)
      },
      {
        path: 'users/create',
        loadComponent: () => import('./features/admin/users/user-create/user-create.component').then(m => m.UserCreateComponent)
      },
      {
        path: 'users/:id/edit',
        loadComponent: () => import('./features/admin/users/user-edit/user-edit.component').then(m => m.UserEditComponent)
      },
      {
        path: '',
        redirectTo: '/admin/dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'mall',
    canActivate: [authGuard, managerGuard],
    loadComponent: () => import('./layout/manager-layout/manager-layout.component').then(m => m.ManagerLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/manager/dashboard/manager-dashboard.component').then(m => m.ManagerDashboardComponent)
      },
      {
        path: 'overview',
        loadComponent: () => import('./features/manager/overview/manager-overview.component').then(m => m.ManagerOverviewComponent)
      },
      {
        path: 'stores',
        loadComponent: () => import('./features/manager/stores/store-list/store-list.component').then(m => m.StoreListComponent)
      },
      {
        path: 'stores/create',
        loadComponent: () => import('./features/manager/stores/store-create/store-create.component').then(m => m.StoreCreateComponent)
      },
      {
        path: 'stores/:id',
        loadComponent: () => import('./features/manager/stores/store-detail/store-detail.component').then(m => m.StoreDetailComponent)
      },
      {
        path: 'stores/:id/edit',
        loadComponent: () => import('./features/manager/stores/store-edit/store-edit.component').then(m => m.StoreEditComponent)
      },
      {
        path: 'assistants',
        loadComponent: () => import('./features/manager/assistants/assistant-list/assistant-list.component').then(m => m.AssistantListComponent)
      },
      {
        path: 'assistants/create',
        loadComponent: () => import('./features/manager/assistants/assistant-create/assistant-create.component').then(m => m.AssistantCreateComponent)
      },
      {
        path: 'assistants/:id/edit',
        loadComponent: () => import('./features/manager/assistants/assistant-edit/assistant-edit.component').then(m => m.AssistantEditComponent)
      },
      {
        path: 'assistants/:id/permissions',
        loadComponent: () => import('./features/manager/assistants/assistant-permissions/assistant-permissions.component').then(m => m.AssistantPermissionsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/manager/profile/manager-profile.component').then(m => m.ManagerProfileComponent)
      },
      {
        path: 'tenants',
        loadComponent: () => import('./features/manager/coming-soon/manager-coming-soon.component').then(m => m.ManagerComingSoonComponent)
      },
      {
        path: 'employees',
        loadComponent: () => import('./features/manager/coming-soon/manager-coming-soon.component').then(m => m.ManagerComingSoonComponent)
      },
      {
        path: 'assets',
        loadComponent: () => import('./features/manager/coming-soon/manager-coming-soon.component').then(m => m.ManagerComingSoonComponent)
      },
      {
        path: 'maintenance',
        loadComponent: () => import('./features/manager/coming-soon/manager-coming-soon.component').then(m => m.ManagerComingSoonComponent)
      },
      {
        path: 'energy',
        loadComponent: () => import('./features/manager/coming-soon/manager-coming-soon.component').then(m => m.ManagerComingSoonComponent)
      },
      {
        path: 'sales',
        loadComponent: () => import('./features/manager/coming-soon/manager-coming-soon.component').then(m => m.ManagerComingSoonComponent)
      },
      {
        path: 'visitors',
        loadComponent: () => import('./features/manager/coming-soon/manager-coming-soon.component').then(m => m.ManagerComingSoonComponent)
      },
      {
        path: 'parking',
        loadComponent: () => import('./features/manager/coming-soon/manager-coming-soon.component').then(m => m.ManagerComingSoonComponent)
      },
      {
        path: 'security',
        loadComponent: () => import('./features/manager/coming-soon/manager-coming-soon.component').then(m => m.ManagerComingSoonComponent)
      },
      {
        path: '',
        redirectTo: '/mall/dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
