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
        path: 'floor-plan',
        loadComponent: () => import('./features/manager/floor-map-viewer/floor-map-viewer.component').then(m => m.FloorMapViewerComponent)
      },
      {
        path: 'floor-plan/new',
        loadComponent: () => import('./features/manager/floor-new/floor-new.component').then(m => m.FloorNewComponent)
      },
      {
        path: 'floor-plan/edit/:floorId',
        loadComponent: () => import('./features/manager/floor-trace-editor/floor-trace-editor.component').then(m => m.FloorTraceEditorComponent)
      },
      {
        path: 'team',
        loadComponent: () => import('./features/manager/team/team.component').then(m => m.TeamComponent)
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
        path: 'profile',
        loadComponent: () => import('./features/manager/profile/manager-profile.component').then(m => m.ManagerProfileComponent)
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