import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UIService } from '../../core/services/ui.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, AvatarComponent],
  template: `
    <aside class="admin-sidebar" [class.collapsed]="collapsed$ | async">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="logo-icon">
            <i class="pi pi-building"></i>
          </div>
          <span class="logo-text" *ngIf="!(collapsed$ | async)">Mall OS</span>
        </div>
        <button class="sidebar-toggle" (click)="toggleSidebar()">
          <i class="pi" [class]="(collapsed$ | async) ? 'pi-angle-right' : 'pi-angle-left'"></i>
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title" *ngIf="!(collapsed$ | async)">OVERVIEW</div>
          <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-item">
            <i class="pi pi-home"></i>
            <span *ngIf="!(collapsed$ | async)">Dashboard</span>
          </a>
          <a routerLink="/admin/analytics" routerLinkActive="active" class="nav-item disabled">
            <i class="pi pi-chart-bar"></i>
            <span *ngIf="!(collapsed$ | async)">Analytics</span>
            <span class="soon-badge" *ngIf="!(collapsed$ | async)">SOON</span>
          </a>
        </div>

        <div class="nav-section">
          <div class="nav-section-title" *ngIf="!(collapsed$ | async)">MANAGEMENT</div>
          <a routerLink="/admin/malls" routerLinkActive="active" class="nav-item">
            <i class="pi pi-building"></i>
            <span *ngIf="!(collapsed$ | async)">Malls</span>
          </a>
          <a routerLink="/admin/users" routerLinkActive="active" class="nav-item">
            <i class="pi pi-users"></i>
            <span *ngIf="!(collapsed$ | async)">Users</span>
          </a>
        </div>

        <div class="nav-section">
          <div class="nav-section-title" *ngIf="!(collapsed$ | async)">SYSTEM</div>
          <a routerLink="/admin/settings" routerLinkActive="active" class="nav-item disabled">
            <i class="pi pi-cog"></i>
            <span *ngIf="!(collapsed$ | async)">Settings</span>
            <span class="soon-badge" *ngIf="!(collapsed$ | async)">SOON</span>
          </a>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <app-avatar [name]="user?.fullName || ''" [size]="'small'"></app-avatar>
          <div class="user-details" *ngIf="!(collapsed$ | async)">
            <div class="user-name">{{ user?.fullName }}</div>
            <div class="user-role">Super Admin</div>
          </div>
        </div>
        <button class="logout-btn" (click)="logout()" title="Logout">
          <i class="pi pi-sign-out"></i>
          <span *ngIf="!(collapsed$ | async)">Logout</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .admin-sidebar {
      width: var(--sidebar-width);
      background: var(--color-bg-surface);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      flex-shrink: 0;
    }

    .admin-sidebar.collapsed {
      width: var(--sidebar-width-collapsed);
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px;
      border-bottom: 1px solid var(--color-border);
      height: 72px;
    }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      overflow: hidden;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
      flex-shrink: 0;
    }

    .logo-text {
      font-size: 20px;
      font-weight: 700;
      font-family: var(--font-display);
      color: var(--color-text-primary);
      white-space: nowrap;
    }

    .sidebar-toggle {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-md);
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .sidebar-toggle:hover {
      background: var(--color-border);
      color: var(--color-text-primary);
    }

    .sidebar-nav {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
    }

    .nav-section {
      margin-bottom: 24px;
    }

    .nav-section-title {
      font-size: 11px;
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      padding-left: 12px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      color: var(--color-text-secondary);
      text-decoration: none;
      transition: all 0.2s ease;
      margin-bottom: 4px;
      position: relative;
    }

    .nav-item:hover:not(.disabled) {
      background: var(--color-bg-elevated);
      color: var(--color-text-primary);
    }

    .nav-item.active {
      background: rgba(79, 142, 247, 0.15);
      color: var(--color-primary);
    }

    .nav-item.disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .nav-item i {
      font-size: 18px;
      flex-shrink: 0;
    }

    .nav-item span {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
    }

    .soon-badge {
      margin-left: auto;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      background: var(--color-bg-elevated);
      border-radius: var(--radius-sm);
      color: var(--color-text-muted);
    }

    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid var(--color-border);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--color-bg-elevated);
      border-radius: var(--radius-md);
      margin-bottom: 12px;
    }

    .user-details {
      flex: 1;
      overflow: hidden;
    }

    .user-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      font-size: 12px;
      color: var(--color-text-secondary);
    }

    .logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px;
      border-radius: var(--radius-md);
      background: transparent;
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
    }

    .logout-btn:hover {
      background: var(--color-bg-elevated);
      color: var(--color-danger);
      border-color: var(--color-danger);
    }

    .admin-sidebar.collapsed .sidebar-toggle {
      margin: 0 auto;
    }

    .admin-sidebar.collapsed .user-info {
      justify-content: center;
    }

    .admin-sidebar.collapsed .user-details {
      display: none;
    }

    .admin-sidebar.collapsed .logout-btn span {
      display: none;
    }

    .admin-sidebar.collapsed .logout-btn {
      justify-content: center;
    }
  `]
})
export class AdminSidebarComponent {
  collapsed$ = this.uiService.sidebarCollapsed$;
  user = this.auth.user;

  constructor(
    private auth: AuthService,
    private uiService: UIService,
    private router: Router
  ) {}

  toggleSidebar(): void {
    this.uiService.toggleSidebar();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
